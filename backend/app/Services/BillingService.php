<?php

namespace App\Services;

use App\Enums\BillingPeriod;
use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Discount;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Subscription;
use App\Models\SubscriptionLine;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BillingService
{
    public function __construct(
        private readonly DiscountService $discountService,
        private readonly SubscriptionService $subscriptionService,
    ) {}

    /**
     * BIL-01: List due subscriptions.
     */
    public function getDueSubscriptions(string $asOfDate, int $perPage = 15): LengthAwarePaginator
    {
        $paginator = Subscription::query()
            ->with(['customer', 'plan', 'paymentTerm'])
            ->where('status', SubscriptionStatus::Active->value)
            ->where('is_paused', false)
            ->where('next_invoice_date', '<=', $asOfDate)
            ->whereColumn('next_invoice_date', '<=', 'expiry_date')
            ->orderBy('next_invoice_date', 'asc')
            ->orderBy('id', 'asc')
            ->paginate($perPage);

        $asOf = Carbon::parse($asOfDate);

        $paginator->getCollection()->transform(function (Subscription $sub) use ($asOf) {
            $periods = $this->calculatePeriods($sub, $asOf);
            $periodsDue = count($periods);

            $sub->periods_due = $periodsDue;
            $sub->estimated_total = number_format((float) $sub->total * $periodsDue, 2, '.', '');

            return $sub;
        });

        return $paginator;
    }

    /**
     * Calculate due periods for a subscription up to as_of_date.
     *
     * @return array<int, array{start: Carbon, end: Carbon}>
     */
    public function calculatePeriods(Subscription $sub, Carbon $asOf): array
    {
        if (! $sub->next_invoice_date || ! $sub->expiry_date) {
            return [];
        }

        $cursor = Carbon::parse($sub->next_invoice_date);
        $expiry = Carbon::parse($sub->expiry_date);
        $periods = [];

        while ($cursor->lte($asOf) && $cursor->lte($expiry)) {
            $periodStart = $cursor->copy();

            $periodEnd = match ($sub->plan->billing_period) {
                BillingPeriod::Daily => $periodStart->copy(),
                BillingPeriod::Weekly => $periodStart->copy()->addDays(6),
                BillingPeriod::Monthly => $periodStart->copy()->addMonth()->subDay(),
                BillingPeriod::Yearly => $periodStart->copy()->addYear()->subDay(),
            };

            if ($periodEnd->gt($expiry)) {
                $periodEnd = $expiry->copy();
            }

            $periods[] = [
                'start' => $periodStart,
                'end' => $periodEnd,
            ];

            $cursor = $periodEnd->copy()->addDay();
        }

        return $periods;
    }

    /**
     * BIL-02: Run billing engine (BR-5, BR-6, BR-3).
     *
     * @param  array<int, int>|null  $subscriptionIds
     * @return array{as_of_date: string, processed: int, invoices_created: int, skipped: int, failed: int, auto_closed: int, failures: array<int, array{subscription_id: int, number: string|null, message: string}>}
     */
    public function runBilling(?string $asOfDate = null, ?array $subscriptionIds = null, ?int $userId = null): array
    {
        $asOf = $asOfDate ? Carbon::parse($asOfDate) : now()->startOfDay();
        $asOfDateStr = $asOf->toDateString();

        // 1. Auto-close expired subscriptions first (BR-4)
        $autoClosed = $this->subscriptionService->autoClose($asOfDateStr);

        // 2. Query due subscriptions
        $query = Subscription::query()
            ->with(['plan.tax', 'customer', 'paymentTerm', 'lines.tax', 'discounts.products'])
            ->where('status', SubscriptionStatus::Active->value)
            ->where('is_paused', false)
            ->where('next_invoice_date', '<=', $asOfDateStr)
            ->whereColumn('next_invoice_date', '<=', 'expiry_date');

        if (! empty($subscriptionIds)) {
            $query->whereIn('id', $subscriptionIds);
        }

        $subscriptions = $query->orderBy('id', 'asc')->get();

        $processed = 0;
        $invoicesCreated = 0;
        $skipped = 0;
        $failed = 0;
        $failures = [];

        // 3. Process each subscription in its own transaction (BR-5)
        foreach ($subscriptions as $sub) {
            $processed++;

            try {
                DB::transaction(function () use (
                    $sub,
                    $asOf,
                    $asOfDateStr,
                    $userId,
                    &$invoicesCreated,
                    &$skipped
                ) {
                    $lockedSub = Subscription::query()
                        ->with(['plan.tax', 'customer', 'paymentTerm', 'lines.tax', 'discounts.products'])
                        ->where('id', $sub->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if (
                        $lockedSub->status !== SubscriptionStatus::Active
                        || $lockedSub->is_paused
                        || ! $lockedSub->next_invoice_date
                        || $lockedSub->next_invoice_date->toDateString() > $asOfDateStr
                        || $lockedSub->next_invoice_date->toDateString() > $lockedSub->expiry_date->toDateString()
                    ) {
                        return;
                    }

                    $expiry = Carbon::parse($lockedSub->expiry_date);
                    $cursor = Carbon::parse($lockedSub->next_invoice_date);

                    while ($cursor->lte($asOf) && $cursor->lte($expiry)) {
                        $periodStart = $cursor->copy();

                        $periodEnd = match ($lockedSub->plan->billing_period) {
                            BillingPeriod::Daily => $periodStart->copy(),
                            BillingPeriod::Weekly => $periodStart->copy()->addDays(6),
                            BillingPeriod::Monthly => $periodStart->copy()->addMonth()->subDay(),
                            BillingPeriod::Yearly => $periodStart->copy()->addYear()->subDay(),
                        };

                        if ($periodEnd->gt($expiry)) {
                            $periodEnd = $expiry->copy();
                        }

                        // Check if invoice exists for (subscription_id, period_start)
                        $exists = Invoice::where('subscription_id', $lockedSub->id)
                            ->where('period_start', $periodStart->toDateString())
                            ->exists();

                        if ($exists) {
                            $skipped++;
                        } else {
                            $this->generateInvoiceForPeriod(
                                $lockedSub,
                                $periodStart,
                                $periodEnd,
                                $asOfDateStr,
                                $userId
                            );
                            $invoicesCreated++;
                        }

                        $cursor = $periodEnd->copy()->addDay();
                    }

                    // Update subscription next_invoice_date
                    if ($cursor->gt($expiry)) {
                        $lockedSub->next_invoice_date = null;
                    } else {
                        $lockedSub->next_invoice_date = $cursor->toDateString();
                    }

                    $lockedSub->save();
                });
            } catch (\Throwable $e) {
                $failed++;
                $failures[] = [
                    'subscription_id' => $sub->id,
                    'number' => $sub->number,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return [
            'as_of_date' => $asOfDateStr,
            'processed' => $processed,
            'invoices_created' => $invoicesCreated,
            'skipped' => $skipped,
            'failed' => $failed,
            'auto_closed' => $autoClosed,
            'failures' => $failures,
        ];
    }

    /**
     * Generate an invoice for a specific subscription and period (BR-5, BR-6, BR-3).
     */
    private function generateInvoiceForPeriod(
        Subscription $sub,
        Carbon $periodStart,
        Carbon $periodEnd,
        string $asOfDate,
        ?int $userId
    ): Invoice {
        $paymentTerm = $sub->paymentTerm;
        $dueDays = $paymentTerm ? (int) $paymentTerm->due_days : 0;
        $dueDate = Carbon::parse($asOfDate)->addDays($dueDays)->toDateString();

        $invoice = Invoice::create([
            'subscription_id' => $sub->id,
            'customer_id' => $sub->customer_id,
            'payment_term_id' => $sub->payment_term_id,
            'status' => InvoiceStatus::Draft,
            'invoice_date' => $asOfDate,
            'due_date' => $dueDate,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'subtotal' => 0,
            'discount_total' => 0,
            'tax_total' => 0,
            'total' => 0,
            'amount_paid' => 0,
            'amount_due' => 0,
            'notes' => $sub->notes,
            'created_by' => $userId ?? $sub->created_by,
        ]);

        $subLines = $sub->lines()->with('tax')->orderBy('sort_order', 'asc')->orderBy('id', 'asc')->get();

        // 1. Line-level discounts (applies_to = products)
        $lineData = [];
        $totalProductQty = 0;
        $grossAfterLineDiscountsTotal = 0.0;
        $usedDiscountIds = [];

        // Preload eligible product discounts with locks
        $eligibleProductDiscounts = Discount::query()
            ->with('products')
            ->where('applies_to', DiscountAppliesTo::Products->value)
            ->where('is_active', true)
            ->where('start_date', '<=', $asOfDate)
            ->where('end_date', '>=', $asOfDate)
            ->where(function ($q) {
                $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
            })
            ->orderBy('id', 'asc')
            ->get();

        foreach ($subLines as $subLine) {
            $qty = (int) $subLine->quantity;
            $unitPrice = (float) $subLine->unit_price;
            $gross = round($qty * $unitPrice, 2);

            $chosenDiscount = null;
            $maxLineDiscountAmount = 0.0;

            if ($subLine->product_id !== null) {
                $totalProductQty += $qty;

                foreach ($eligibleProductDiscounts as $candidate) {
                    $hasProduct = $candidate->products->contains('id', $subLine->product_id);
                    if (! $hasProduct) {
                        continue;
                    }

                    if ($candidate->min_quantity !== null && $qty < (int) $candidate->min_quantity) {
                        continue;
                    }

                    if ($candidate->min_purchase !== null && $gross < (float) $candidate->min_purchase) {
                        continue;
                    }

                    $val = (float) $candidate->value;
                    $candidateAmount = match ($candidate->type) {
                        DiscountType::Percentage => round($gross * $val / 100.0, 2),
                        DiscountType::Fixed => min($val, $gross),
                    };

                    if ($candidateAmount > $maxLineDiscountAmount) {
                        $maxLineDiscountAmount = $candidateAmount;
                        $chosenDiscount = $candidate;
                    }
                }
            }

            if ($chosenDiscount && $maxLineDiscountAmount > 0.0) {
                $usedDiscountIds[$chosenDiscount->id] = true;
            }

            $netAfterLineDiscount = max(0.0, round($gross - $maxLineDiscountAmount, 2));
            $grossAfterLineDiscountsTotal += $netAfterLineDiscount;

            $lineData[] = [
                'sub_line' => $subLine,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'gross' => $gross,
                'line_discount_id' => $chosenDiscount?->id,
                'line_discount_amount' => $maxLineDiscountAmount,
                'net_after_line_discount' => $netAfterLineDiscount,
                'sub_discount_amount' => 0.0,
            ];
        }

        // 2. Subscription-level discount (applies_to = subscription)
        $chosenSubDiscount = null;
        $maxSubDiscountAmount = 0.0;

        $attachedSubDiscounts = $sub->discounts()
            ->where('applies_to', DiscountAppliesTo::Subscription->value)
            ->where('is_active', true)
            ->where('start_date', '<=', $asOfDate)
            ->where('end_date', '>=', $asOfDate)
            ->where(function ($q) {
                $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
            })
            ->orderBy('id', 'asc')
            ->get();

        foreach ($attachedSubDiscounts as $candidate) {
            if ($candidate->min_purchase !== null && $grossAfterLineDiscountsTotal < (float) $candidate->min_purchase) {
                continue;
            }

            if ($candidate->min_quantity !== null && $totalProductQty < (int) $candidate->min_quantity) {
                continue;
            }

            $val = (float) $candidate->value;
            $candidateAmount = match ($candidate->type) {
                DiscountType::Percentage => round($grossAfterLineDiscountsTotal * $val / 100.0, 2),
                DiscountType::Fixed => min($val, $grossAfterLineDiscountsTotal),
            };

            if ($candidateAmount > $maxSubDiscountAmount) {
                $maxSubDiscountAmount = $candidateAmount;
                $chosenSubDiscount = $candidate;
            }
        }

        if ($chosenSubDiscount && $maxSubDiscountAmount > 0.0) {
            $invoice->discount_id = $chosenSubDiscount->id;
            $usedDiscountIds[$chosenSubDiscount->id] = true;

            // Spread subscription discount proportionally across lines based on net_after_line_discount
            $allocated = 0.0;
            $numLines = count($lineData);

            if ($grossAfterLineDiscountsTotal > 0.0 && $numLines > 0) {
                for ($i = 0; $i < $numLines; $i++) {
                    $net = $lineData[$i]['net_after_line_discount'];

                    if ($i === $numLines - 1) {
                        // Last line takes rounding remainder
                        $share = min($net, round($maxSubDiscountAmount - $allocated, 2));
                    } else {
                        $share = round($maxSubDiscountAmount * ($net / $grossAfterLineDiscountsTotal), 2);
                        $share = min($net, $share);
                        $allocated += $share;
                    }

                    $lineData[$i]['sub_discount_amount'] = $share;
                }
            }
        }

        // 3. Increment usage for each distinct discount used on this invoice
        foreach (array_keys($usedDiscountIds) as $discId) {
            Discount::where('id', $discId)->lockForUpdate()->increment('used_count');
        }

        // 4. Create InvoiceLines and compute taxes and totals (BR-3 & BR-7)
        $invoiceSubtotal = 0.0;
        $invoiceDiscountTotal = 0.0;
        $invoiceTaxTotal = 0.0;

        foreach ($lineData as $item) {
            /** @var SubscriptionLine $subLine */
            $subLine = $item['sub_line'];
            $qty = $item['quantity'];
            $unitPrice = $item['unit_price'];
            $gross = $item['gross'];
            $totalLineDiscount = round($item['line_discount_amount'] + $item['sub_discount_amount'], 2);
            $net = max(0.0, round($gross - $totalLineDiscount, 2));

            // Snapshot tax from live Tax model
            $tax = $subLine->tax;
            $taxName = $tax?->name;
            $taxType = $tax?->type?->value;
            $taxRate = $tax ? (float) $tax->rate : 0.0;
            $taxAmount = 0.0;

            if ($tax && $taxRate > 0.0 && $net > 0.0) {
                if ($taxType === 'percentage') {
                    $taxAmount = round($net * $taxRate / 100.0, 2);
                } else {
                    $taxAmount = round($taxRate, 2);
                }
            }

            $lineTotal = round($gross - $totalLineDiscount + $taxAmount, 2);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'product_id' => $subLine->product_id,
                'variant_id' => $subLine->variant_id,
                'description' => $subLine->description,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'discount_id' => $item['line_discount_id'],
                'discount_amount' => $totalLineDiscount,
                'tax_id' => $subLine->tax_id,
                'tax_name' => $taxName,
                'tax_type' => $taxType,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'line_total' => $lineTotal,
                'sort_order' => $subLine->sort_order,
            ]);

            $invoiceSubtotal += $gross;
            $invoiceDiscountTotal += $totalLineDiscount;
            $invoiceTaxTotal += $taxAmount;
        }

        $invoiceTotal = round($invoiceSubtotal - $invoiceDiscountTotal + $invoiceTaxTotal, 2);

        $invoice->update([
            'subtotal' => $invoiceSubtotal,
            'discount_total' => $invoiceDiscountTotal,
            'tax_total' => $invoiceTaxTotal,
            'total' => $invoiceTotal,
            'amount_paid' => 0.00,
            'amount_due' => $invoiceTotal,
        ]);

        return $invoice;
    }
}

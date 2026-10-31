<?php

namespace App\Services;

use App\Enums\DiscountState;
use App\Enums\Role;
use App\Enums\SubscriptionLineType;
use App\Enums\SubscriptionStatus;
use App\Enums\TaxType;
use App\Exceptions\ConflictException;
use App\Models\Discount;
use App\Models\Plan;
use App\Models\Product;
use App\Models\QuotationTemplate;
use App\Models\Subscription;
use App\Models\Tax;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    /**
     * Relations the SubscriptionResource needs (BR-12: always eager-loaded here).
     *
     * @return array<int|string, mixed>
     */
    public static function detailRelations(): array
    {
        $withTrashed = fn ($query) => $query->withTrashed();

        return [
            'customer' => $withTrashed,
            'plan' => $withTrashed,
            'paymentTerm',
            'lines' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'lines.product' => $withTrashed,
            'lines.variant' => $withTrashed,
            'lines.tax',
            'discounts',
        ];
    }

    /**
     * SUB-01: admin/staff see all, customers only their own.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters, User $user): LengthAwarePaginator
    {
        $withTrashed = fn ($query) => $query->withTrashed();
        $direction = $filters['direction'] ?? 'desc';

        return Subscription::query()
            ->with(['customer' => $withTrashed, 'plan' => $withTrashed])
            ->when($user->role === Role::Customer, fn ($query) => $query->whereHas(
                'customer',
                fn ($customer) => $customer->where('user_id', $user->id),
            ))
            ->when(filled($filters['status'] ?? null), fn ($query) => $query->where('status', $filters['status']))
            ->when(filled($filters['customer_id'] ?? null), fn ($query) => $query->where('customer_id', $filters['customer_id']))
            ->when(filled($filters['plan_id'] ?? null), fn ($query) => $query->where('plan_id', $filters['plan_id']))
            ->when(isset($filters['is_paused']), fn ($query) => $query->where(
                'is_paused',
                filter_var($filters['is_paused'], FILTER_VALIDATE_BOOLEAN),
            ))
            ->when(filled($filters['start_from'] ?? null), fn ($query) => $query->where('start_date', '>=', $filters['start_from']))
            ->when(filled($filters['start_to'] ?? null), fn ($query) => $query->where('start_date', '<=', $filters['start_to']))
            ->when(filled($filters['expiry_from'] ?? null), fn ($query) => $query->where('expiry_date', '>=', $filters['expiry_from']))
            ->when(filled($filters['expiry_to'] ?? null), fn ($query) => $query->where('expiry_date', '<=', $filters['expiry_to']))
            ->when(filled($filters['search'] ?? null), fn ($query) => $query->where(
                fn ($inner) => $inner->where('number', 'ilike', '%'.$filters['search'].'%')
                    ->orWhereHas('customer', fn ($customer) => $customer->where('name', 'ilike', '%'.$filters['search'].'%')),
            ))
            ->orderBy($filters['sort'] ?? 'created_at', $direction)
            ->orderBy('id', $direction)
            ->paginate($filters['per_page'] ?? 15);
    }

    public function show(Subscription $subscription): Subscription
    {
        return $subscription->load(self::detailRelations());
    }

    /**
     * SUB-02: plan and lines fall back to the quotation template when absent.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $user): Subscription
    {
        [$planId, $lines] = $this->resolvePlanAndLines($data);

        return DB::transaction(function () use ($data, $user, $planId, $lines) {
            $subscription = Subscription::create([
                'customer_id' => $data['customer_id'],
                'plan_id' => $planId,
                'quotation_template_id' => $data['quotation_template_id'] ?? null,
                'payment_term_id' => $data['payment_term_id'],
                'status' => SubscriptionStatus::Draft,
                'start_date' => $data['start_date'],
                'expiry_date' => $data['expiry_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            $this->syncLines($subscription, Plan::with('tax')->findOrFail($planId), $lines ?? []);

            return $subscription->refresh()->load(self::detailRelations());
        });
    }

    /**
     * SUB-04: only draft/quotation; lines replaced, plan line regenerated, totals recomputed.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ConflictException
     */
    public function update(Subscription $subscription, array $data): Subscription
    {
        [$planId, $lines] = $this->resolvePlanAndLines($data);

        return $this->transition($subscription, function (Subscription $locked) use ($data, $planId, $lines): void {
            if (! in_array($locked->status, [SubscriptionStatus::Draft, SubscriptionStatus::Quotation], true)) {
                throw new ConflictException('Only draft or quotation subscriptions can be edited.');
            }

            $locked->fill([
                'customer_id' => $data['customer_id'],
                'plan_id' => $planId,
                'quotation_template_id' => $data['quotation_template_id'] ?? null,
                'payment_term_id' => $data['payment_term_id'],
                'start_date' => $data['start_date'],
                'expiry_date' => $data['expiry_date'],
                'notes' => $data['notes'] ?? null,
            ])->save();

            $this->syncLines($locked, Plan::with('tax')->findOrFail($planId), $lines ?? []);
        });
    }

    /**
     * SUB-05: only draft; soft delete.
     *
     * @throws ConflictException
     */
    public function delete(Subscription $subscription): void
    {
        DB::transaction(function () use ($subscription): void {
            $locked = Subscription::whereKey($subscription->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== SubscriptionStatus::Draft) {
                throw new ConflictException('Only draft subscriptions can be deleted.');
            }

            $locked->delete();
        });
    }

    /**
     * SUB-06: draft -> quotation, valid for template.validity_days (30 without a template).
     */
    public function sendQuotation(Subscription $subscription): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked): void {
            if ($locked->status !== SubscriptionStatus::Draft) {
                throw new ConflictException('Only draft subscriptions can be sent as a quotation.');
            }

            $validityDays = $locked->quotation_template_id
                ? QuotationTemplate::withTrashed()->whereKey($locked->quotation_template_id)->value('validity_days')
                : null;

            $locked->status = SubscriptionStatus::Quotation;
            $locked->quotation_valid_until = today()->addDays($validityDays ?? 30);
            $locked->save();
        });
    }

    /**
     * SUB-07: quotation -> confirmed while the quotation is still valid.
     */
    public function confirm(Subscription $subscription): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked): void {
            if ($locked->status !== SubscriptionStatus::Quotation) {
                throw new ConflictException('Only quotations can be confirmed.');
            }

            if ($locked->quotation_valid_until && $locked->quotation_valid_until->lt(today())) {
                throw new ConflictException('Quotation expired');
            }

            $locked->status = SubscriptionStatus::Confirmed;
            $locked->save();
        });
    }

    /**
     * SUB-08: confirmed -> active, billing starts at start_date.
     */
    public function activate(Subscription $subscription): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked): void {
            if ($locked->status !== SubscriptionStatus::Confirmed) {
                throw new ConflictException('Only confirmed subscriptions can be activated.');
            }

            $locked->status = SubscriptionStatus::Active;
            $locked->next_invoice_date = $locked->start_date;
            $locked->save();
        });
    }

    /**
     * SUB-09
     */
    public function pause(Subscription $subscription): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked): void {
            if ($locked->status !== SubscriptionStatus::Active) {
                throw new ConflictException('Only active subscriptions can be paused.');
            }

            if ($locked->is_paused) {
                throw new ConflictException('Subscription is already paused.');
            }

            if (! $locked->plan->pausable) {
                throw new ConflictException('This plan does not allow pausing.');
            }

            $locked->is_paused = true;
            $locked->paused_at = now();
            $locked->save();
        });
    }

    /**
     * SUB-10: paused time is not back-billed.
     */
    public function resume(Subscription $subscription): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked): void {
            if ($locked->status !== SubscriptionStatus::Active || ! $locked->is_paused) {
                throw new ConflictException('Only paused active subscriptions can be resumed.');
            }

            $locked->is_paused = false;
            $locked->paused_at = null;

            if ($locked->next_invoice_date && $locked->next_invoice_date->lt(today())) {
                $locked->next_invoice_date = today();
            }

            $locked->save();
        });
    }

    /**
     * SUB-11
     */
    public function close(Subscription $subscription, ?string $reason): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked) use ($reason): void {
            if (! in_array($locked->status, [SubscriptionStatus::Confirmed, SubscriptionStatus::Active], true)) {
                throw new ConflictException('Only confirmed or active subscriptions can be closed.');
            }

            if (! $locked->plan->closable) {
                throw new ConflictException('This plan does not allow closing.');
            }

            $locked->status = SubscriptionStatus::Closed;
            $locked->closed_at = now();
            $locked->close_reason = $reason;
            $locked->next_invoice_date = null;
            $locked->save();
        });
    }

    /**
     * SUB-12
     */
    public function renew(Subscription $subscription, string $newExpiryDate): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked) use ($newExpiryDate): void {
            if ($locked->status !== SubscriptionStatus::Active) {
                throw new ConflictException('Only active subscriptions can be renewed.');
            }

            if (! $locked->plan->renewable) {
                throw new ConflictException('This plan does not allow renewal.');
            }

            $newExpiry = Carbon::parse($newExpiryDate)->startOfDay();
            $oldExpiry = $locked->expiry_date->copy();

            if ($newExpiry->lte($oldExpiry)) {
                throw ValidationException::withMessages([
                    'new_expiry_date' => ['The new expiry date must be after the current expiry date.'],
                ]);
            }

            $locked->expiry_date = $newExpiry;

            if ($locked->next_invoice_date === null) {
                $locked->next_invoice_date = $oldExpiry->addDay();
            }

            $locked->save();
        });
    }

    /**
     * SUB-13: duplicates are ignored.
     */
    public function attachDiscount(Subscription $subscription, int $discountId): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked) use ($discountId): void {
            $this->ensureDiscountsEditable($locked);
            $locked->discounts()->syncWithoutDetaching([$discountId]);
        });
    }

    /**
     * SUB-14
     */
    public function detachDiscount(Subscription $subscription, int $discountId): Subscription
    {
        return $this->transition($subscription, function (Subscription $locked) use ($discountId): void {
            $this->ensureDiscountsEditable($locked);
            $locked->discounts()->detach($discountId);
        });
    }

    /**
     * `subscriptions:auto-close`: close expired active subscriptions whose plan has auto_close.
     */
    public function autoClose(): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::Active->value)
            ->where('expiry_date', '<', today())
            ->whereHas('plan', fn ($query) => $query->withTrashed()->where('auto_close', true))
            ->update([
                'status' => SubscriptionStatus::Closed->value,
                'closed_at' => now(),
                'close_reason' => 'Expired',
                'next_invoice_date' => null,
                'updated_at' => now(),
            ]);
    }

    /**
     * BR-4 allowed_actions from status + plan flags + role. Customers only get pause/resume/close/renew.
     *
     * @return array<int, string>
     */
    public function allowedActions(Subscription $subscription, ?User $user): array
    {
        $staff = $user !== null && $user->role !== Role::Customer;
        $status = $subscription->status;
        $active = $status === SubscriptionStatus::Active;
        $plan = $subscription->plan;

        $actions = [
            'edit' => $staff && in_array($status, [SubscriptionStatus::Draft, SubscriptionStatus::Quotation], true),
            'delete' => $staff && $status === SubscriptionStatus::Draft,
            'send_quotation' => $staff && $status === SubscriptionStatus::Draft,
            'confirm' => $staff && $status === SubscriptionStatus::Quotation,
            'activate' => $staff && $status === SubscriptionStatus::Confirmed,
            'pause' => $active && ! $subscription->is_paused && $plan->pausable,
            'resume' => $active && $subscription->is_paused,
            'close' => in_array($status, [SubscriptionStatus::Confirmed, SubscriptionStatus::Active], true) && $plan->closable,
            'renew' => $active && $plan->renewable,
            'add_discount' => $staff && $status !== SubscriptionStatus::Closed,
        ];

        return array_keys(array_filter($actions));
    }

    /**
     * BR-6.4 derived discount state.
     */
    public function discountState(Discount $discount): DiscountState
    {
        return match (true) {
            ! $discount->is_active => DiscountState::Inactive,
            $discount->usage_limit !== null && $discount->used_count >= $discount->usage_limit => DiscountState::Exhausted,
            $discount->end_date->lt(today()) => DiscountState::Expired,
            $discount->start_date->gt(today()) => DiscountState::Scheduled,
            default => DiscountState::Active,
        };
    }

    /**
     * Plan is available when active and today is within its dates.
     */
    public function isPlanAvailable(Plan $plan): bool
    {
        return $plan->is_active
            && $plan->start_date->lte(today())
            && ($plan->end_date === null || $plan->end_date->gte(today()));
    }

    /**
     * Effective plan id and product lines: request values, or the quotation template's when absent.
     *
     * @param  array<string, mixed>  $data
     * @return array{0: int|null, 1: array<int, array<string, mixed>>|null}
     */
    public function resolvePlanAndLines(array $data): array
    {
        $planId = $data['plan_id'] ?? null;
        $lines = $data['lines'] ?? null;

        if (($planId === null || $lines === null) && filled($data['quotation_template_id'] ?? null)) {
            $template = QuotationTemplate::with('lines')->find($data['quotation_template_id']);

            if ($template) {
                $planId ??= $template->plan_id;
                $lines ??= $template->lines->map(fn ($line) => [
                    'product_id' => $line->product_id,
                    'variant_id' => $line->variant_id,
                    'quantity' => $line->quantity,
                ])->all();
            }
        }

        return [$planId === null ? null : (int) $planId, $lines];
    }

    /**
     * Lock the row, run the change, return the subscription loaded for the resource.
     *
     * @param  Closure(Subscription): void  $change
     */
    private function transition(Subscription $subscription, Closure $change): Subscription
    {
        return DB::transaction(function () use ($subscription, $change) {
            $locked = Subscription::whereKey($subscription->id)->lockForUpdate()->firstOrFail();
            $locked->load(['plan' => fn ($query) => $query->withTrashed()]);

            $change($locked);

            return $locked->load(self::detailRelations());
        });
    }

    private function ensureDiscountsEditable(Subscription $subscription): void
    {
        if ($subscription->status === SubscriptionStatus::Closed) {
            throw new ConflictException('Discounts cannot be changed on a closed subscription.');
        }
    }

    /**
     * BR-1/BR-2/BR-3/BR-7: rebuild the plan line and product lines, then store the totals.
     *
     * @param  array<int, array<string, mixed>>  $productLines
     */
    private function syncLines(Subscription $subscription, Plan $plan, array $productLines): void
    {
        $products = Product::withTrashed()
            ->with(['tax', 'variants'])
            ->whereIn('id', array_column($productLines, 'product_id'))
            ->get()
            ->keyBy('id');

        $rows = [[
            'line_type' => SubscriptionLineType::Plan,
            'product_id' => null,
            'variant_id' => null,
            'description' => "Plan: {$plan->name} ({$plan->billing_period->value})",
            'quantity' => 1,
            'unit_price' => (float) $plan->price,
            'tax' => $plan->tax,
        ]];

        foreach ($productLines as $line) {
            $product = $products[$line['product_id']];
            $variant = filled($line['variant_id'] ?? null) ? $product->variants->firstWhere('id', (int) $line['variant_id']) : null;

            $rows[] = [
                'line_type' => SubscriptionLineType::Product,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'description' => $variant ? "{$product->name} - {$variant->attribute}: {$variant->value}" : $product->name,
                'quantity' => (int) $line['quantity'],
                'unit_price' => (float) $product->sales_price + (float) ($variant?->extra_price ?? 0),
                'tax' => $product->tax,
            ];
        }

        $subtotal = 0.0;
        $taxTotal = 0.0;
        $records = [];

        foreach ($rows as $sortOrder => $row) {
            $amount = round($row['quantity'] * $row['unit_price'], 2);
            $taxAmount = $this->taxAmount($amount, $row['tax']);
            $subtotal += $amount;
            $taxTotal += $taxAmount;

            $records[] = [
                'line_type' => $row['line_type'],
                'product_id' => $row['product_id'],
                'variant_id' => $row['variant_id'],
                'description' => $row['description'],
                'quantity' => $row['quantity'],
                'unit_price' => $this->money($row['unit_price']),
                'tax_id' => $row['tax']?->id,
                'amount' => $this->money($amount),
                'tax_amount' => $this->money($taxAmount),
                'sort_order' => $sortOrder,
            ];
        }

        $subscription->lines()->delete();
        $subscription->lines()->createMany($records);

        $subscription->update([
            'subtotal' => $this->money($subtotal),
            'tax_total' => $this->money($taxTotal),
            'total' => $this->money($subtotal + $taxTotal),
        ]);
    }

    /**
     * BR-3 tax: percentage of the amount, or a flat rate per line (0 when the amount is 0).
     */
    private function taxAmount(float $amount, ?Tax $tax): float
    {
        if (! $tax) {
            return 0.0;
        }

        return match ($tax->type) {
            TaxType::Percentage => round($amount * (float) $tax->rate / 100, 2),
            TaxType::Fixed => $amount > 0 ? (float) $tax->rate : 0.0,
        };
    }

    private function money(float $value): string
    {
        return number_format(round($value, 2), 2, '.', '');
    }
}

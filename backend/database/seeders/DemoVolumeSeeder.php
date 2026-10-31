<?php

namespace Database\Seeders;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\SubscriptionLineType;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\PaymentTerm;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DemoVolumeSeeder extends Seeder
{
    public function run(): void
    {
        ini_set('memory_limit', '512M');

        $this->command?->info('Seeding demo volume data (300 customers, 3,000 subscriptions, 8,000 invoices, 6,000 payments)...');

        $admin = User::where('role', 'admin')->first() ?? User::first();
        $adminId = $admin?->id;

        $plans = Plan::with('tax')->get();
        if ($plans->isEmpty()) {
            $this->command?->error('Plans must be seeded before DemoVolumeSeeder.');

            return;
        }

        $paymentTerms = PaymentTerm::all();
        if ($paymentTerms->isEmpty()) {
            $this->command?->error('Payment terms must be seeded before DemoVolumeSeeder.');

            return;
        }

        $taxes = Tax::all()->keyBy('name');
        $tax18 = $taxes['GST 18%'] ?? Tax::first();

        $crmSeat = Product::where('name', 'Brightloop CRM Seat')->first() ?? Product::first();

        // 1. Seed 300 Customers
        $this->command?->info('Generating 300 customers...');
        $cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata'];
        $states = ['Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'West Bengal'];

        $existingVolumeCustomers = Customer::where('email', 'like', 'vol_customer_%@example.com')->pluck('id')->all();
        $customerIds = [];

        if (count($existingVolumeCustomers) >= 300) {
            $customerIds = array_slice($existingVolumeCustomers, 0, 300);
        } else {
            $now = now();
            $batch = [];
            for ($i = 1; $i <= 300; $i++) {
                $cityIdx = ($i - 1) % count($cities);
                $batch[] = [
                    'name' => "Volume Customer {$i}",
                    'email' => "vol_customer_{$i}@example.com",
                    'company_name' => "Volume Enterprise {$i} Pvt Ltd",
                    'phone' => '+9198'.str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                    'address_line' => "Tower {$i}, Business Bay",
                    'city' => $cities[$cityIdx],
                    'state' => $states[$cityIdx],
                    'country' => 'India',
                    'postal_code' => (string) (560000 + ($i % 100)),
                    'created_at' => $now->copy()->subDays(180 - ($i % 150)),
                    'updated_at' => $now,
                ];

                if (count($batch) >= 100) {
                    DB::table('customers')->insert($batch);
                    $batch = [];
                }
            }
            if (! empty($batch)) {
                DB::table('customers')->insert($batch);
            }

            $customerIds = Customer::where('email', 'like', 'vol_customer_%@example.com')
                ->orderBy('id')
                ->limit(300)
                ->pluck('id')
                ->all();
        }

        // 2. Seed 3,000 Subscriptions
        $this->command?->info('Generating 3,000 subscriptions...');
        $planCount = $plans->count();
        $termCount = $paymentTerms->count();
        $custCount = count($customerIds);

        // Status distribution:
        // Active: 1800, Closed: 900, Draft: 100, Quotation: 100, Confirmed: 100 = 3000
        $statuses = [];
        for ($i = 0; $i < 1800; $i++) {
            $statuses[] = SubscriptionStatus::Active->value;
        }
        for ($i = 0; $i < 900; $i++) {
            $statuses[] = SubscriptionStatus::Closed->value;
        }
        for ($i = 0; $i < 100; $i++) {
            $statuses[] = SubscriptionStatus::Draft->value;
        }
        for ($i = 0; $i < 100; $i++) {
            $statuses[] = SubscriptionStatus::Quotation->value;
        }
        for ($i = 0; $i < 100; $i++) {
            $statuses[] = SubscriptionStatus::Confirmed->value;
        }

        $maxSubIdBefore = DB::table('subscriptions')->max('id') ?? 0;
        $today = Carbon::today();
        $subBatch = [];

        for ($i = 1; $i <= 3000; $i++) {
            $status = $statuses[$i - 1];
            $customerId = $customerIds[($i - 1) % $custCount];
            $plan = $plans[($i - 1) % $planCount];
            $term = $paymentTerms[($i - 1) % $termCount];

            $isPaused = ($status === SubscriptionStatus::Active->value && $i % 40 === 0);
            $startDate = $today->copy()->subDays(60 + ($i % 120));
            $expiryDate = $startDate->copy()->addDays(365);

            $nextInvoiceDate = null;
            if ($status === SubscriptionStatus::Active->value) {
                if ($isPaused) {
                    $nextInvoiceDate = $today->copy()->addDays(15);
                } else {
                    $offset = ($i % 5 === 0) ? -5 : (($i % 3 === 0) ? 0 : 15);
                    $nextInvoiceDate = $today->copy()->addDays($offset);
                }
            }

            $closedAt = ($status === SubscriptionStatus::Closed->value) ? $today->copy()->subDays(10 + ($i % 30)) : null;
            $closeReason = ($status === SubscriptionStatus::Closed->value) ? 'Contract completed' : null;
            $quotationValid = ($status === SubscriptionStatus::Quotation->value) ? $today->copy()->addDays(14) : null;

            $planPrice = (float) $plan->price;
            $planTax = round($planPrice * 0.18, 2);
            $prodGross = 2400.00;
            $prodTax = 432.00;
            $subtotal = $planPrice + $prodGross;
            $taxTotal = $planTax + $prodTax;
            $total = $subtotal + $taxTotal;

            $createdAt = $startDate->copy()->subDays(2);

            $subBatch[] = [
                'number' => null,
                'customer_id' => $customerId,
                'plan_id' => $plan->id,
                'quotation_template_id' => null,
                'payment_term_id' => $term->id,
                'status' => $status,
                'is_paused' => $isPaused,
                'paused_at' => $isPaused ? $today->copy()->subDays(5) : null,
                'start_date' => $startDate->toDateString(),
                'expiry_date' => $expiryDate->toDateString(),
                'quotation_valid_until' => $quotationValid?->toDateString(),
                'next_invoice_date' => $nextInvoiceDate?->toDateString(),
                'notes' => "Volume subscription {$i}",
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'tax_total' => number_format($taxTotal, 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
                'closed_at' => $closedAt,
                'close_reason' => $closeReason,
                'created_by' => $adminId,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            if (count($subBatch) >= 500) {
                DB::table('subscriptions')->insert($subBatch);
                $subBatch = [];
            }
        }

        if (! empty($subBatch)) {
            DB::table('subscriptions')->insert($subBatch);
            $subBatch = [];
        }

        $this->updateNumbers('subscriptions', 'SUB-', $maxSubIdBefore);

        // 3. Seed Subscription Lines (2 lines per subscription = 6,000 lines)
        $this->command?->info('Generating 6,000 subscription lines...');
        $subLineBatch = [];

        DB::table('subscriptions')
            ->where('id', '>', $maxSubIdBefore)
            ->select('id', 'plan_id')
            ->orderBy('id')
            ->chunk(500, function ($subs) use (&$subLineBatch, $plans, $tax18, $crmSeat) {
                foreach ($subs as $sub) {
                    $plan = $plans->firstWhere('id', $sub->plan_id);
                    $planPrice = (float) $plan->price;
                    $planTax = round($planPrice * 0.18, 2);

                    $subLineBatch[] = [
                        'subscription_id' => $sub->id,
                        'line_type' => SubscriptionLineType::Plan->value,
                        'product_id' => null,
                        'variant_id' => null,
                        'description' => "Plan: {$plan->name} ({$plan->billing_period->value})",
                        'quantity' => 1,
                        'unit_price' => number_format($planPrice, 2, '.', ''),
                        'tax_id' => $tax18?->id,
                        'amount' => number_format($planPrice, 2, '.', ''),
                        'tax_amount' => number_format($planTax, 2, '.', ''),
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $subLineBatch[] = [
                        'subscription_id' => $sub->id,
                        'line_type' => SubscriptionLineType::Product->value,
                        'product_id' => $crmSeat?->id,
                        'variant_id' => null,
                        'description' => $crmSeat?->name ?? 'CRM Seat',
                        'quantity' => 2,
                        'unit_price' => '1200.00',
                        'tax_id' => $tax18?->id,
                        'amount' => '2400.00',
                        'tax_amount' => '432.00',
                        'sort_order' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if (count($subLineBatch) >= 500) {
                        DB::table('subscription_lines')->insert($subLineBatch);
                        $subLineBatch = [];
                    }
                }
            });

        if (! empty($subLineBatch)) {
            DB::table('subscription_lines')->insert($subLineBatch);
            $subLineBatch = [];
        }

        // 4. Seed 8,000 Invoices across statuses
        $this->command?->info('Generating 8,000 invoices...');
        $invoiceStatuses = [];
        for ($i = 0; $i < 5500; $i++) {
            $invoiceStatuses[] = InvoiceStatus::Paid->value;
        }
        for ($i = 0; $i < 1500; $i++) {
            $invoiceStatuses[] = InvoiceStatus::Confirmed->value;
        }
        for ($i = 0; $i < 500; $i++) {
            $invoiceStatuses[] = InvoiceStatus::Draft->value;
        }
        for ($i = 0; $i < 500; $i++) {
            $invoiceStatuses[] = InvoiceStatus::Cancelled->value;
        }

        $maxInvIdBefore = DB::table('invoices')->max('id') ?? 0;
        $invBatch = [];
        $invIdx = 0;

        // Iterate through subscriptions in chunks to build invoices
        $newSubs = DB::table('subscriptions')
            ->where('id', '>', $maxSubIdBefore)
            ->select('id', 'customer_id', 'payment_term_id', 'start_date', 'total')
            ->orderBy('id')
            ->get();

        $subsCount = $newSubs->count();

        for ($s = 0; $s < $subsCount; $s++) {
            $sub = $newSubs[$s];
            $countForThisSub = ($s < 2000) ? 3 : 2;
            $subStart = Carbon::parse($sub->start_date);

            for ($periodNum = 0; $periodNum < $countForThisSub; $periodNum++) {
                if ($invIdx >= 8000) {
                    break 2;
                }

                $st = $invoiceStatuses[$invIdx];
                $periodStart = $subStart->copy()->addMonths($periodNum);
                $periodEnd = $periodStart->copy()->addMonth()->subDay();

                $invoiceDate = $periodStart->copy();
                $term = $paymentTerms->firstWhere('id', $sub->payment_term_id);
                $dueDays = $term?->due_days ?? 15;
                $dueDate = $invoiceDate->copy()->addDays($dueDays);

                $tot = (float) $sub->total;
                $subtot = round($tot / 1.18, 2);
                $taxTot = round($tot - $subtot, 2);

                $paid = 0.00;
                $due = $tot;
                $sentAt = null;
                $cancelledAt = null;
                $cancelReason = null;

                if ($st === InvoiceStatus::Paid->value) {
                    $paid = $tot;
                    $due = 0.00;
                    $sentAt = $invoiceDate->copy()->addHour();
                } elseif ($st === InvoiceStatus::Confirmed->value) {
                    $sentAt = $invoiceDate->copy()->addHour();
                    if ($invIdx % 3 === 0) {
                        $dueDate = $today->copy()->subDays(5 + ($invIdx % 60));
                    } else {
                        $dueDate = $today->copy()->addDays(10 + ($invIdx % 20));
                    }
                    if ($invIdx % 5 === 0) {
                        $paid = round($tot * 0.4, 2);
                        $due = round($tot - $paid, 2);
                    }
                } elseif ($st === InvoiceStatus::Cancelled->value) {
                    $cancelledAt = $invoiceDate->copy()->addDays(2);
                    $cancelReason = 'Customer requested cancellation';
                }

                $invBatch[] = [
                    'number' => null,
                    'subscription_id' => $sub->id,
                    'customer_id' => $sub->customer_id,
                    'payment_term_id' => $sub->payment_term_id,
                    'status' => $st,
                    'invoice_date' => $invoiceDate->toDateString(),
                    'due_date' => $dueDate->toDateString(),
                    'period_start' => $periodStart->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'subtotal' => number_format($subtot, 2, '.', ''),
                    'discount_total' => '0.00',
                    'tax_total' => number_format($taxTot, 2, '.', ''),
                    'total' => number_format($tot, 2, '.', ''),
                    'amount_paid' => number_format($paid, 2, '.', ''),
                    'amount_due' => number_format($due, 2, '.', ''),
                    'discount_id' => null,
                    'sent_at' => $sentAt,
                    'cancelled_at' => $cancelledAt,
                    'cancel_reason' => $cancelReason,
                    'notes' => "Volume invoice {$invIdx}",
                    'created_by' => $adminId,
                    'created_at' => $invoiceDate,
                    'updated_at' => $invoiceDate,
                ];

                $invIdx++;

                if (count($invBatch) >= 500) {
                    DB::table('invoices')->insert($invBatch);
                    $invBatch = [];
                }
            }
        }

        if (! empty($invBatch)) {
            DB::table('invoices')->insert($invBatch);
            $invBatch = [];
        }

        $this->updateNumbers('invoices', 'INV-', $maxInvIdBefore);

        // 5. Seed Invoice Lines
        $this->command?->info('Generating 16,000 invoice lines...');
        $invLineBatch = [];

        DB::table('invoices')
            ->where('id', '>', $maxInvIdBefore)
            ->select('id')
            ->orderBy('id')
            ->chunk(500, function ($invoices) use (&$invLineBatch, $crmSeat, $tax18) {
                foreach ($invoices as $inv) {
                    $invLineBatch[] = [
                        'invoice_id' => $inv->id,
                        'product_id' => null,
                        'variant_id' => null,
                        'description' => 'Plan Subscription Fee',
                        'quantity' => 1,
                        'unit_price' => '999.00',
                        'discount_id' => null,
                        'discount_amount' => '0.00',
                        'tax_id' => $tax18?->id,
                        'tax_name' => 'GST 18%',
                        'tax_type' => 'percentage',
                        'tax_rate' => '18.00',
                        'tax_amount' => '179.82',
                        'line_total' => '1178.82',
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $invLineBatch[] = [
                        'invoice_id' => $inv->id,
                        'product_id' => $crmSeat?->id,
                        'variant_id' => null,
                        'description' => 'Brightloop CRM Seat',
                        'quantity' => 2,
                        'unit_price' => '1200.00',
                        'discount_id' => null,
                        'discount_amount' => '0.00',
                        'tax_id' => $tax18?->id,
                        'tax_name' => 'GST 18%',
                        'tax_type' => 'percentage',
                        'tax_rate' => '18.00',
                        'tax_amount' => '432.00',
                        'line_total' => '2832.00',
                        'sort_order' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if (count($invLineBatch) >= 500) {
                        DB::table('invoice_lines')->insert($invLineBatch);
                        $invLineBatch = [];
                    }
                }
            });

        if (! empty($invLineBatch)) {
            DB::table('invoice_lines')->insert($invLineBatch);
            $invLineBatch = [];
        }

        // 6. Seed 6,000 Payments
        $this->command?->info('Generating 6,000 payments...');
        $methods = [
            PaymentMethod::BankTransfer->value,
            PaymentMethod::Card->value,
            PaymentMethod::Upi->value,
            PaymentMethod::Cash->value,
            PaymentMethod::Cheque->value,
        ];
        $methodCount = count($methods);

        $payBatch = [];
        $pCount = 0;

        DB::table('invoices')
            ->where('id', '>', $maxInvIdBefore)
            ->whereIn('status', [InvoiceStatus::Paid->value, InvoiceStatus::Confirmed->value])
            ->select('id', 'customer_id', 'status', 'total', 'amount_paid', 'invoice_date')
            ->orderBy('id')
            ->chunk(500, function ($invoices) use (&$payBatch, &$pCount, $methods, $methodCount, $adminId) {
                foreach ($invoices as $inv) {
                    if ($pCount >= 6000) {
                        return false;
                    }

                    $invDate = Carbon::parse($inv->invoice_date);
                    $payDate = $invDate->copy()->addDays(2);
                    $tot = (float) $inv->total;

                    if ($inv->status === InvoiceStatus::Paid->value) {
                        if ($pCount < 500 && $pCount + 2 <= 6000) {
                            $half1 = round($tot / 2, 2);
                            $half2 = round($tot - $half1, 2);

                            $payBatch[] = [
                                'invoice_id' => $inv->id,
                                'customer_id' => $inv->customer_id,
                                'method' => $methods[$pCount % $methodCount],
                                'amount' => number_format($half1, 2, '.', ''),
                                'payment_date' => $payDate->toDateString(),
                                'reference' => 'PAY-'.str_pad((string) ($pCount + 1), 7, '0', STR_PAD_LEFT),
                                'note' => 'Partial installment 1',
                                'recorded_by' => $adminId,
                                'created_at' => $payDate,
                                'updated_at' => $payDate,
                            ];
                            $pCount++;

                            $payBatch[] = [
                                'invoice_id' => $inv->id,
                                'customer_id' => $inv->customer_id,
                                'method' => $methods[$pCount % $methodCount],
                                'amount' => number_format($half2, 2, '.', ''),
                                'payment_date' => $payDate->copy()->addDays(3)->toDateString(),
                                'reference' => 'PAY-'.str_pad((string) ($pCount + 1), 7, '0', STR_PAD_LEFT),
                                'note' => 'Final installment 2',
                                'recorded_by' => $adminId,
                                'created_at' => $payDate->copy()->addDays(3),
                                'updated_at' => $payDate->copy()->addDays(3),
                            ];
                            $pCount++;
                        } else {
                            $payBatch[] = [
                                'invoice_id' => $inv->id,
                                'customer_id' => $inv->customer_id,
                                'method' => $methods[$pCount % $methodCount],
                                'amount' => number_format($tot, 2, '.', ''),
                                'payment_date' => $payDate->toDateString(),
                                'reference' => 'PAY-'.str_pad((string) ($pCount + 1), 7, '0', STR_PAD_LEFT),
                                'note' => 'Full payment',
                                'recorded_by' => $adminId,
                                'created_at' => $payDate,
                                'updated_at' => $payDate,
                            ];
                            $pCount++;
                        }
                    } elseif ($inv->status === InvoiceStatus::Confirmed->value && (float) $inv->amount_paid > 0) {
                        $paidAmt = (float) $inv->amount_paid;

                        $payBatch[] = [
                            'invoice_id' => $inv->id,
                            'customer_id' => $inv->customer_id,
                            'method' => $methods[$pCount % $methodCount],
                            'amount' => number_format($paidAmt, 2, '.', ''),
                            'payment_date' => $payDate->toDateString(),
                            'reference' => 'PAY-'.str_pad((string) ($pCount + 1), 7, '0', STR_PAD_LEFT),
                            'note' => 'Partial payment',
                            'recorded_by' => $adminId,
                            'created_at' => $payDate,
                            'updated_at' => $payDate,
                        ];
                        $pCount++;
                    }

                    if (count($payBatch) >= 500) {
                        DB::table('payments')->insert($payBatch);
                        $payBatch = [];
                    }
                }
            });

        if (! empty($payBatch)) {
            DB::table('payments')->insert($payBatch);
            $payBatch = [];
        }

        $this->command?->info("Demo volume seeded successfully: 300 customers, 3,000 subscriptions, 8,000 invoices, {$pCount} payments.");
    }

    private function updateNumbers(string $table, string $prefix, int $fromId): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("UPDATE {$table} SET number = '{$prefix}' || LPAD(id::text, 6, '0') WHERE id > {$fromId} AND number IS NULL");
        } elseif ($driver === 'sqlite') {
            DB::statement("UPDATE {$table} SET number = '{$prefix}' || printf('%06d', id) WHERE id > {$fromId} AND number IS NULL");
        } else {
            DB::statement("UPDATE {$table} SET number = CONCAT('{$prefix}', LPAD(id, 6, '0')) WHERE id > {$fromId} AND number IS NULL");
        }
    }
}

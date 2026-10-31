<?php

namespace Database\Seeders;

use App\Enums\BillingPeriod;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\SubscriptionLineType;
use App\Enums\SubscriptionStatus;
use App\Enums\TaxType;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Invoice;
use App\Models\PaymentTerm;
use App\Models\Plan;
use App\Models\Product;
use App\Models\QuotationTemplate;
use App\Models\Subscription;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * 12 demo subscriptions across all statuses and 3 invoices (1 paid, 1 confirmed overdue, 1 draft).
 * Line math follows BR-1, BR-2 and BR-3; numbers come from the observers (BR-11).
 */
class DemoSubscriptionSeeder extends Seeder
{
    private User $admin;

    private PaymentTerm $paymentTerm;

    /** @var Collection<string, Plan> */
    private Collection $plans;

    /** @var Collection<string, Product> */
    private Collection $products;

    public function run(): void
    {
        DB::transaction(function (): void {
            $this->admin = User::where('email', 'admin@brightloop.test')->firstOrFail();
            $this->paymentTerm = PaymentTerm::where('name', 'Net 15')->firstOrFail();
            $this->plans = Plan::with('tax')->get()->keyBy('name');
            $this->products = Product::with(['tax', 'variants'])->get()->keyBy('name');

            $template = QuotationTemplate::where('name', 'Standard SMB Offer')->firstOrFail();
            $loyalty = Discount::where('name', 'Loyalty 500 Off')->firstOrFail();

            $demo = Customer::where('email', 'customer@brightloop.test')->firstOrFail();
            $acme = Customer::create(['name' => 'Acme Corp', 'email' => 'acme@example.test', 'company_name' => 'Acme Corp']);
            $globex = Customer::create(['name' => 'Globex Ltd', 'email' => 'globex@example.test', 'company_name' => 'Globex Ltd']);
            $initech = Customer::create(['name' => 'Initech Pvt Ltd', 'email' => 'initech@example.test', 'company_name' => 'Initech Pvt Ltd']);

            $today = today();
            $smbLines = [['Brightloop CRM Seat', 2], ['Extra Storage 100GB', 1]];

            // Active, due for billing (next_invoice_date <= today).
            $s1Start = $today->copy()->subDays(35);
            $s1 = $this->subscription($demo, 'Monthly Starter', SubscriptionStatus::Active, $s1Start, $today->copy()->addDays(330), $smbLines, [
                'next_invoice_date' => $this->periodEnd($s1Start, BillingPeriod::Monthly)->addDay(),
            ]);

            $s2Start = $today->copy()->subDays(40);
            $s2 = $this->subscription($acme, 'Monthly Starter', SubscriptionStatus::Active, $s2Start, $today->copy()->addDays(325), [['Brightloop CRM Seat', 12]], [
                'next_invoice_date' => $this->periodEnd($s2Start, BillingPeriod::Monthly)->addDay(),
            ]);

            $this->subscription($globex, 'Weekly Trial', SubscriptionStatus::Active, $today->copy()->subDays(14), $today->copy()->addDays(76), [['Priority Support', 1]], [
                'next_invoice_date' => $today->copy()->subDays(14),
            ]);

            $s4 = $this->subscription($initech, 'Yearly Business', SubscriptionStatus::Active, $today->copy(), $today->copy()->addDays(364), [['Brightloop CRM Seat', 5], ['Brightloop Business Suite', 5, 'Odoo']], [
                'next_invoice_date' => $today->copy(),
            ]);
            $s4->discounts()->attach($loyalty->id);

            // Active, paused / not due.
            $this->subscription($demo, 'Monthly Starter', SubscriptionStatus::Active, $today->copy()->subDays(20), $today->copy()->addDays(345), [['Extra Storage 100GB', 1]], [
                'is_paused' => true,
                'paused_at' => now()->subDays(5),
                'next_invoice_date' => $today->copy()->addDays(10),
            ]);

            $s6Start = $today->copy()->subDays(10);
            $s6 = $this->subscription($globex, 'Monthly Starter', SubscriptionStatus::Active, $s6Start, $today->copy()->addDays(355), [['Extra Storage 100GB', 2]], [
                'next_invoice_date' => $this->periodEnd($s6Start, BillingPeriod::Monthly)->addDay(),
            ]);

            // Draft.
            $this->subscription($demo, 'Monthly Starter', SubscriptionStatus::Draft, $today->copy(), $today->copy()->addDays(365), $smbLines, [
                'quotation_template_id' => $template->id,
            ]);
            $this->subscription($initech, 'Weekly Trial', SubscriptionStatus::Draft, $today->copy()->addDays(7), $today->copy()->addDays(97), [['Priority Support', 1]]);

            // Quotation.
            $this->subscription($acme, 'Monthly Starter', SubscriptionStatus::Quotation, $today->copy()->addDays(7), $today->copy()->addDays(372), $smbLines, [
                'quotation_template_id' => $template->id,
                'quotation_valid_until' => $today->copy()->addDays(14),
            ]);

            // Confirmed.
            $this->subscription($globex, 'Daily Pass', SubscriptionStatus::Confirmed, $today->copy()->addDay(), $today->copy()->addDays(31), [['Onboarding Kit', 1]], [
                'quotation_valid_until' => $today->copy()->addDays(10),
            ]);

            // Closed.
            $this->subscription($initech, 'Weekly Trial', SubscriptionStatus::Closed, $today->copy()->subDays(60), $today->copy()->subDays(2), [['Priority Support', 1]], [
                'closed_at' => now()->subDay(),
                'close_reason' => 'Expired',
            ]);
            $this->subscription($demo, 'Daily Pass', SubscriptionStatus::Closed, $today->copy()->subDays(30), $today->copy()->subDays(10), [['Extra Storage 100GB', 1]], [
                'closed_at' => now()->subDays(10),
                'close_reason' => 'Customer request',
            ]);

            // Invoices: 1 paid, 1 confirmed overdue, 1 draft.
            $i1 = $this->invoice($s1, InvoiceStatus::Paid, $today->copy()->subDays(35), $today->copy()->subDays(20));
            $i1->payments()->create([
                'customer_id' => $i1->customer_id,
                'method' => PaymentMethod::Upi,
                'amount' => $i1->total,
                'payment_date' => $today->copy()->subDays(25),
                'reference' => 'UPI-DEMO-001',
                'recorded_by' => $this->admin->id,
            ]);

            $this->invoice($s2, InvoiceStatus::Confirmed, $today->copy()->subDays(40), $today->copy()->subDays(25));
            $this->invoice($s6, InvoiceStatus::Draft, $today->copy()->subDays(10), $today->copy()->addDays(5));
        });
    }

    /**
     * Create a subscription with its plan line (BR-2) and product lines (BR-1), then store totals (BR-3).
     *
     * @param  array<int, array{0: string, 1: int, 2?: string}>  $productLines  [product name, quantity, variant value]
     * @param  array<string, mixed>  $extra
     */
    private function subscription(
        Customer $customer,
        string $planName,
        SubscriptionStatus $status,
        Carbon $start,
        Carbon $expiry,
        array $productLines,
        array $extra = [],
    ): Subscription {
        $plan = $this->plans[$planName];

        $subscription = Subscription::create([
            'customer_id' => $customer->id,
            'plan_id' => $plan->id,
            'payment_term_id' => $this->paymentTerm->id,
            'status' => $status,
            'start_date' => $start,
            'expiry_date' => $expiry,
            'created_by' => $this->admin->id,
            ...$extra,
        ]);

        $lines = [[
            'line_type' => SubscriptionLineType::Plan,
            'product_id' => null,
            'variant_id' => null,
            'description' => "Plan: {$plan->name} ({$plan->billing_period->value})",
            'quantity' => 1,
            'unit_price' => (float) $plan->price,
            'tax' => $plan->tax,
        ]];

        foreach ($productLines as $line) {
            $product = $this->products[$line[0]];
            $variant = isset($line[2]) ? $product->variants->firstWhere('value', $line[2]) : null;

            $lines[] = [
                'line_type' => SubscriptionLineType::Product,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'description' => $variant ? "{$product->name} - {$variant->attribute}: {$variant->value}" : $product->name,
                'quantity' => $line[1],
                'unit_price' => (float) $product->sales_price + (float) ($variant?->extra_price ?? 0),
                'tax' => $product->tax,
            ];
        }

        $subtotal = 0.0;
        $taxTotal = 0.0;

        foreach ($lines as $sortOrder => $line) {
            $amount = round($line['quantity'] * $line['unit_price'], 2);
            $taxAmount = $this->taxAmount($amount, $line['tax']);
            $subtotal += $amount;
            $taxTotal += $taxAmount;

            $subscription->lines()->create([
                'line_type' => $line['line_type'],
                'product_id' => $line['product_id'],
                'variant_id' => $line['variant_id'],
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $this->money($line['unit_price']),
                'tax_id' => $line['tax']?->id,
                'amount' => $this->money($amount),
                'tax_amount' => $this->money($taxAmount),
                'sort_order' => $sortOrder,
            ]);
        }

        $subscription->update([
            'subtotal' => $this->money($subtotal),
            'tax_total' => $this->money($taxTotal),
            'total' => $this->money($subtotal + $taxTotal),
        ]);

        return $subscription;
    }

    /**
     * Invoice for the subscription's first period, lines copied with a tax snapshot (BR-7), totals per BR-3.
     */
    private function invoice(Subscription $subscription, InvoiceStatus $status, Carbon $invoiceDate, Carbon $dueDate): Invoice
    {
        $subscription->load(['lines.tax', 'plan']);

        $periodEnd = $this->periodEnd($subscription->start_date, $subscription->plan->billing_period);
        if ($periodEnd->gt($subscription->expiry_date)) {
            $periodEnd = $subscription->expiry_date->copy();
        }

        $subtotal = (float) $subscription->subtotal;
        $taxTotal = (float) $subscription->tax_total;
        $total = round($subtotal + $taxTotal, 2);
        $amountPaid = $status === InvoiceStatus::Paid ? $total : 0.0;

        $invoice = Invoice::create([
            'subscription_id' => $subscription->id,
            'customer_id' => $subscription->customer_id,
            'payment_term_id' => $subscription->payment_term_id,
            'status' => $status,
            'invoice_date' => $invoiceDate,
            'due_date' => $dueDate,
            'period_start' => $subscription->start_date,
            'period_end' => $periodEnd,
            'subtotal' => $this->money($subtotal),
            'discount_total' => '0.00',
            'tax_total' => $this->money($taxTotal),
            'total' => $this->money($total),
            'amount_paid' => $this->money($amountPaid),
            'amount_due' => $this->money($total - $amountPaid),
            'created_by' => $this->admin->id,
        ]);

        foreach ($subscription->lines as $line) {
            $invoice->lines()->create([
                'product_id' => $line->product_id,
                'variant_id' => $line->variant_id,
                'description' => $line->description,
                'quantity' => $line->quantity,
                'unit_price' => $line->unit_price,
                'discount_amount' => '0.00',
                'tax_id' => $line->tax_id,
                'tax_name' => $line->tax?->name,
                'tax_type' => $line->tax?->type->value,
                'tax_rate' => $line->tax?->rate ?? '0.00',
                'tax_amount' => $line->tax_amount,
                'line_total' => $this->money((float) $line->amount + (float) $line->tax_amount),
                'sort_order' => $line->sort_order,
            ]);
        }

        return $invoice;
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

    /**
     * Last day of the billing period that starts on $start (BR-5).
     */
    private function periodEnd(Carbon $start, BillingPeriod $period): Carbon
    {
        return match ($period) {
            BillingPeriod::Daily => $start->copy(),
            BillingPeriod::Weekly => $start->copy()->addDays(6),
            BillingPeriod::Monthly => $start->copy()->addMonthNoOverflow()->subDay(),
            BillingPeriod::Yearly => $start->copy()->addYearNoOverflow()->subDay(),
        };
    }

    private function money(float $value): string
    {
        return number_format(round($value, 2), 2, '.', '');
    }
}

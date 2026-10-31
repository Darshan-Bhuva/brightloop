<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\PaymentTerm;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subscription_id' => Subscription::factory(),
            'customer_id' => Customer::factory(),
            'payment_term_id' => PaymentTerm::factory(),
            'status' => InvoiceStatus::Draft,
            'invoice_date' => today(),
            'due_date' => today()->addDays(15),
            'period_start' => today(),
            'period_end' => today()->addMonthNoOverflow()->subDay(),
            'subtotal' => '0.00',
            'discount_total' => '0.00',
            'tax_total' => '0.00',
            'total' => '0.00',
            'amount_paid' => '0.00',
            'amount_due' => '0.00',
        ];
    }
}

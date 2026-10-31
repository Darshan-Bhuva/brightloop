<?php

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\PaymentTerm;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'plan_id' => Plan::factory(),
            'quotation_template_id' => null,
            'payment_term_id' => PaymentTerm::factory(),
            'status' => SubscriptionStatus::Draft,
            'is_paused' => false,
            'start_date' => today(),
            'expiry_date' => today()->addYear(),
            'subtotal' => '0.00',
            'tax_total' => '0.00',
            'total' => '0.00',
        ];
    }
}

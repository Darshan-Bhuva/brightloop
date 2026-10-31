<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invoice_id' => Invoice::factory(),
            'customer_id' => Customer::factory(),
            'method' => fake()->randomElement(PaymentMethod::cases()),
            'amount' => number_format(fake()->numberBetween(100, 5000), 2, '.', ''),
            'payment_date' => today(),
            'reference' => null,
            'note' => null,
            'recorded_by' => null,
        ];
    }
}

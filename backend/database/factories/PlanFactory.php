<?php

namespace Database\Factories;

use App\Enums\BillingPeriod;
use App\Models\Plan;
use App\Models\Tax;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->unique()->words(2, true)).' Plan',
            'price' => number_format(fake()->numberBetween(49, 9999), 2, '.', ''),
            'billing_period' => fake()->randomElement(BillingPeriod::cases()),
            'min_quantity' => 1,
            'start_date' => today()->subDays(30),
            'end_date' => null,
            'tax_id' => Tax::factory(),
            'auto_close' => false,
            'closable' => true,
            'pausable' => false,
            'renewable' => false,
            'is_active' => true,
        ];
    }
}

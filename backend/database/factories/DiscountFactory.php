<?php

namespace Database\Factories;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Models\Discount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discount>
 */
class DiscountFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->unique()->words(2, true)).' Discount',
            'code' => null,
            'type' => DiscountType::Percentage,
            'value' => '10.00',
            'applies_to' => DiscountAppliesTo::Subscription,
            'min_purchase' => null,
            'min_quantity' => null,
            'start_date' => today()->subDays(10),
            'end_date' => today()->addDays(30),
            'usage_limit' => null,
            'used_count' => 0,
            'is_active' => true,
        ];
    }
}

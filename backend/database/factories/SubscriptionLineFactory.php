<?php

namespace Database\Factories;

use App\Enums\SubscriptionLineType;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SubscriptionLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubscriptionLine>
 */
class SubscriptionLineFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);
        $unitPrice = fake()->numberBetween(100, 2000);

        return [
            'subscription_id' => Subscription::factory(),
            'line_type' => SubscriptionLineType::Product,
            'product_id' => Product::factory(),
            'variant_id' => null,
            'description' => fake()->words(3, true),
            'quantity' => $quantity,
            'unit_price' => number_format($unitPrice, 2, '.', ''),
            'tax_id' => null,
            'amount' => number_format($quantity * $unitPrice, 2, '.', ''),
            'tax_amount' => '0.00',
            'sort_order' => 1,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'attribute' => 'Brand',
            'value' => fake()->unique()->company(),
            'extra_price' => number_format(fake()->numberBetween(0, 600), 2, '.', ''),
        ];
    }
}

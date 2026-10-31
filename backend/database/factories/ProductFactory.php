<?php

namespace Database\Factories;

use App\Enums\ProductType;
use App\Models\Product;
use App\Models\Tax;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sales = fake()->numberBetween(100, 5000);

        return [
            'name' => ucwords(fake()->unique()->words(3, true)),
            'type' => fake()->randomElement(ProductType::cases()),
            'sales_price' => number_format($sales, 2, '.', ''),
            'cost_price' => number_format($sales * 0.4, 2, '.', ''),
            'tax_id' => Tax::factory(),
            'notes' => null,
            'is_active' => true,
        ];
    }
}

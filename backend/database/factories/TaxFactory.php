<?php

namespace Database\Factories;

use App\Enums\TaxType;
use App\Models\Tax;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tax>
 */
class TaxFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rate = fake()->randomElement(['5.00', '12.00', '18.00']);

        return [
            'name' => 'GST '.(int) $rate.'%',
            'type' => TaxType::Percentage,
            'rate' => $rate,
            'is_active' => true,
        ];
    }
}

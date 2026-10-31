<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\QuotationTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuotationTemplate>
 */
class QuotationTemplateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->unique()->words(3, true)).' Offer',
            'validity_days' => 30,
            'plan_id' => Plan::factory(),
            'notes' => null,
            'created_by' => null,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\QuotationTemplate;
use App\Models\QuotationTemplateLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuotationTemplateLine>
 */
class QuotationTemplateLineFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quotation_template_id' => QuotationTemplate::factory(),
            'product_id' => Product::factory(),
            'variant_id' => null,
            'quantity' => fake()->numberBetween(1, 5),
        ];
    }
}

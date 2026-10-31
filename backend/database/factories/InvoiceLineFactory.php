<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvoiceLine>
 */
class InvoiceLineFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);
        $unitPrice = fake()->numberBetween(100, 2000);
        $amount = number_format($quantity * $unitPrice, 2, '.', '');

        return [
            'invoice_id' => Invoice::factory(),
            'product_id' => null,
            'variant_id' => null,
            'description' => fake()->words(3, true),
            'quantity' => $quantity,
            'unit_price' => number_format($unitPrice, 2, '.', ''),
            'discount_amount' => '0.00',
            'tax_rate' => '0.00',
            'tax_amount' => '0.00',
            'line_total' => $amount,
            'sort_order' => 0,
        ];
    }
}

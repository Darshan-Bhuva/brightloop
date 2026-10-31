<?php

namespace App\Http\Resources;

use App\Models\InvoiceLine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin InvoiceLine
 */
class InvoiceLineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'description' => $this->description,
            'quantity' => (int) $this->quantity,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'discount_amount' => number_format((float) $this->discount_amount, 2, '.', ''),
            'discount_name' => $this->discount?->name,
            'tax_name' => $this->tax_name,
            'tax_rate' => number_format((float) $this->tax_rate, 2, '.', ''),
            'tax_amount' => number_format((float) $this->tax_amount, 2, '.', ''),
            'line_total' => number_format((float) $this->line_total, 2, '.', ''),
        ];
    }
}

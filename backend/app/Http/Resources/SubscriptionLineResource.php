<?php

namespace App\Http\Resources;

use App\Models\SubscriptionLine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Callers eager-load product, variant and tax (SubscriptionService::detailRelations()).
 *
 * @mixin SubscriptionLine
 */
class SubscriptionLineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'line_type' => $this->line_type->value,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'variant_id' => $this->variant_id,
            'variant_label' => $this->variant ? "{$this->variant->attribute}: {$this->variant->value}" : null,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'tax_id' => $this->tax_id,
            'tax_name' => $this->tax?->name,
            'tax_rate' => $this->tax?->rate ?? '0.00',
            'amount' => $this->amount,
            'tax_amount' => $this->tax_amount,
            'total' => number_format(round((float) $this->amount + (float) $this->tax_amount, 2), 2, '.', ''),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Models\QuotationTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Callers eager-load QuotationTemplateService::relations().
 *
 * @mixin QuotationTemplate
 */
class QuotationTemplateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'validity_days' => $this->validity_days,
            'plan_id' => $this->plan_id,
            'plan' => [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'billing_period' => $this->plan->billing_period->value,
                'price' => $this->plan->price,
            ],
            'notes' => $this->notes,
            'lines' => $this->lines->map(fn ($line) => [
                'id' => $line->id,
                'product_id' => $line->product_id,
                'product' => ['id' => $line->product->id, 'name' => $line->product->name],
                'variant_id' => $line->variant_id,
                'variant' => $line->variant ? [
                    'id' => $line->variant->id,
                    'attribute' => $line->variant->attribute,
                    'value' => $line->variant->value,
                    'extra_price' => $line->variant->extra_price,
                ] : null,
                'quantity' => $line->quantity,
            ])->values()->all(),
        ];
    }
}

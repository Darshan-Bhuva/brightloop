<?php

namespace App\Http\Resources;

use App\Enums\ProductType;
use App\Enums\TaxType;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type instanceof ProductType ? $this->type->value : (string) $this->type,
            'sales_price' => number_format((float) $this->sales_price, 2, '.', ''),
            'cost_price' => number_format((float) $this->cost_price, 2, '.', ''),
            'tax_id' => $this->tax_id,
            'tax' => $this->tax ? [
                'id' => $this->tax->id,
                'name' => $this->tax->name,
                'type' => $this->tax->type instanceof TaxType ? $this->tax->type->value : (string) $this->tax->type,
                'rate' => number_format((float) $this->tax->rate, 2, '.', ''),
            ] : null,
            'notes' => $this->notes,
            'is_active' => (bool) $this->is_active,
            'variants' => VariantResource::collection($this->relationLoaded('variants') ? $this->variants : $this->variants()->get()),
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Models\Discount;
use App\Services\DiscountService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Discount
 */
class DiscountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $products = $this->relationLoaded('products') ? $this->products : $this->products()->get(['products.id', 'products.name']);

        $discountService = app(DiscountService::class);
        $state = $discountService->state($this->resource);

        $remainingUses = $this->usage_limit === null ? null : max(0, (int) $this->usage_limit - (int) $this->used_count);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => $this->type instanceof DiscountType ? $this->type->value : (string) $this->type,
            'value' => number_format((float) $this->value, 2, '.', ''),
            'applies_to' => $this->applies_to instanceof DiscountAppliesTo ? $this->applies_to->value : (string) $this->applies_to,
            'product_ids' => $products->pluck('id')->values()->all(),
            'products' => $products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
            ])->values()->all(),
            'min_purchase' => $this->min_purchase !== null ? number_format((float) $this->min_purchase, 2, '.', '') : null,
            'min_quantity' => $this->min_quantity !== null ? (int) $this->min_quantity : null,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'usage_limit' => $this->usage_limit !== null ? (int) $this->usage_limit : null,
            'used_count' => (int) $this->used_count,
            'remaining_uses' => $remainingUses,
            'state' => $state->value,
            'is_active' => (bool) $this->is_active,
        ];
    }
}

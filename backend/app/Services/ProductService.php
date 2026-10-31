<?php

namespace App\Services;

use App\Enums\SubscriptionStatus;
use App\Exceptions\ConflictException;
use App\Models\Product;
use App\Models\SubscriptionLine;
use Illuminate\Support\Facades\DB;

class ProductService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'name' => $data['name'],
                'type' => $data['type'],
                'sales_price' => $data['sales_price'],
                'cost_price' => $data['cost_price'],
                'tax_id' => $data['tax_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (! empty($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $v) {
                    $product->variants()->create([
                        'attribute' => $v['attribute'],
                        'value' => $v['value'],
                        'extra_price' => $v['extra_price'] ?? 0,
                    ]);
                }
            }

            return $product->load(['tax', 'variants']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update([
                'name' => $data['name'],
                'type' => $data['type'],
                'sales_price' => $data['sales_price'],
                'cost_price' => $data['cost_price'],
                'tax_id' => $data['tax_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'is_active' => $data['is_active'] ?? $product->is_active,
            ]);

            if (array_key_exists('variants', $data)) {
                $variants = $data['variants'] ?? [];
                $keptIds = [];

                foreach ($variants as $v) {
                    if (isset($v['id']) && $v['id']) {
                        $variant = $product->variants()->where('id', $v['id'])->first();
                        if ($variant) {
                            $variant->update([
                                'attribute' => $v['attribute'],
                                'value' => $v['value'],
                                'extra_price' => $v['extra_price'] ?? 0,
                            ]);
                            $keptIds[] = $variant->id;
                        }
                    } else {
                        $newVariant = $product->variants()->create([
                            'attribute' => $v['attribute'],
                            'value' => $v['value'],
                            'extra_price' => $v['extra_price'] ?? 0,
                        ]);
                        $keptIds[] = $newVariant->id;
                    }
                }

                $product->variants()->whereNotIn('id', $keptIds)->delete();
            }

            return $product->fresh(['tax', 'variants']);
        });
    }

    public function delete(Product $product): void
    {
        $inUse = SubscriptionLine::where('product_id', $product->id)
            ->whereHas('subscription', function ($query) {
                $query->whereIn('status', [
                    SubscriptionStatus::Draft,
                    SubscriptionStatus::Quotation,
                    SubscriptionStatus::Confirmed,
                    SubscriptionStatus::Active,
                ]);
            })
            ->exists();

        if ($inUse) {
            throw new ConflictException('Product is in use by an active or pending subscription; cannot be deleted.');
        }

        DB::transaction(function () use ($product) {
            $product->variants()->delete();
            $product->delete();
        });
    }
}

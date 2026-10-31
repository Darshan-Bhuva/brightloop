<?php

namespace App\Services;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountState;
use App\Models\Discount;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class DiscountService
{
    /**
     * Compute the derived state of a discount (BR-6).
     * Order of precedence: inactive > exhausted > expired > scheduled > active.
     */
    public function state(Discount $discount, ?string $asOfDate = null): DiscountState
    {
        $date = $asOfDate ?? now()->toDateString();

        if (! $discount->is_active) {
            return DiscountState::Inactive;
        }

        if ($discount->usage_limit !== null && (int) $discount->used_count >= (int) $discount->usage_limit) {
            return DiscountState::Exhausted;
        }

        $endDate = $discount->end_date instanceof CarbonInterface
            ? $discount->end_date->toDateString()
            : (string) $discount->end_date;

        if ($endDate < $date) {
            return DiscountState::Expired;
        }

        $startDate = $discount->start_date instanceof CarbonInterface
            ? $discount->start_date->toDateString()
            : (string) $discount->start_date;

        if ($startDate > $date) {
            return DiscountState::Scheduled;
        }

        return DiscountState::Active;
    }

    /**
     * Determine if a discount is eligible as of a given date (BR-6).
     * Reused by billing engine in M5.
     */
    public function isEligible(Discount $discount, ?string $asOfDate = null): bool
    {
        $date = $asOfDate ?? now()->toDateString();
        $startDate = $discount->start_date instanceof CarbonInterface
            ? $discount->start_date->toDateString()
            : (string) $discount->start_date;
        $endDate = $discount->end_date instanceof CarbonInterface
            ? $discount->end_date->toDateString()
            : (string) $discount->end_date;

        return (bool) $discount->is_active
            && $startDate <= $date
            && $date <= $endDate
            && ($discount->usage_limit === null || (int) $discount->used_count < (int) $discount->usage_limit);
    }

    /**
     * Apply derived state filter to a query builder.
     */
    public function applyStateFilter(Builder $query, string $state, ?string $asOfDate = null): Builder
    {
        $today = $asOfDate ?? now()->toDateString();

        return match ($state) {
            DiscountState::Inactive->value => $query->where('is_active', false),
            DiscountState::Exhausted->value => $query->where('is_active', true)
                ->whereNotNull('usage_limit')
                ->whereColumn('used_count', '>=', 'usage_limit'),
            DiscountState::Expired->value => $query->where('is_active', true)
                ->where(function (Builder $q) {
                    $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
                })
                ->where('end_date', '<', $today),
            DiscountState::Scheduled->value => $query->where('is_active', true)
                ->where(function (Builder $q) {
                    $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
                })
                ->where('end_date', '>=', $today)
                ->where('start_date', '>', $today),
            DiscountState::Active->value => $query->where('is_active', true)
                ->where(function (Builder $q) {
                    $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
                })
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today),
            default => $query,
        };
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Discount
    {
        return DB::transaction(function () use ($data) {
            $code = ! empty($data['code']) ? mb_strtoupper(trim((string) $data['code'])) : null;

            $discount = Discount::create([
                'name' => $data['name'],
                'code' => $code,
                'type' => $data['type'],
                'value' => $data['value'],
                'applies_to' => $data['applies_to'],
                'min_purchase' => $data['min_purchase'] ?? null,
                'min_quantity' => $data['min_quantity'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'usage_limit' => $data['usage_limit'] ?? null,
                'used_count' => 0,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $appliesTo = $discount->applies_to instanceof DiscountAppliesTo ? $discount->applies_to->value : (string) $discount->applies_to;

            if ($appliesTo === DiscountAppliesTo::Products->value && ! empty($data['product_ids'])) {
                $discount->products()->sync($data['product_ids']);
            }

            return $discount->load('products');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Discount $discount, array $data): Discount
    {
        return DB::transaction(function () use ($discount, $data) {
            $code = array_key_exists('code', $data)
                ? (! empty($data['code']) ? mb_strtoupper(trim((string) $data['code'])) : null)
                : $discount->code;

            $discount->update([
                'name' => $data['name'] ?? $discount->name,
                'code' => $code,
                'type' => $data['type'] ?? $discount->type,
                'value' => $data['value'] ?? $discount->value,
                'applies_to' => $data['applies_to'] ?? $discount->applies_to,
                'min_purchase' => array_key_exists('min_purchase', $data) ? $data['min_purchase'] : $discount->min_purchase,
                'min_quantity' => array_key_exists('min_quantity', $data) ? $data['min_quantity'] : $discount->min_quantity,
                'start_date' => $data['start_date'] ?? $discount->start_date,
                'end_date' => $data['end_date'] ?? $discount->end_date,
                'usage_limit' => array_key_exists('usage_limit', $data) ? $data['usage_limit'] : $discount->usage_limit,
                'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : $discount->is_active,
            ]);

            $appliesTo = $discount->applies_to instanceof DiscountAppliesTo ? $discount->applies_to->value : (string) $discount->applies_to;

            if ($appliesTo === DiscountAppliesTo::Products->value) {
                if (isset($data['product_ids'])) {
                    $discount->products()->sync($data['product_ids']);
                }
            } else {
                $discount->products()->detach();
            }

            return $discount->fresh('products');
        });
    }

    public function delete(Discount $discount): void
    {
        $discount->delete();
    }
}

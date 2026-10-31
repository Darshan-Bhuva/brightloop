<?php

namespace App\Models;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use Database\Factories\DiscountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name', 'code', 'type', 'value', 'applies_to', 'min_purchase', 'min_quantity', 'start_date', 'end_date',
    'usage_limit', 'used_count', 'is_active',
])]
class Discount extends Model
{
    /** @use HasFactory<DiscountFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => DiscountType::class,
            'applies_to' => DiscountAppliesTo::class,
            'value' => 'decimal:2',
            'min_purchase' => 'decimal:2',
            'min_quantity' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'discount_product');
    }

    public function subscriptions(): BelongsToMany
    {
        return $this->belongsToMany(Subscription::class, 'subscription_discounts')->withTimestamps();
    }
}

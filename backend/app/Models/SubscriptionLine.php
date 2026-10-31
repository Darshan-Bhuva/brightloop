<?php

namespace App\Models;

use App\Enums\SubscriptionLineType;
use Database\Factories\SubscriptionLineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'subscription_id', 'line_type', 'product_id', 'variant_id', 'description', 'quantity', 'unit_price', 'tax_id',
    'amount', 'tax_amount', 'sort_order',
])]
class SubscriptionLine extends Model
{
    /** @use HasFactory<SubscriptionLineFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'line_type' => SubscriptionLineType::class,
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}

<?php

namespace App\Models;

use App\Enums\BillingPeriod;
use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'price', 'billing_period', 'min_quantity', 'start_date', 'end_date', 'tax_id', 'auto_close', 'closable', 'pausable', 'renewable', 'is_active'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'billing_period' => BillingPeriod::class,
            'min_quantity' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'auto_close' => 'boolean',
            'closable' => 'boolean',
            'pausable' => 'boolean',
            'renewable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}

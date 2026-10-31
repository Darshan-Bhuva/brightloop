<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use App\Observers\SubscriptionObserver;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(SubscriptionObserver::class)]
#[Fillable([
    'number', 'customer_id', 'plan_id', 'quotation_template_id', 'payment_term_id', 'status', 'is_paused', 'paused_at',
    'start_date', 'expiry_date', 'quotation_valid_until', 'next_invoice_date', 'notes', 'subtotal', 'tax_total', 'total',
    'closed_at', 'close_reason', 'created_by',
])]
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'is_paused' => 'boolean',
            'paused_at' => 'datetime',
            'closed_at' => 'datetime',
            'start_date' => 'date',
            'expiry_date' => 'date',
            'quotation_valid_until' => 'date',
            'next_invoice_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function quotationTemplate(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplate::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SubscriptionLine::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function discounts(): BelongsToMany
    {
        return $this->belongsToMany(Discount::class, 'subscription_discounts')->withTimestamps();
    }
}

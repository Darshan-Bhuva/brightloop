<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Closure;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'name', 'email', 'phone', 'company_name', 'address_line', 'city', 'state', 'country', 'postal_code'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory, SoftDeletes;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Relation-count definition for withCount()/loadCount(): subscriptions in status `active`.
     *
     * @return array<string, Closure(Builder): void>
     */
    public static function activeSubscriptionsCount(): array
    {
        return [
            'subscriptions as active_subscriptions_count' => fn (Builder $query) => $query->where('status', SubscriptionStatus::Active),
        ];
    }
}

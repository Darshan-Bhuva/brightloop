<?php

namespace App\Http\Resources;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Customer
 */
class CustomerResource extends JsonResource
{
    /**
     * Callers should load the count with withCount(Customer::activeSubscriptionsCount()).
     * As a safety net a single model loads it itself (one query).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if (! array_key_exists('active_subscriptions_count', $this->resource->getAttributes())) {
            $this->resource->loadCount(Customer::activeSubscriptionsCount());
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company_name' => $this->company_name,
            'address_line' => $this->address_line,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'has_login' => $this->user_id !== null,
            'active_subscriptions_count' => (int) $this->active_subscriptions_count,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

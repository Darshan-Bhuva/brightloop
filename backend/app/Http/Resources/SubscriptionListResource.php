<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SubscriptionListItem. Callers eager-load customer and plan (SubscriptionService::list()).
 *
 * @mixin Subscription
 */
class SubscriptionListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'is_paused' => (bool) $this->is_paused,
            'customer' => ['id' => $this->customer->id, 'name' => $this->customer->name],
            'plan' => [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'billing_period' => $this->plan->billing_period->value,
            ],
            'start_date' => $this->start_date->toDateString(),
            'expiry_date' => $this->expiry_date->toDateString(),
            'next_invoice_date' => $this->next_invoice_date?->toDateString(),
            'total' => $this->total,
        ];
    }
}

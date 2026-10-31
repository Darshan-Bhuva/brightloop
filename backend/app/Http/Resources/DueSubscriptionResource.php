<?php

namespace App\Http\Resources;

use App\Enums\BillingPeriod;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Subscription
 */
class DueSubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ],
            'plan' => [
                'id' => $this->plan?->id,
                'name' => $this->plan?->name,
                'billing_period' => $this->plan?->billing_period instanceof BillingPeriod
                    ? $this->plan->billing_period->value
                    : (string) $this->plan?->billing_period,
            ],
            'next_invoice_date' => $this->next_invoice_date?->toDateString(),
            'periods_due' => (int) ($this->periods_due ?? 1),
            'estimated_total' => number_format((float) ($this->estimated_total ?? $this->total), 2, '.', ''),
        ];
    }
}

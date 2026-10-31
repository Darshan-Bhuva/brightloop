<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Callers eager-load SubscriptionService::detailRelations().
 *
 * @mixin Subscription
 */
class SubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $service = app(SubscriptionService::class);

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'is_paused' => (bool) $this->is_paused,
            'customer' => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ],
            'plan' => [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'billing_period' => $this->plan->billing_period->value,
                'price' => $this->plan->price,
                'closable' => $this->plan->closable,
                'pausable' => $this->plan->pausable,
                'renewable' => $this->plan->renewable,
                'auto_close' => $this->plan->auto_close,
            ],
            'payment_term' => [
                'id' => $this->paymentTerm->id,
                'name' => $this->paymentTerm->name,
                'due_days' => (int) $this->paymentTerm->due_days,
            ],
            'quotation_template_id' => $this->quotation_template_id,
            'start_date' => $this->start_date->toDateString(),
            'expiry_date' => $this->expiry_date->toDateString(),
            'quotation_valid_until' => $this->quotation_valid_until?->toDateString(),
            'next_invoice_date' => $this->next_invoice_date?->toDateString(),
            'notes' => $this->notes,
            'lines' => SubscriptionLineResource::collection($this->lines)->resolve($request),
            'discounts' => $this->discounts->map(fn ($discount) => [
                'id' => $discount->id,
                'name' => $discount->name,
                'type' => $discount->type->value,
                'value' => $discount->value,
                'state' => $service->discountState($discount)->value,
            ])->values()->all(),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'total' => $this->total,
            'closed_at' => $this->closed_at?->toIso8601ZuluString(),
            'close_reason' => $this->close_reason,
            'allowed_actions' => $service->allowedActions($this->resource, $request->user()),
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

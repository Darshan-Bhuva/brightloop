<?php

namespace App\Http\Resources;

use App\Enums\BillingPeriod;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Plan
 */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $today = now()->toDateString();
        $startDate = $this->start_date?->toDateString();
        $endDate = $this->end_date?->toDateString();

        $isAvailable = (bool) $this->is_active
            && $startDate !== null
            && $startDate <= $today
            && ($endDate === null || $today <= $endDate);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => number_format((float) $this->price, 2, '.', ''),
            'billing_period' => $this->billing_period instanceof BillingPeriod ? $this->billing_period->value : (string) $this->billing_period,
            'min_quantity' => (int) $this->min_quantity,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'tax_id' => $this->tax_id,
            'tax' => $this->tax ? [
                'id' => $this->tax->id,
                'name' => $this->tax->name,
                'rate' => number_format((float) $this->tax->rate, 2, '.', ''),
            ] : null,
            'auto_close' => (bool) $this->auto_close,
            'closable' => (bool) $this->closable,
            'pausable' => (bool) $this->pausable,
            'renewable' => (bool) $this->renewable,
            'is_active' => (bool) $this->is_active,
            'is_available' => $isAvailable,
        ];
    }
}

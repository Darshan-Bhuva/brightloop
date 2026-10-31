<?php

namespace App\Services;

use App\Exceptions\ConflictException;
use App\Models\Plan;
use App\Models\Subscription;
use Carbon\CarbonInterface;

class PlanService
{
    public function isAvailable(Plan $plan, ?string $asOfDate = null): bool
    {
        $date = $asOfDate ?? now()->toDateString();
        $startDate = $plan->start_date instanceof CarbonInterface
            ? $plan->start_date->toDateString()
            : (string) $plan->start_date;
        $endDate = $plan->end_date instanceof CarbonInterface
            ? $plan->end_date?->toDateString()
            : ($plan->end_date ? (string) $plan->end_date : null);

        return (bool) $plan->is_active
            && $startDate <= $date
            && ($endDate === null || $date <= $endDate);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Plan
    {
        return Plan::create([
            'name' => $data['name'],
            'price' => $data['price'],
            'billing_period' => $data['billing_period'],
            'min_quantity' => $data['min_quantity'] ?? 1,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'auto_close' => $data['auto_close'] ?? false,
            'closable' => $data['closable'] ?? true,
            'pausable' => $data['pausable'] ?? false,
            'renewable' => $data['renewable'] ?? false,
            'is_active' => $data['is_active'] ?? true,
        ])->load('tax');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Plan $plan, array $data): Plan
    {
        $plan->update([
            'name' => $data['name'] ?? $plan->name,
            'price' => $data['price'] ?? $plan->price,
            'billing_period' => $data['billing_period'] ?? $plan->billing_period,
            'min_quantity' => array_key_exists('min_quantity', $data) ? $data['min_quantity'] : $plan->min_quantity,
            'start_date' => $data['start_date'] ?? $plan->start_date,
            'end_date' => array_key_exists('end_date', $data) ? $data['end_date'] : $plan->end_date,
            'tax_id' => array_key_exists('tax_id', $data) ? $data['tax_id'] : $plan->tax_id,
            'auto_close' => array_key_exists('auto_close', $data) ? $data['auto_close'] : $plan->auto_close,
            'closable' => array_key_exists('closable', $data) ? $data['closable'] : $plan->closable,
            'pausable' => array_key_exists('pausable', $data) ? $data['pausable'] : $plan->pausable,
            'renewable' => array_key_exists('renewable', $data) ? $data['renewable'] : $plan->renewable,
            'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : $plan->is_active,
        ]);

        return $plan->fresh('tax');
    }

    public function delete(Plan $plan): void
    {
        $inUse = Subscription::where('plan_id', $plan->id)->exists();

        if ($inUse) {
            throw new ConflictException('Plan is in use by subscriptions; cannot be deleted.');
        }

        $plan->delete();
    }
}

<?php

namespace App\Http\Requests\Subscription;

use App\Models\Plan;
use App\Models\ProductVariant;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `unit_price` is never accepted from the client (BR-1); the server computes it.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->withoutTrashed()],
            'plan_id' => ['required_without:quotation_template_id', 'nullable', 'integer', Rule::exists('plans', 'id')->withoutTrashed()],
            'quotation_template_id' => ['nullable', 'integer', Rule::exists('quotation_templates', 'id')->withoutTrashed()],
            'payment_term_id' => ['required', 'integer', 'exists:payment_terms,id'],
            'start_date' => ['required', 'date'],
            'expiry_date' => ['required', 'date', 'after:start_date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required_without:quotation_template_id', 'array'],
            'lines.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')->withoutTrashed()],
            'lines.*.variant_id' => ['nullable', 'integer'],
            'lines.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Plan availability, variant ownership, plan min_quantity (BR-2) and duplicate rows,
     * checked against the effective plan/lines (template values fill absent ones).
     *
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $errors = $validator->errors();

                if ($errors->hasAny(['plan_id', 'quotation_template_id', 'lines']) || collect($errors->keys())->contains(fn ($key) => str_starts_with($key, 'lines.'))) {
                    return;
                }

                $service = app(SubscriptionService::class);
                [$planId, $lines] = $service->resolvePlanAndLines($this->only(['plan_id', 'lines', 'quotation_template_id']));
                $plan = $planId ? Plan::find($planId) : null;

                if (! $plan) {
                    return;
                }

                if (! $service->isPlanAvailable($plan)) {
                    $errors->add('plan_id', 'Plan is not available');
                }

                $fromRequest = $this->has('lines');
                $variants = ProductVariant::whereIn('id', array_filter(array_column($lines ?? [], 'variant_id')))
                    ->pluck('product_id', 'id');
                $seen = [];

                foreach ($lines ?? [] as $index => $line) {
                    $prefix = $fromRequest ? "lines.{$index}." : null;
                    $variantId = filled($line['variant_id'] ?? null) ? (int) $line['variant_id'] : null;

                    if ($variantId !== null && (int) ($variants[$variantId] ?? 0) !== (int) $line['product_id']) {
                        $errors->add($prefix ? $prefix.'variant_id' : 'lines', 'The selected variant does not belong to the product.');
                    }

                    if ((int) $line['quantity'] < $plan->min_quantity) {
                        $errors->add($prefix ? $prefix.'quantity' : 'lines', "The quantity must be at least {$plan->min_quantity} for this plan.");
                    }

                    $key = $line['product_id'].':'.($variantId ?? '');

                    if (isset($seen[$key])) {
                        $errors->add($prefix ? $prefix.'product_id' : 'lines', 'Duplicate product and variant combination.');
                    }

                    $seen[$key] = true;
                }
            },
        ];
    }
}

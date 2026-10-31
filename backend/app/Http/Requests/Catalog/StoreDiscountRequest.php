<?php

namespace App\Http\Requests\Catalog;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code') && $this->input('code') !== null && $this->input('code') !== '') {
            $this->merge([
                'code' => mb_strtoupper(trim((string) $this->input('code'))),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $type = $this->input('type');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:discounts,code'],
            'type' => ['required', Rule::enum(DiscountType::class)],
            'value' => [
                'required',
                'numeric',
                'gt:0',
                Rule::when(
                    $type === DiscountType::Percentage->value || $type === 'percentage',
                    ['max:100'],
                ),
            ],
            'applies_to' => ['required', Rule::enum(DiscountAppliesTo::class)],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'min_purchase' => ['nullable', 'numeric', 'min:0'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $appliesTo = $this->input('applies_to');
                $productIds = $this->input('product_ids');

                if ($appliesTo === DiscountAppliesTo::Products->value || $appliesTo === 'products') {
                    if (empty($productIds) || ! is_array($productIds)) {
                        $validator->errors()->add('product_ids', 'The product_ids field is required when discount applies to products.');
                    }
                } elseif ($appliesTo === DiscountAppliesTo::Subscription->value || $appliesTo === 'subscription') {
                    if (! empty($productIds)) {
                        $validator->errors()->add('product_ids', 'The product_ids field must be empty or absent when discount applies to subscriptions.');
                    }
                }
            },
        ];
    }
}

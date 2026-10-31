<?php

namespace App\Http\Requests\Catalog;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Models\Discount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateDiscountRequest extends FormRequest
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
        $discount = $this->route('discount');
        $discountId = $discount instanceof Discount ? $discount->id : $discount;
        $discountModel = $discount instanceof Discount ? $discount : Discount::find($discountId);

        $type = $this->input('type', $discountModel?->type?->value);

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('discounts', 'code')->ignore($discountId)],
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
                $discount = $this->route('discount');
                $discountId = $discount instanceof Discount ? $discount->id : $discount;
                $discountModel = $discount instanceof Discount ? $discount : Discount::find($discountId);

                if ($discountModel && $this->has('usage_limit') && $this->input('usage_limit') !== null) {
                    $newLimit = (int) $this->input('usage_limit');
                    if ($newLimit < $discountModel->used_count) {
                        $validator->errors()->add(
                            'usage_limit',
                            "The usage limit cannot be lower than the number of times this discount has been used ({$discountModel->used_count}).",
                        );
                    }
                }

                $appliesTo = $this->input('applies_to', $discountModel?->applies_to?->value);
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

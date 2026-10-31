<?php

namespace App\Http\Requests\Subscription;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountState;
use App\Models\Discount;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AttachDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'discount_id' => ['required', 'integer', Rule::exists('discounts', 'id')->withoutTrashed()],
        ];
    }

    /**
     * SUB-13: only subscription-level discounts in state `active`.
     *
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('discount_id')) {
                    return;
                }

                $discount = Discount::find($this->integer('discount_id'));

                if ($discount && $discount->applies_to !== DiscountAppliesTo::Subscription) {
                    $validator->errors()->add('discount_id', 'The discount must apply to the subscription.');
                } elseif ($discount && app(SubscriptionService::class)->discountState($discount) !== DiscountState::Active) {
                    $validator->errors()->add('discount_id', 'The discount is not active.');
                }
            },
        ];
    }
}

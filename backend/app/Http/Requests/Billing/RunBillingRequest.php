<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RunBillingRequest extends FormRequest
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
            'as_of_date' => ['nullable', 'date'],
            'subscription_ids' => ['nullable', 'array'],
            'subscription_ids.*' => ['integer', 'exists:subscriptions,id'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $asOfDate = $this->input('as_of_date');
                if (! $asOfDate) {
                    return;
                }

                $allowFuture = config('app.billing_allow_future', false)
                    || env('BILLING_ALLOW_FUTURE', false);

                if (! $allowFuture && $asOfDate > now()->toDateString()) {
                    $validator->errors()->add(
                        'as_of_date',
                        'The as of date cannot be in the future.',
                    );
                }
            },
        ];
    }
}

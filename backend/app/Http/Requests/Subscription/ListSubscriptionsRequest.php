<?php

namespace App\Http\Requests\Subscription;

use App\Enums\SubscriptionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListSubscriptionsRequest extends FormRequest
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
            'status' => ['sometimes', 'nullable', Rule::enum(SubscriptionStatus::class)],
            'customer_id' => ['sometimes', 'nullable', 'integer'],
            'plan_id' => ['sometimes', 'nullable', 'integer'],
            'is_paused' => ['sometimes', 'in:true,false,1,0'],
            'start_from' => ['sometimes', 'nullable', 'date'],
            'start_to' => ['sometimes', 'nullable', 'date'],
            'expiry_from' => ['sometimes', 'nullable', 'date'],
            'expiry_to' => ['sometimes', 'nullable', 'date'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort' => ['sometimes', 'in:number,start_date,expiry_date,total,created_at'],
            'direction' => ['sometimes', 'in:asc,desc'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

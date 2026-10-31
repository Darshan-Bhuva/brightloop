<?php

namespace App\Http\Requests\Catalog;

use App\Enums\BillingPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'unique:plans,name'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_period' => ['required', Rule::enum(BillingPeriod::class)],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'tax_id' => ['nullable', 'integer', 'exists:taxes,id'],
            'auto_close' => ['nullable', 'boolean'],
            'closable' => ['nullable', 'boolean'],
            'pausable' => ['nullable', 'boolean'],
            'renewable' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}

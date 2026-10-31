<?php

namespace App\Http\Requests\Catalog;

use App\Enums\TaxType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaxRequest extends FormRequest
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
        $type = $this->input('type');

        return [
            'name' => ['required', 'string', 'max:100', 'unique:taxes,name'],
            'type' => ['required', Rule::enum(TaxType::class)],
            'rate' => [
                'required',
                'numeric',
                'min:0',
                Rule::when(
                    $type === TaxType::Percentage->value || $type === 'percentage',
                    ['max:100'],
                ),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}

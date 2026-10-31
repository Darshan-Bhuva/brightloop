<?php

namespace App\Http\Requests\Catalog;

use App\Enums\TaxType;
use App\Models\Tax;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaxRequest extends FormRequest
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
        $tax = $this->route('tax');
        $taxId = $tax instanceof Tax ? $tax->id : $tax;
        $currentType = $tax instanceof Tax ? $tax->type->value : Tax::where('id', $taxId)->value('type');
        $type = $this->input('type', $currentType);

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('taxes', 'name')->ignore($taxId)],
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

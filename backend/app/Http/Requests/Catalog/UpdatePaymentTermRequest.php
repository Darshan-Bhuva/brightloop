<?php

namespace App\Http\Requests\Catalog;

use App\Models\PaymentTerm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentTermRequest extends FormRequest
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
        $term = $this->route('payment_term');
        $termId = $term instanceof PaymentTerm ? $term->id : $term;

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('payment_terms', 'name')->ignore($termId)],
            'due_days' => ['required', 'integer', 'min:0', 'max:365'],
        ];
    }
}

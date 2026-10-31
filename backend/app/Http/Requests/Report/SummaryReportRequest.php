<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

class SummaryReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Missing dates default to the current month, so `date_from <= date_to` is always checked.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'date_from' => $this->input('date_from') ?: now()->startOfMonth()->toDateString(),
            'date_to' => $this->input('date_to') ?: now()->endOfMonth()->toDateString(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ];
    }
}

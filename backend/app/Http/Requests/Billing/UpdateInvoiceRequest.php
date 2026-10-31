<?php

namespace App\Http\Requests\Billing;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
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
        $invoice = $this->route('invoice');
        $invoiceModel = $invoice instanceof Invoice ? $invoice : Invoice::find($invoice);
        $invoiceDate = $invoiceModel?->invoice_date?->toDateString() ?? now()->toDateString();

        return [
            'due_date' => ['nullable', 'date', 'after_or_equal:'.$invoiceDate],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\PaymentMethod;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'invoice_number' => $this->invoice?->number,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ],
            'method' => $this->method instanceof PaymentMethod ? $this->method->value : (string) $this->method,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'payment_date' => $this->payment_date?->toDateString(),
            'reference' => $this->reference,
            'note' => $this->note,
            'recorded_by' => $this->recordedBy ? [
                'id' => $this->recordedBy->id,
                'name' => $this->recordedBy->name,
            ] : null,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

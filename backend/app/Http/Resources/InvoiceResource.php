<?php

namespace App\Http\Resources;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invoice
 */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $today = now()->toDateString();
        $isOverdue = $this->status === InvoiceStatus::Confirmed
            && $this->due_date?->toDateString() < $today
            && (float) $this->amount_due > 0;

        $daysOverdue = $isOverdue && $this->due_date
            ? max(0, (int) now()->startOfDay()->diffInDays($this->due_date->startOfDay()))
            : 0;

        $invoiceService = app(InvoiceService::class);
        $user = $request->user();
        $allowedActions = $invoiceService->allowedActions($this->resource, $user);

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status instanceof InvoiceStatus ? $this->status->value : (string) $this->status,
            'is_overdue' => $isOverdue,
            'days_overdue' => $daysOverdue,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'email' => $this->customer?->email,
                'phone' => $this->customer?->phone,
                'company_name' => $this->customer?->company_name,
                'address_line' => $this->customer?->address_line,
                'city' => $this->customer?->city,
                'state' => $this->customer?->state,
                'country' => $this->customer?->country,
                'postal_code' => $this->customer?->postal_code,
            ],
            'subscription' => [
                'id' => $this->subscription?->id,
                'number' => $this->subscription?->number,
            ],
            'payment_term' => [
                'id' => $this->paymentTerm?->id,
                'name' => $this->paymentTerm?->name,
                'due_days' => (int) $this->paymentTerm?->due_days,
            ],
            'invoice_date' => $this->invoice_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'period_start' => $this->period_start?->toDateString(),
            'period_end' => $this->period_end?->toDateString(),
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'discount_total' => number_format((float) $this->discount_total, 2, '.', ''),
            'tax_total' => number_format((float) $this->tax_total, 2, '.', ''),
            'total' => number_format((float) $this->total, 2, '.', ''),
            'amount_paid' => number_format((float) $this->amount_paid, 2, '.', ''),
            'amount_due' => number_format((float) $this->amount_due, 2, '.', ''),
            'sent_at' => $this->sent_at?->toIso8601ZuluString(),
            'notes' => $this->notes,
            'lines' => InvoiceLineResource::collection($this->lines),
            'payments' => PaymentResource::collection($this->payments),
            'allowed_actions' => $allowedActions,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

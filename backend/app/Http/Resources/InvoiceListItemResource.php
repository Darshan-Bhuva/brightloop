<?php

namespace App\Http\Resources;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invoice
 */
class InvoiceListItemResource extends JsonResource
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

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status instanceof InvoiceStatus ? $this->status->value : (string) $this->status,
            'is_overdue' => $isOverdue,
            'days_overdue' => $daysOverdue,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ],
            'subscription' => [
                'id' => $this->subscription?->id,
                'number' => $this->subscription?->number,
            ],
            'invoice_date' => $this->invoice_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'total' => number_format((float) $this->total, 2, '.', ''),
            'amount_paid' => number_format((float) $this->amount_paid, 2, '.', ''),
            'amount_due' => number_format((float) $this->amount_due, 2, '.', ''),
        ];
    }
}

<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Exceptions\ConflictException;
use App\Mail\InvoiceMail;
use App\Models\Discount;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class InvoiceService
{
    /**
     * Compute allowed actions for an invoice according to BR-8.
     *
     * @return array<int, string>
     */
    public function allowedActions(Invoice $invoice, ?User $user): array
    {
        if ($user?->role === Role::Customer) {
            return ['print'];
        }

        $actions = match ($invoice->status) {
            InvoiceStatus::Draft => ['edit', 'confirm', 'cancel'],
            InvoiceStatus::Confirmed => (float) $invoice->amount_paid == 0.0
                ? ['send', 'record_payment', 'print', 'cancel']
                : ['send', 'record_payment', 'print'],
            InvoiceStatus::Paid => ['send', 'print'],
            InvoiceStatus::Cancelled => ['print'],
            default => ['print'],
        };

        return array_values($actions);
    }

    public function confirm(Invoice $invoice): Invoice
    {
        if ($invoice->status !== InvoiceStatus::Draft) {
            throw new ConflictException('Only draft invoices can be confirmed.');
        }

        if ((float) $invoice->amount_due <= 0.0) {
            $invoice->status = InvoiceStatus::Paid;
        } else {
            $invoice->status = InvoiceStatus::Confirmed;
        }

        $invoice->save();

        return $invoice->fresh(['lines.discount', 'payments.recordedBy', 'customer', 'subscription', 'paymentTerm']);
    }

    public function cancel(Invoice $invoice, ?string $reason = null): Invoice
    {
        if (! in_array($invoice->status, [InvoiceStatus::Draft, InvoiceStatus::Confirmed], true)) {
            throw new ConflictException('Invoice cannot be cancelled from its current status.');
        }

        if ((float) $invoice->amount_paid > 0.0 || $invoice->payments()->exists()) {
            throw new ConflictException('Cannot cancel an invoice with payments.');
        }

        return DB::transaction(function () use ($invoice, $reason) {
            $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->firstOrFail();

            // Release discount usage (BR-6)
            $discountIds = $lockedInvoice->lines()
                ->whereNotNull('discount_id')
                ->pluck('discount_id')
                ->push($lockedInvoice->discount_id)
                ->filter()
                ->unique()
                ->values();

            foreach ($discountIds as $discountId) {
                Discount::where('id', $discountId)
                    ->where('used_count', '>', 0)
                    ->lockForUpdate()
                    ->decrement('used_count');
            }

            $lockedInvoice->status = InvoiceStatus::Cancelled;
            $lockedInvoice->cancelled_at = now();
            $lockedInvoice->cancel_reason = $reason;
            $lockedInvoice->save();

            return $lockedInvoice->fresh(['lines.discount', 'payments.recordedBy', 'customer', 'subscription', 'paymentTerm']);
        });
    }

    public function send(Invoice $invoice): Invoice
    {
        if (! in_array($invoice->status, [InvoiceStatus::Confirmed, InvoiceStatus::Paid], true)) {
            throw new ConflictException('Only confirmed or paid invoices can be sent.');
        }

        if ($invoice->customer?->email) {
            Mail::to($invoice->customer->email)->send(new InvoiceMail($invoice));
        }

        $invoice->sent_at = now();
        $invoice->save();

        return $invoice->fresh(['lines.discount', 'payments.recordedBy', 'customer', 'subscription', 'paymentTerm']);
    }

    /**
     * @param  array<int, int>  $ids
     * @return array{confirmed: int, skipped: array<int, array{id: int, message: string}>}
     */
    public function bulkConfirm(array $ids): array
    {
        $confirmed = 0;
        $skipped = [];

        foreach ($ids as $id) {
            $invoice = Invoice::find($id);

            if (! $invoice) {
                $skipped[] = ['id' => $id, 'message' => 'Invoice not found.'];

                continue;
            }

            if ($invoice->status !== InvoiceStatus::Draft) {
                $skipped[] = ['id' => $id, 'message' => 'Invoice is not in draft status.'];

                continue;
            }

            try {
                $this->confirm($invoice);
                $confirmed++;
            } catch (\Throwable $e) {
                $skipped[] = ['id' => $id, 'message' => $e->getMessage()];
            }
        }

        return [
            'confirmed' => $confirmed,
            'skipped' => $skipped,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateDraft(Invoice $invoice, array $data): Invoice
    {
        if ($invoice->status !== InvoiceStatus::Draft) {
            throw new ConflictException('Only draft invoices can be updated.');
        }

        if (array_key_exists('due_date', $data)) {
            $invoice->due_date = $data['due_date'];
        }

        if (array_key_exists('notes', $data)) {
            $invoice->notes = $data['notes'];
        }

        $invoice->save();

        return $invoice->fresh(['lines.discount', 'payments.recordedBy', 'customer', 'subscription', 'paymentTerm']);
    }
}

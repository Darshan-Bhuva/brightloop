<?php

namespace App\Observers;

use App\Models\Invoice;

class InvoiceObserver
{
    /**
     * BR-11: number = INV-<id padded to 6>, set right after insert inside the caller's transaction.
     */
    public function created(Invoice $invoice): void
    {
        $invoice->number = 'INV-'.str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT);
        $invoice->saveQuietly();
    }
}

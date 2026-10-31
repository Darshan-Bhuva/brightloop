<?php

namespace App\Services;

use App\Exceptions\ConflictException;
use App\Models\Invoice;
use App\Models\PaymentTerm;
use App\Models\Subscription;

class PaymentTermService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PaymentTerm
    {
        return PaymentTerm::create([
            'name' => $data['name'],
            'due_days' => $data['due_days'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PaymentTerm $term, array $data): PaymentTerm
    {
        $term->update([
            'name' => $data['name'],
            'due_days' => $data['due_days'],
        ]);

        return $term;
    }

    public function delete(PaymentTerm $term): void
    {
        $inUse = Subscription::where('payment_term_id', $term->id)->exists()
            || Invoice::where('payment_term_id', $term->id)->exists();

        if ($inUse) {
            throw new ConflictException('Payment term is in use; cannot be deleted.');
        }

        $term->delete();
    }
}

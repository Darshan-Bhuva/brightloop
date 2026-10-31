<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Exceptions\ConflictException;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /**
     * Relations the PaymentResource needs (BR-12: always eager-loaded here).
     *
     * @return array<int|string, mixed>
     */
    public static function relations(): array
    {
        return [
            'invoice:id,number',
            'customer' => fn ($query) => $query->withTrashed()->select(['id', 'name']),
            'recordedBy:id,name',
        ];
    }

    /**
     * PAY-01: admin/staff see all, customers only their own.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters, User $user): LengthAwarePaginator
    {
        $direction = $filters['direction'] ?? 'desc';

        return Payment::query()
            ->with(self::relations())
            ->when($user->role === Role::Customer, fn ($query) => $query->whereHas(
                'customer',
                fn ($customer) => $customer->where('user_id', $user->id),
            ))
            ->when(filled($filters['invoice_id'] ?? null), fn ($query) => $query->where('invoice_id', $filters['invoice_id']))
            ->when(filled($filters['customer_id'] ?? null), fn ($query) => $query->where('customer_id', $filters['customer_id']))
            ->when(filled($filters['method'] ?? null), fn ($query) => $query->where('method', $filters['method']))
            ->when(filled($filters['date_from'] ?? null), fn ($query) => $query->where('payment_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn ($query) => $query->where('payment_date', '<=', $filters['date_to']))
            ->when(filled($filters['search'] ?? null), fn ($query) => $query->where(
                fn ($inner) => $inner->where('reference', 'ilike', '%'.$filters['search'].'%')
                    ->orWhereHas('invoice', fn ($invoice) => $invoice->where('number', 'ilike', '%'.$filters['search'].'%')),
            ))
            ->orderBy($filters['sort'] ?? 'payment_date', $direction)
            ->orderBy('id', $direction)
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * PAY-02: one transaction with a row lock on the invoice, so concurrent payments
     * can never push amount_paid above total (BR-8 auto paid).
     *
     * @param  array<string, mixed>  $data
     * @return array{payment: Payment, invoice: Invoice}
     *
     * @throws ConflictException
     * @throws ValidationException
     */
    public function record(array $data, User $user): array
    {
        return DB::transaction(function () use ($data, $user) {
            $invoice = Invoice::whereKey($data['invoice_id'])->lockForUpdate()->firstOrFail();

            if ($invoice->status !== InvoiceStatus::Confirmed) {
                throw new ConflictException('Invoice must be confirmed before recording payments');
            }

            $amount = bcadd((string) $data['amount'], '0', 2);

            if (bccomp($amount, (string) $invoice->amount_due, 2) === 1) {
                throw ValidationException::withMessages([
                    'amount' => ["The amount may not be greater than the amount due ({$invoice->amount_due})."],
                ]);
            }

            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'method' => $data['method'],
                'amount' => $amount,
                'payment_date' => $data['payment_date'],
                'reference' => $data['reference'] ?? null,
                'note' => $data['note'] ?? null,
                'recorded_by' => $user->id,
            ]);

            $invoice->amount_paid = bcadd((string) $invoice->amount_paid, $amount, 2);
            $invoice->amount_due = bcsub((string) $invoice->amount_due, $amount, 2);

            if (bccomp((string) $invoice->amount_due, '0', 2) === 0) {
                $invoice->status = InvoiceStatus::Paid;
            }

            $invoice->save();

            return [
                'payment' => $payment->load(self::relations()),
                'invoice' => $invoice->load([
                    'customer' => fn ($query) => $query->withTrashed(),
                    'subscription' => fn ($query) => $query->withTrashed(),
                ]),
            ];
        });
    }

    /**
     * PAY-03: reverse the amounts; paid -> confirmed once something is due again.
     */
    public function delete(Payment $payment): void
    {
        DB::transaction(function () use ($payment): void {
            $invoice = Invoice::whereKey($payment->invoice_id)->lockForUpdate()->firstOrFail();
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            $invoice->amount_paid = bcsub((string) $invoice->amount_paid, (string) $locked->amount, 2);
            $invoice->amount_due = bcadd((string) $invoice->amount_due, (string) $locked->amount, 2);

            if ($invoice->status === InvoiceStatus::Paid && bccomp((string) $invoice->amount_due, '0', 2) === 1) {
                $invoice->status = InvoiceStatus::Confirmed;
            }

            $invoice->save();
            $locked->delete();
        });
    }
}

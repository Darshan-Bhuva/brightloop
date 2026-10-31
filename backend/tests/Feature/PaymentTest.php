<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_partial_then_full_payment_moves_invoice_to_paid(): void
    {
        Passport::actingAs(User::factory()->create(['role' => Role::Staff, 'is_active' => true]));

        $invoice = Invoice::factory()->create([
            'status' => InvoiceStatus::Confirmed,
            'total' => '1178.82',
            'amount_paid' => '0.00',
            'amount_due' => '1178.82',
        ]);

        $this->postJson('/api/payments', [
            'invoice_id' => $invoice->id,
            'method' => 'upi',
            'amount' => '500.00',
            'payment_date' => today()->toDateString(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.payment.amount', '500.00')
            ->assertJsonPath('data.invoice.status', 'confirmed')
            ->assertJsonPath('data.invoice.amount_paid', '500.00')
            ->assertJsonPath('data.invoice.amount_due', '678.82');

        $this->postJson('/api/payments', [
            'invoice_id' => $invoice->id,
            'method' => 'cash',
            'amount' => '678.82',
            'payment_date' => today()->toDateString(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.invoice.status', 'paid')
            ->assertJsonPath('data.invoice.amount_paid', '1178.82')
            ->assertJsonPath('data.invoice.amount_due', '0.00');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame('0.00', $invoice->amount_due);
        $this->assertDatabaseCount('payments', 2);
    }
}

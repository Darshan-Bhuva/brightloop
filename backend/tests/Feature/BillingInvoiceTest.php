<?php

namespace Tests\Feature;

use App\Enums\BillingPeriod;
use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Enums\SubscriptionLineType;
use App\Enums\SubscriptionStatus;
use App\Enums\TaxType;
use App\Mail\InvoiceMail;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Invoice;
use App\Models\PaymentTerm;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SubscriptionLine;
use App\Models\Tax;
use App\Models\User;
use App\Services\DiscountService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Passport\Passport;
use Tests\TestCase;

class BillingInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $staff;

    private User $customerUser;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => Role::Admin,
            'is_active' => true,
        ]);

        $this->staff = User::factory()->create([
            'role' => Role::Staff,
            'is_active' => true,
        ]);

        $this->customerUser = User::factory()->create([
            'role' => Role::Customer,
            'is_active' => true,
        ]);

        $this->customer = Customer::factory()->create([
            'user_id' => $this->customerUser->id,
            'email' => $this->customerUser->email,
        ]);
    }

    public function test_billing_run_is_idempotent(): void
    {
        Passport::actingAs($this->admin);

        $tax = Tax::factory()->create(['name' => 'GST 18%', 'rate' => 18.00, 'type' => TaxType::Percentage]);
        $plan = Plan::factory()->create([
            'billing_period' => BillingPeriod::Monthly,
            'price' => 1000.00,
            'tax_id' => $tax->id,
            'start_date' => '2026-01-01',
        ]);
        $term = PaymentTerm::factory()->create(['due_days' => 15]);

        $sub = Subscription::factory()->create([
            'customer_id' => $this->customer->id,
            'plan_id' => $plan->id,
            'payment_term_id' => $term->id,
            'status' => SubscriptionStatus::Active,
            'is_paused' => false,
            'start_date' => '2026-01-01',
            'expiry_date' => '2026-12-31',
            'next_invoice_date' => '2026-01-01',
            'subtotal' => 1000.00,
            'tax_total' => 180.00,
            'total' => 1180.00,
        ]);

        SubscriptionLine::factory()->create([
            'subscription_id' => $sub->id,
            'line_type' => SubscriptionLineType::Plan,
            'product_id' => null,
            'description' => 'Plan fee',
            'quantity' => 1,
            'unit_price' => 1000.00,
            'tax_id' => $tax->id,
            'amount' => 1000.00,
            'tax_amount' => 180.00,
        ]);

        // First run as of 2026-01-15 -> creates 1 invoice for Jan
        $res1 = $this->postJson('/api/billing/run', ['as_of_date' => '2026-01-15']);
        $res1->assertStatus(200);
        $res1->assertJsonPath('data.invoices_created', 1);
        $res1->assertJsonPath('data.skipped', 0);

        $inv = Invoice::where('subscription_id', $sub->id)->firstOrFail();
        $this->assertEquals(InvoiceStatus::Draft, $inv->status);
        $this->assertEquals('2026-01-01', $inv->period_start->toDateString());
        $this->assertEquals('2026-01-31', $inv->period_end->toDateString());

        // Second run right away -> 0 created (idempotent)
        $res2 = $this->postJson('/api/billing/run', ['as_of_date' => '2026-01-15']);
        $res2->assertStatus(200);
        $res2->assertJsonPath('data.invoices_created', 0);
    }

    public function test_billing_applies_line_and_subscription_discounts_and_updates_usage_limit(): void
    {
        Passport::actingAs($this->admin);

        $tax = Tax::factory()->create(['name' => 'GST 18%', 'rate' => 18.00, 'type' => TaxType::Percentage]);
        $plan = Plan::factory()->create([
            'billing_period' => BillingPeriod::Monthly,
            'price' => 1000.00,
            'tax_id' => $tax->id,
            'start_date' => '2026-01-01',
        ]);
        $product = Product::factory()->create([
            'sales_price' => 500.00,
            'tax_id' => $tax->id,
        ]);
        $term = PaymentTerm::factory()->create(['due_days' => 15]);

        // Line discount: 10% on $product when qty >= 2
        $lineDiscount = Discount::factory()->create([
            'name' => 'Volume 10%',
            'type' => DiscountType::Percentage,
            'value' => 10.00,
            'applies_to' => DiscountAppliesTo::Products,
            'min_quantity' => 2,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'usage_limit' => 5,
            'used_count' => 0,
            'is_active' => true,
        ]);
        $lineDiscount->products()->attach($product->id);

        // Subscription discount: Fixed 200 off
        $subDiscount = Discount::factory()->create([
            'name' => 'Loyalty 200 Off',
            'type' => DiscountType::Fixed,
            'value' => 200.00,
            'applies_to' => DiscountAppliesTo::Subscription,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'usage_limit' => 1,
            'used_count' => 0,
            'is_active' => true,
        ]);

        $sub = Subscription::factory()->create([
            'customer_id' => $this->customer->id,
            'plan_id' => $plan->id,
            'payment_term_id' => $term->id,
            'status' => SubscriptionStatus::Active,
            'is_paused' => false,
            'start_date' => '2026-01-01',
            'expiry_date' => '2026-12-31',
            'next_invoice_date' => '2026-01-01',
        ]);
        $sub->discounts()->attach($subDiscount->id);

        // Plan line: 1000 gross
        SubscriptionLine::factory()->create([
            'subscription_id' => $sub->id,
            'line_type' => SubscriptionLineType::Plan,
            'product_id' => null,
            'description' => 'Plan fee',
            'quantity' => 1,
            'unit_price' => 1000.00,
            'tax_id' => $tax->id,
            'amount' => 1000.00,
            'sort_order' => 0,
        ]);

        // Product line: 2 * 500 = 1000 gross
        SubscriptionLine::factory()->create([
            'subscription_id' => $sub->id,
            'line_type' => SubscriptionLineType::Product,
            'product_id' => $product->id,
            'description' => 'Product line',
            'quantity' => 2,
            'unit_price' => 500.00,
            'tax_id' => $tax->id,
            'amount' => 1000.00,
            'sort_order' => 1,
        ]);

        $runRes = $this->postJson('/api/billing/run', ['as_of_date' => '2026-01-15']);
        $runRes->assertStatus(200);

        // Check invoice
        $invoice = Invoice::where('subscription_id', $sub->id)->firstOrFail();
        $this->assertEquals($subDiscount->id, $invoice->discount_id);

        // Subtotal = 2000.00
        $this->assertEquals('2000.00', $invoice->subtotal);

        // Product line got 10% line discount = 100.00
        // Net before sub discount: Plan=1000.00, Product=900.00 (Total base = 1900.00)
        // Sub discount 200 spread:
        // Plan share: 200 * (1000 / 1900) = 105.26
        // Product share: remainder = 200 - 105.26 = 94.74
        // Total discounts: 100 + 200 = 300.00
        $this->assertEquals('300.00', $invoice->discount_total);

        // Check usage counts incremented
        $this->assertEquals(1, $lineDiscount->fresh()->used_count);
        $this->assertEquals(1, $subDiscount->fresh()->used_count);

        // Since subDiscount had usage_limit = 1, it is now exhausted
        $this->assertFalse(app(DiscountService::class)->isEligible($subDiscount->fresh(), '2026-02-01'));
    }

    public function test_billing_run_catches_up_missed_periods(): void
    {
        Passport::actingAs($this->admin);

        $tax = Tax::factory()->create(['rate' => 0.00]);
        $plan = Plan::factory()->create([
            'billing_period' => BillingPeriod::Monthly,
            'price' => 500.00,
            'tax_id' => $tax->id,
            'start_date' => '2026-01-01',
        ]);
        $term = PaymentTerm::factory()->create(['due_days' => 15]);

        // Subscription next_invoice_date is 3 months back
        $sub = Subscription::factory()->create([
            'customer_id' => $this->customer->id,
            'plan_id' => $plan->id,
            'payment_term_id' => $term->id,
            'status' => SubscriptionStatus::Active,
            'is_paused' => false,
            'start_date' => '2026-01-01',
            'expiry_date' => '2026-12-31',
            'next_invoice_date' => '2026-01-01',
        ]);

        SubscriptionLine::factory()->create([
            'subscription_id' => $sub->id,
            'line_type' => SubscriptionLineType::Plan,
            'product_id' => null,
            'quantity' => 1,
            'unit_price' => 500.00,
            'tax_id' => $tax->id,
            'amount' => 500.00,
        ]);

        // Run as of 2026-03-15 -> covers Jan, Feb, Mar (3 periods)
        $res = $this->postJson('/api/billing/run', ['as_of_date' => '2026-03-15']);
        $res->assertStatus(200);
        $res->assertJsonPath('data.invoices_created', 3);

        $invoices = Invoice::where('subscription_id', $sub->id)->orderBy('period_start', 'asc')->get();
        $this->assertCount(3, $invoices);
        $this->assertEquals('2026-01-01', $invoices[0]->period_start->toDateString());
        $this->assertEquals('2026-02-01', $invoices[1]->period_start->toDateString());
        $this->assertEquals('2026-03-01', $invoices[2]->period_start->toDateString());

        // Next invoice date advanced to 2026-04-01
        $this->assertEquals('2026-04-01', $sub->fresh()->next_invoice_date->toDateString());
    }

    public function test_invoice_lifecycle_transitions(): void
    {
        Mail::fake();

        $invoice = Invoice::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => InvoiceStatus::Draft,
            'subtotal' => 1000.00,
            'total' => 1000.00,
            'amount_paid' => 0.00,
            'amount_due' => 1000.00,
            'invoice_date' => '2026-05-01',
            'due_date' => '2026-05-15',
        ]);

        Passport::actingAs($this->staff);

        // Update draft invoice
        $upd = $this->putJson("/api/invoices/{$invoice->id}", [
            'due_date' => '2026-05-20',
            'notes' => 'Updated terms',
        ]);
        $upd->assertStatus(200);
        $upd->assertJsonPath('data.due_date', '2026-05-20');

        // Confirm
        $conf = $this->postJson("/api/invoices/{$invoice->id}/confirm");
        $conf->assertStatus(200);
        $conf->assertJsonPath('data.status', 'confirmed');

        // Send email
        $send = $this->postJson("/api/invoices/{$invoice->id}/send");
        $send->assertStatus(200);
        $send->assertJsonPath('data.status', 'confirmed');
        Mail::assertSent(InvoiceMail::class);

        // Cancel confirmed invoice
        $cancel = $this->postJson("/api/invoices/{$invoice->id}/cancel", ['reason' => 'Customer request']);
        $cancel->assertStatus(200);
        $cancel->assertJsonPath('data.status', 'cancelled');
    }

    public function test_bulk_confirm_invoices(): void
    {
        Passport::actingAs($this->admin);

        $inv1 = Invoice::factory()->create(['status' => InvoiceStatus::Draft, 'amount_due' => 100.00]);
        $inv2 = Invoice::factory()->create(['status' => InvoiceStatus::Draft, 'amount_due' => 200.00]);
        $inv3 = Invoice::factory()->create(['status' => InvoiceStatus::Confirmed, 'amount_due' => 100.00]);

        $res = $this->postJson('/api/invoices/bulk-confirm', [
            'ids' => [$inv1->id, $inv2->id, $inv3->id],
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.confirmed', 2);
        $res->assertJsonCount(1, 'data.skipped');
        $this->assertEquals(InvoiceStatus::Confirmed, $inv1->fresh()->status);
        $this->assertEquals(InvoiceStatus::Confirmed, $inv2->fresh()->status);
    }

    public function test_customer_scoping_on_invoices(): void
    {
        $draftInvoice = Invoice::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => InvoiceStatus::Draft,
        ]);
        $confirmedInvoice = Invoice::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => InvoiceStatus::Confirmed,
        ]);

        $otherCustomer = Customer::factory()->create();
        $otherInvoice = Invoice::factory()->create([
            'customer_id' => $otherCustomer->id,
            'status' => InvoiceStatus::Confirmed,
        ]);

        Passport::actingAs($this->customerUser);

        // Customer cannot see draft invoice (404)
        $this->getJson("/api/invoices/{$draftInvoice->id}")->assertStatus(404);

        // Customer cannot see another customer's invoice (404)
        $this->getJson("/api/invoices/{$otherInvoice->id}")->assertStatus(404);

        // Customer can see own confirmed invoice
        $res = $this->getJson("/api/invoices/{$confirmedInvoice->id}");
        $res->assertStatus(200);
        $res->assertJsonPath('data.id', $confirmedInvoice->id);
        $res->assertJsonPath('data.allowed_actions', ['print']);

        // Customer list excludes draft
        $listRes = $this->getJson('/api/invoices');
        $listRes->assertStatus(200);
        $listRes->assertJsonCount(1, 'data');
        $listRes->assertJsonPath('data.0.id', $confirmedInvoice->id);
    }
}

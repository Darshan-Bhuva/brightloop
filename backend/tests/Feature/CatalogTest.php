<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Enums\TaxType;
use App\Models\PaymentTerm;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Subscription;
use App\Models\SubscriptionLine;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $staff;

    private User $customer;

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

        $this->customer = User::factory()->create([
            'role' => Role::Customer,
            'is_active' => true,
        ]);
    }

    public function test_taxes_cannot_be_accessed_without_auth(): void
    {
        $response = $this->getJson('/api/taxes');
        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
            'message' => 'Unauthenticated.',
        ]);
    }

    public function test_customer_cannot_access_taxes(): void
    {
        Passport::actingAs($this->customer);

        $response = $this->getJson('/api/taxes');
        $response->assertStatus(403);
    }

    public function test_staff_and_admin_can_list_taxes(): void
    {
        Tax::factory()->create(['name' => 'VAT 10%', 'type' => TaxType::Percentage, 'rate' => 10.00, 'is_active' => true]);

        Passport::actingAs($this->staff);
        $resStaff = $this->getJson('/api/taxes');
        $resStaff->assertStatus(200);
        $resStaff->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => ['id', 'name', 'type', 'rate', 'is_active'],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);

        Passport::actingAs($this->admin);
        $resAdmin = $this->getJson('/api/taxes?all=1');
        $resAdmin->assertStatus(200);
        $resAdmin->assertJsonPath('meta', null);
    }

    public function test_admin_can_create_tax_with_validation(): void
    {
        Passport::actingAs($this->admin);

        // Percentage over 100 fails
        $failRes = $this->postJson('/api/taxes', [
            'name' => 'High Tax',
            'type' => 'percentage',
            'rate' => 150,
        ]);
        $failRes->assertStatus(422);
        $failRes->assertJsonValidationErrors(['rate']);

        // Valid tax creation
        $res = $this->postJson('/api/taxes', [
            'name' => 'GST 28%',
            'type' => 'percentage',
            'rate' => 28,
            'is_active' => true,
        ]);
        $res->assertStatus(201);
        $res->assertJsonPath('data.name', 'GST 28%');
        $res->assertJsonPath('data.rate', '28.00');
        $res->assertJsonPath('data.type', 'percentage');
        $res->assertJsonPath('data.is_active', true);

        // Duplicate name fails
        $dupRes = $this->postJson('/api/taxes', [
            'name' => 'GST 28%',
            'type' => 'fixed',
            'rate' => 50,
        ]);
        $dupRes->assertStatus(422);
        $dupRes->assertJsonValidationErrors(['name']);
    }

    public function test_staff_cannot_create_or_update_or_delete_tax(): void
    {
        $tax = Tax::factory()->create(['name' => 'GST 5%', 'type' => TaxType::Percentage, 'rate' => 5.00]);
        Passport::actingAs($this->staff);

        $this->postJson('/api/taxes', ['name' => 'New Tax', 'type' => 'fixed', 'rate' => 10])
            ->assertStatus(403);

        $this->putJson("/api/taxes/{$tax->id}", ['name' => 'GST 6%', 'type' => 'percentage', 'rate' => 6])
            ->assertStatus(403);

        $this->deleteJson("/api/taxes/{$tax->id}")
            ->assertStatus(403);
    }

    public function test_admin_can_update_tax(): void
    {
        $tax = Tax::factory()->create(['name' => 'GST 12%', 'type' => TaxType::Percentage, 'rate' => 12.00]);
        Passport::actingAs($this->admin);

        $res = $this->putJson("/api/taxes/{$tax->id}", [
            'name' => 'GST 12% Updated',
            'type' => 'percentage',
            'rate' => 12.5,
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.name', 'GST 12% Updated');
        $res->assertJsonPath('data.rate', '12.50');
    }

    public function test_delete_tax_in_use_returns_409(): void
    {
        $tax = Tax::factory()->create();
        Product::factory()->create(['tax_id' => $tax->id]);

        Passport::actingAs($this->admin);

        $res = $this->deleteJson("/api/taxes/{$tax->id}");
        $res->assertStatus(409);
        $res->assertJsonPath('message', 'Tax is in use; deactivate it instead');

        // Unused tax deletes successfully
        $unusedTax = Tax::factory()->create();
        $delRes = $this->deleteJson("/api/taxes/{$unusedTax->id}");
        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('taxes', ['id' => $unusedTax->id]);
    }

    public function test_payment_terms_crud_and_in_use_check(): void
    {
        Passport::actingAs($this->admin);

        // Validation error: due_days > 365
        $fail = $this->postJson('/api/payment-terms', [
            'name' => 'Too long',
            'due_days' => 400,
        ]);
        $fail->assertStatus(422);

        // Create
        $createRes = $this->postJson('/api/payment-terms', [
            'name' => 'Net 60',
            'due_days' => 60,
        ]);
        $createRes->assertStatus(201);
        $createRes->assertJsonPath('data.name', 'Net 60');
        $createRes->assertJsonPath('data.due_days', 60);

        $termId = $createRes->json('data.id');

        // Update
        $updateRes = $this->putJson("/api/payment-terms/{$termId}", [
            'name' => 'Net 60 Days',
            'due_days' => 60,
        ]);
        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.name', 'Net 60 Days');

        // List
        Passport::actingAs($this->staff);
        $listRes = $this->getJson('/api/payment-terms?all=1');
        $listRes->assertStatus(200);
        $listRes->assertJsonPath('meta', null);

        // Delete when in use by subscription returns 409
        Passport::actingAs($this->admin);
        $inUseTerm = PaymentTerm::factory()->create(['name' => 'Used Term', 'due_days' => 15]);
        Subscription::factory()->create([
            'payment_term_id' => $inUseTerm->id,
            'status' => SubscriptionStatus::Draft,
        ]);

        $delFail = $this->deleteJson("/api/payment-terms/{$inUseTerm->id}");
        $delFail->assertStatus(409);

        // Delete unused succeeds
        $delSuccess = $this->deleteJson("/api/payment-terms/{$termId}");
        $delSuccess->assertStatus(200);
    }

    public function test_product_creation_with_variants_and_duplicate_check(): void
    {
        Passport::actingAs($this->admin);

        $tax = Tax::factory()->create(['name' => 'GST 18%', 'rate' => 18.00]);

        // Duplicate variant combinations fail with 422
        $dupRes = $this->postJson('/api/products', [
            'name' => 'Test Suite',
            'type' => 'service',
            'sales_price' => 4000.00,
            'cost_price' => 1500.00,
            'tax_id' => $tax->id,
            'variants' => [
                ['attribute' => 'Brand', 'value' => 'Odoo', 'extra_price' => 560],
                ['attribute' => 'Brand', 'value' => 'Odoo', 'extra_price' => 100],
            ],
        ]);
        $dupRes->assertStatus(422);
        $dupRes->assertJsonValidationErrors(['variants']);

        // Valid product creation with variants
        $createRes = $this->postJson('/api/products', [
            'name' => 'Test Suite',
            'type' => 'service',
            'sales_price' => 4000.00,
            'cost_price' => 1500.00,
            'tax_id' => $tax->id,
            'notes' => 'Great product suite',
            'variants' => [
                ['attribute' => 'Brand', 'value' => 'Odoo', 'extra_price' => 560],
                ['attribute' => 'Brand', 'value' => 'Zoho', 'extra_price' => 300],
            ],
        ]);
        $createRes->assertStatus(201);
        $createRes->assertJsonPath('data.name', 'Test Suite');
        $createRes->assertJsonPath('data.sales_price', '4000.00');
        $createRes->assertJsonPath('data.cost_price', '1500.00');
        $createRes->assertJsonPath('data.tax.name', 'GST 18%');
        $createRes->assertJsonPath('data.tax.rate', '18.00');
        $createRes->assertJsonCount(2, 'data.variants');
        $createRes->assertJsonPath('data.variants.0.attribute', 'Brand');
        $createRes->assertJsonPath('data.variants.0.value', 'Odoo');
        $createRes->assertJsonPath('data.variants.0.extra_price', '560.00');
    }

    public function test_product_update_syncs_variants_correctly(): void
    {
        Passport::actingAs($this->admin);

        $product = Product::factory()->create([
            'sales_price' => 1000.00,
            'cost_price' => 500.00,
        ]);
        $v1 = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'attribute' => 'Color',
            'value' => 'Red',
            'extra_price' => 10.00,
        ]);
        $v2 = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'attribute' => 'Color',
            'value' => 'Blue',
            'extra_price' => 20.00,
        ]);

        // Sync: update $v1, drop $v2, add new Green variant
        $updateRes = $this->putJson("/api/products/{$product->id}", [
            'name' => $product->name,
            'type' => $product->type->value,
            'sales_price' => 1200.00,
            'cost_price' => 600.00,
            'variants' => [
                ['id' => $v1->id, 'attribute' => 'Color', 'value' => 'Dark Red', 'extra_price' => 15.00],
                ['attribute' => 'Color', 'value' => 'Green', 'extra_price' => 25.00],
            ],
        ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.sales_price', '1200.00');
        $updateRes->assertJsonCount(2, 'data.variants');

        // Check DB states: v1 updated, v2 soft-deleted, new variant created
        $this->assertDatabaseHas('product_variants', [
            'id' => $v1->id,
            'value' => 'Dark Red',
            'deleted_at' => null,
        ]);
        $this->assertSoftDeleted('product_variants', [
            'id' => $v2->id,
        ]);
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'value' => 'Green',
            'deleted_at' => null,
        ]);
    }

    public function test_delete_product_in_active_or_pending_subscription_returns_409(): void
    {
        Passport::actingAs($this->admin);

        $product = Product::factory()->create();
        $subscription = Subscription::factory()->create(['status' => SubscriptionStatus::Confirmed]);
        SubscriptionLine::factory()->create([
            'subscription_id' => $subscription->id,
            'product_id' => $product->id,
        ]);

        $res = $this->deleteJson("/api/products/{$product->id}");
        $res->assertStatus(409);
        $res->assertJsonPath('message', 'Product is in use by an active or pending subscription; cannot be deleted.');

        // Deleting a product not in active/pending subscription soft-deletes it
        $unusedProduct = Product::factory()->create();
        $unusedVariant = ProductVariant::factory()->create(['product_id' => $unusedProduct->id]);

        $delRes = $this->deleteJson("/api/products/{$unusedProduct->id}");
        $delRes->assertStatus(200);

        $this->assertSoftDeleted('products', ['id' => $unusedProduct->id]);
        $this->assertSoftDeleted('product_variants', ['id' => $unusedVariant->id]);
    }
}

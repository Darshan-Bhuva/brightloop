<?php

namespace Tests\Feature;

use App\Enums\BillingPeriod;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Discount;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class PlanDiscountTest extends TestCase
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

    public function test_plans_and_discounts_require_authentication(): void
    {
        $this->getJson('/api/plans')->assertStatus(401);
        $this->getJson('/api/discounts')->assertStatus(401);
    }

    public function test_customers_cannot_access_plans_or_discounts(): void
    {
        Passport::actingAs($this->customer);

        $this->getJson('/api/plans')->assertStatus(403);
        $this->getJson('/api/discounts')->assertStatus(403);
    }

    public function test_staff_and_admin_can_list_plans_with_filters_and_all(): void
    {
        $tax = Tax::factory()->create(['name' => 'GST 18%', 'rate' => 18.00]);
        Plan::factory()->create([
            'name' => 'Monthly Starter',
            'price' => 999.00,
            'billing_period' => BillingPeriod::Monthly,
            'tax_id' => $tax->id,
            'start_date' => now()->subDays(30)->toDateString(),
            'end_date' => null,
            'is_active' => true,
        ]);
        Plan::factory()->create([
            'name' => 'Inactive Plan',
            'price' => 499.00,
            'billing_period' => BillingPeriod::Monthly,
            'start_date' => now()->subDays(10)->toDateString(),
            'is_active' => false,
        ]);

        Passport::actingAs($this->staff);
        $res = $this->getJson('/api/plans?available=1');
        $res->assertStatus(200);
        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.name', 'Monthly Starter');
        $res->assertJsonPath('data.0.is_available', true);
        $res->assertJsonPath('data.0.tax.name', 'GST 18%');
        $res->assertJsonPath('data.0.tax.rate', '18.00');

        Passport::actingAs($this->admin);
        $resAll = $this->getJson('/api/plans?all=1');
        $resAll->assertStatus(200);
        $resAll->assertJsonCount(2, 'data');
        $resAll->assertJsonPath('meta', null);
    }

    public function test_admin_can_create_plan_with_validation(): void
    {
        Passport::actingAs($this->admin);

        // Validation: end_date before start_date fails
        $fail = $this->postJson('/api/plans', [
            'name' => 'Invalid Plan',
            'price' => 100,
            'billing_period' => 'monthly',
            'start_date' => '2026-05-10',
            'end_date' => '2026-05-01',
        ]);
        $fail->assertStatus(422);
        $fail->assertJsonValidationErrors(['end_date']);

        // Valid plan
        $tax = Tax::factory()->create();
        $res = $this->postJson('/api/plans', [
            'name' => 'Quarterly Test',
            'price' => 1499.00,
            'billing_period' => 'monthly',
            'min_quantity' => 2,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(90)->toDateString(),
            'tax_id' => $tax->id,
            'pausable' => true,
            'closable' => true,
        ]);

        $res->assertStatus(201);
        $res->assertJsonPath('data.name', 'Quarterly Test');
        $res->assertJsonPath('data.price', '1499.00');
        $res->assertJsonPath('data.pausable', true);
        $res->assertJsonPath('data.is_available', true);
    }

    public function test_staff_cannot_create_or_update_or_delete_plans(): void
    {
        $plan = Plan::factory()->create();
        Passport::actingAs($this->staff);

        $this->postJson('/api/plans', [
            'name' => 'Staff Plan',
            'price' => 100,
            'billing_period' => 'daily',
            'start_date' => now()->toDateString(),
        ])->assertStatus(403);

        $this->putJson("/api/plans/{$plan->id}", [
            'name' => 'Updated Plan',
            'price' => 120,
            'billing_period' => 'daily',
            'start_date' => now()->toDateString(),
        ])->assertStatus(403);

        $this->deleteJson("/api/plans/{$plan->id}")->assertStatus(403);
    }

    public function test_admin_can_update_plan(): void
    {
        $plan = Plan::factory()->create(['name' => 'Old Plan', 'price' => 500.00]);
        Passport::actingAs($this->admin);

        $res = $this->putJson("/api/plans/{$plan->id}", [
            'name' => 'New Plan Name',
            'price' => 650.00,
            'billing_period' => $plan->billing_period->value,
            'start_date' => $plan->start_date->toDateString(),
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('data.name', 'New Plan Name');
        $res->assertJsonPath('data.price', '650.00');
    }

    public function test_delete_plan_used_by_subscription_returns_409(): void
    {
        $plan = Plan::factory()->create();
        Subscription::factory()->create([
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
        ]);

        Passport::actingAs($this->admin);
        $res = $this->deleteJson("/api/plans/{$plan->id}");
        $res->assertStatus(409);
        $res->assertJsonPath('message', 'Plan is in use by subscriptions; cannot be deleted.');

        // Delete unused succeeds
        $unusedPlan = Plan::factory()->create();
        $delRes = $this->deleteJson("/api/plans/{$unusedPlan->id}");
        $delRes->assertStatus(200);
        $this->assertSoftDeleted('plans', ['id' => $unusedPlan->id]);
    }

    public function test_discount_creation_and_validation(): void
    {
        Passport::actingAs($this->admin);

        // Percentage > 100 fails
        $fail1 = $this->postJson('/api/discounts', [
            'name' => 'Over 100',
            'type' => 'percentage',
            'value' => 150,
            'applies_to' => 'subscription',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
        ]);
        $fail1->assertStatus(422);
        $fail1->assertJsonValidationErrors(['value']);

        // Products discount without products fails
        $fail2 = $this->postJson('/api/discounts', [
            'name' => 'No products',
            'type' => 'percentage',
            'value' => 10,
            'applies_to' => 'products',
            'product_ids' => [],
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
        ]);
        $fail2->assertStatus(422);
        $fail2->assertJsonValidationErrors(['product_ids']);

        // Subscription discount with product_ids fails
        $product = Product::factory()->create();
        $fail3 = $this->postJson('/api/discounts', [
            'name' => 'Sub with products',
            'type' => 'percentage',
            'value' => 10,
            'applies_to' => 'subscription',
            'product_ids' => [$product->id],
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
        ]);
        $fail3->assertStatus(422);
        $fail3->assertJsonValidationErrors(['product_ids']);

        // Valid product discount with code (must be uppercase)
        $valid = $this->postJson('/api/discounts', [
            'name' => 'Volume 10%',
            'code' => 'vol10',
            'type' => 'percentage',
            'value' => 10,
            'applies_to' => 'products',
            'product_ids' => [$product->id],
            'min_quantity' => 5,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(20)->toDateString(),
        ]);
        $valid->assertStatus(201);
        $valid->assertJsonPath('data.code', 'VOL10');
        $valid->assertJsonPath('data.state', 'active');
        $valid->assertJsonCount(1, 'data.products');
        $valid->assertJsonPath('data.products.0.id', $product->id);
    }

    public function test_discount_state_derivation_and_filtering(): void
    {
        // 1. Inactive
        Discount::factory()->create([
            'name' => 'Inactive Discount',
            'is_active' => false,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
        ]);

        // 2. Exhausted
        Discount::factory()->create([
            'name' => 'Exhausted Discount',
            'is_active' => true,
            'usage_limit' => 5,
            'used_count' => 5,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
        ]);

        // 3. Expired
        Discount::factory()->create([
            'name' => 'Expired Discount',
            'is_active' => true,
            'usage_limit' => 10,
            'used_count' => 1,
            'start_date' => now()->subDays(20)->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
        ]);

        // 4. Scheduled
        Discount::factory()->create([
            'name' => 'Scheduled Discount',
            'is_active' => true,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(25)->toDateString(),
        ]);

        // 5. Active
        Discount::factory()->create([
            'name' => 'Active Discount',
            'is_active' => true,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
        ]);

        Passport::actingAs($this->staff);

        $resExpired = $this->getJson('/api/discounts?state=expired');
        $resExpired->assertStatus(200);
        $resExpired->assertJsonCount(1, 'data');
        $resExpired->assertJsonPath('data.0.name', 'Expired Discount');
        $resExpired->assertJsonPath('data.0.state', 'expired');

        $resActive = $this->getJson('/api/discounts?state=active');
        $resActive->assertStatus(200);
        $resActive->assertJsonCount(1, 'data');
        $resActive->assertJsonPath('data.0.name', 'Active Discount');

        $resScheduled = $this->getJson('/api/discounts?state=scheduled');
        $resScheduled->assertStatus(200);
        $resScheduled->assertJsonCount(1, 'data');
        $resScheduled->assertJsonPath('data.0.name', 'Scheduled Discount');
    }

    public function test_discount_update_validates_usage_limit(): void
    {
        $discount = Discount::factory()->create([
            'used_count' => 8,
            'usage_limit' => 10,
        ]);

        Passport::actingAs($this->admin);

        // Lower than used_count fails with 422
        $fail = $this->putJson("/api/discounts/{$discount->id}", [
            'name' => $discount->name,
            'type' => $discount->type->value,
            'value' => $discount->value,
            'applies_to' => $discount->applies_to->value,
            'start_date' => $discount->start_date->toDateString(),
            'end_date' => $discount->end_date->toDateString(),
            'usage_limit' => 6,
        ]);
        $fail->assertStatus(422);
        $fail->assertJsonValidationErrors(['usage_limit']);

        // Equal or higher succeeds
        $success = $this->putJson("/api/discounts/{$discount->id}", [
            'name' => $discount->name,
            'type' => $discount->type->value,
            'value' => $discount->value,
            'applies_to' => $discount->applies_to->value,
            'start_date' => $discount->start_date->toDateString(),
            'end_date' => $discount->end_date->toDateString(),
            'usage_limit' => 12,
        ]);
        $success->assertStatus(200);
        $success->assertJsonPath('data.usage_limit', 12);
        $success->assertJsonPath('data.remaining_uses', 4);
    }

    public function test_discount_soft_delete(): void
    {
        $discount = Discount::factory()->create();

        Passport::actingAs($this->admin);
        $res = $this->deleteJson("/api/discounts/{$discount->id}");
        $res->assertStatus(200);

        $this->assertSoftDeleted('discounts', ['id' => $discount->id]);
    }
}

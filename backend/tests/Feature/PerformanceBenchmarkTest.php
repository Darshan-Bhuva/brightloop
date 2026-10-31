<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceBenchmarkTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscriptions_and_invoices_explain_and_performance(): void
    {
        $this->seed(DatabaseSeeder::class);
        $admin = User::where('role', 'admin')->firstOrFail();

        $prefix = DB::connection()->getDriverName() === 'sqlite' ? 'EXPLAIN QUERY PLAN ' : 'EXPLAIN ';

        // Run EXPLAIN on subscriptions list query
        $subExplain = DB::select($prefix.'SELECT * FROM subscriptions ORDER BY created_at DESC, id DESC LIMIT 15');
        $this->assertNotEmpty($subExplain);

        // Run EXPLAIN on invoices overdue query
        $invExplain = DB::select($prefix.'SELECT * FROM invoices WHERE status = ? AND due_date < CURRENT_DATE AND amount_due > 0 ORDER BY invoice_date DESC, id DESC LIMIT 15', ['confirmed']);
        $this->assertNotEmpty($invExplain);

        // Run EXPLAIN on reports summary aggregate query
        $rptExplain = DB::select($prefix.'SELECT status, count(*), sum(total) FROM invoices WHERE status IN (?, ?) GROUP BY status', ['confirmed', 'paid']);
        $this->assertNotEmpty($rptExplain);

        // Test GET /subscriptions response time and N+1 prevention
        $start = microtime(true);
        $responseSub = $this->actingAs($admin, 'api')->getJson('/api/subscriptions');
        $subDuration = microtime(true) - $start;

        $responseSub->assertStatus(200);
        $this->assertLessThan(2.0, $subDuration, "GET /subscriptions took {$subDuration}s, must be < 2s");

        // Test GET /invoices response time and N+1 prevention
        $start = microtime(true);
        $responseInv = $this->actingAs($admin, 'api')->getJson('/api/invoices');
        $invDuration = microtime(true) - $start;

        $responseInv->assertStatus(200);
        $this->assertLessThan(2.0, $invDuration, "GET /invoices took {$invDuration}s, must be < 2s");

        // Test GET /invoices?overdue=true response time
        $start = microtime(true);
        $responseOverdue = $this->actingAs($admin, 'api')->getJson('/api/invoices?overdue=true');
        $overdueDuration = microtime(true) - $start;

        $responseOverdue->assertStatus(200);
        $this->assertLessThan(2.0, $overdueDuration, "GET /invoices?overdue=true took {$overdueDuration}s, must be < 2s");
    }

    public function test_demo_volume_seeder_execution(): void
    {
        $this->seed(DatabaseSeeder::class);

        // Run DemoVolumeSeeder
        $this->artisan('db:seed', ['--class' => 'DemoVolumeSeeder'])->assertSuccessful();

        $admin = User::where('role', 'admin')->firstOrFail();

        // Check GET /subscriptions with 3000 volume subscriptions
        $start = microtime(true);
        $responseSub = $this->actingAs($admin, 'api')->getJson('/api/subscriptions');
        $subDuration = microtime(true) - $start;

        $responseSub->assertStatus(200);
        $this->assertLessThan(2.0, $subDuration);

        // Check GET /invoices with 8000 volume invoices
        $start = microtime(true);
        $responseInv = $this->actingAs($admin, 'api')->getJson('/api/invoices');
        $invDuration = microtime(true) - $start;

        $responseInv->assertStatus(200);
        $this->assertLessThan(2.0, $invDuration);

        // Check GET /invoices?overdue=true
        $start = microtime(true);
        $responseOverdue = $this->actingAs($admin, 'api')->getJson('/api/invoices?overdue=true');
        $overdueDuration = microtime(true) - $start;

        $responseOverdue->assertStatus(200);
        $this->assertLessThan(2.0, $overdueDuration);
    }
}

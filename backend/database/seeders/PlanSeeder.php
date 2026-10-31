<?php

namespace Database\Seeders;

use App\Enums\BillingPeriod;
use App\Models\Plan;
use App\Models\Tax;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $gst18 = Tax::where('name', 'GST 18%')->firstOrFail();

        $plans = [
            [
                'name' => 'Monthly Starter', 'billing_period' => BillingPeriod::Monthly, 'price' => '999.00', 'min_quantity' => 1,
                'auto_close' => false, 'closable' => true, 'pausable' => true, 'renewable' => true,
            ],
            [
                'name' => 'Yearly Business', 'billing_period' => BillingPeriod::Yearly, 'price' => '9999.00', 'min_quantity' => 5,
                'auto_close' => true, 'closable' => false, 'pausable' => false, 'renewable' => true,
            ],
            [
                'name' => 'Weekly Trial', 'billing_period' => BillingPeriod::Weekly, 'price' => '199.00', 'min_quantity' => 1,
                'auto_close' => true, 'closable' => true, 'pausable' => false, 'renewable' => false,
            ],
            [
                'name' => 'Daily Pass', 'billing_period' => BillingPeriod::Daily, 'price' => '49.00', 'min_quantity' => 1,
                'auto_close' => false, 'closable' => true, 'pausable' => false, 'renewable' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create([
                ...$plan,
                'start_date' => today()->subDays(90),
                'end_date' => null,
                'tax_id' => $gst18->id,
                'is_active' => true,
            ]);
        }
    }
}

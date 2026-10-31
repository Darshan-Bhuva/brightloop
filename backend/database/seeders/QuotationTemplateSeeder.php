<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Product;
use App\Models\QuotationTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuotationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@brightloop.test')->firstOrFail();
        $plan = Plan::where('name', 'Monthly Starter')->firstOrFail();
        $products = Product::whereIn('name', ['Brightloop CRM Seat', 'Extra Storage 100GB'])->get()->keyBy('name');

        $template = QuotationTemplate::create([
            'name' => 'Standard SMB Offer',
            'validity_days' => 14,
            'plan_id' => $plan->id,
            'created_by' => $admin->id,
        ]);

        $template->lines()->createMany([
            ['product_id' => $products['Brightloop CRM Seat']->id, 'variant_id' => null, 'quantity' => 2],
            ['product_id' => $products['Extra Storage 100GB']->id, 'variant_id' => null, 'quantity' => 1],
        ]);
    }
}

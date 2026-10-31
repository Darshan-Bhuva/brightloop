<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database (PLAN section 5 seed data).
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            TaxSeeder::class,
            PaymentTermSeeder::class,
            ProductSeeder::class,
            PlanSeeder::class,
            DiscountSeeder::class,
            QuotationTemplateSeeder::class,
            DemoSubscriptionSeeder::class,
        ]);
    }
}

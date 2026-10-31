<?php

namespace Database\Seeders;

use App\Enums\DiscountAppliesTo;
use App\Enums\DiscountType;
use App\Models\Discount;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        $crmSeat = Product::where('name', 'Brightloop CRM Seat')->firstOrFail();

        $volume = Discount::create([
            'name' => 'Volume 10%',
            'type' => DiscountType::Percentage,
            'value' => '10.00',
            'applies_to' => DiscountAppliesTo::Products,
            'min_quantity' => 10,
            'start_date' => today()->subDays(30),
            'end_date' => today()->addDays(180),
            'is_active' => true,
            'used_count' => 0,
        ]);
        $volume->products()->attach($crmSeat->id);

        // PLAN gives no validity window for this one; same window as Volume 10%.
        Discount::create([
            'name' => 'Loyalty 500 Off',
            'type' => DiscountType::Fixed,
            'value' => '500.00',
            'applies_to' => DiscountAppliesTo::Subscription,
            'min_purchase' => '5000.00',
            'usage_limit' => 5,
            'start_date' => today()->subDays(30),
            'end_date' => today()->addDays(180),
            'is_active' => true,
            'used_count' => 0,
        ]);

        Discount::create([
            'name' => 'Expired Promo',
            'type' => DiscountType::Percentage,
            'value' => '20.00',
            'applies_to' => DiscountAppliesTo::Subscription,
            'start_date' => today()->subDays(60),
            'end_date' => today()->subDays(10),
            'is_active' => true,
            'used_count' => 0,
        ]);
    }
}

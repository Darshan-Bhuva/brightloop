<?php

namespace Database\Seeders;

use App\Enums\ProductType;
use App\Models\Product;
use App\Models\Tax;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $gst18 = Tax::where('name', 'GST 18%')->firstOrFail();
        $gst12 = Tax::where('name', 'GST 12%')->firstOrFail();

        $suite = Product::create([
            'name' => 'Brightloop Business Suite',
            'type' => ProductType::Service,
            'sales_price' => '4000.00',
            'cost_price' => '1500.00',
            'tax_id' => $gst18->id,
            'is_active' => true,
        ]);

        $suite->variants()->createMany([
            ['attribute' => 'Brand', 'value' => 'Odoo', 'extra_price' => '560.00'],
            ['attribute' => 'Brand', 'value' => 'Zoho', 'extra_price' => '300.00'],
            ['attribute' => 'Brand', 'value' => 'Custom', 'extra_price' => '0.00'],
        ]);

        $products = [
            ['name' => 'Brightloop CRM Seat', 'type' => ProductType::Service, 'sales_price' => '1200.00', 'cost_price' => '400.00', 'tax_id' => $gst18->id],
            ['name' => 'Extra Storage 100GB', 'type' => ProductType::Service, 'sales_price' => '300.00', 'cost_price' => '100.00', 'tax_id' => $gst18->id],
            ['name' => 'Priority Support', 'type' => ProductType::Service, 'sales_price' => '800.00', 'cost_price' => '300.00', 'tax_id' => $gst18->id],
            ['name' => 'Onboarding Kit', 'type' => ProductType::Goods, 'sales_price' => '2500.00', 'cost_price' => '1200.00', 'tax_id' => $gst12->id],
        ];

        foreach ($products as $product) {
            Product::create([...$product, 'is_active' => true]);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Enums\TaxType;
use App\Models\Tax;
use Illuminate\Database\Seeder;

class TaxSeeder extends Seeder
{
    public function run(): void
    {
        $taxes = [
            ['name' => 'GST 5%', 'rate' => '5.00'],
            ['name' => 'GST 12%', 'rate' => '12.00'],
            ['name' => 'GST 18%', 'rate' => '18.00'],
            ['name' => 'No Tax', 'rate' => '0.00'],
        ];

        foreach ($taxes as $tax) {
            Tax::create([...$tax, 'type' => TaxType::Percentage, 'is_active' => true]);
        }
    }
}

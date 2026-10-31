<?php

namespace Database\Seeders;

use App\Models\PaymentTerm;
use Illuminate\Database\Seeder;

class PaymentTermSeeder extends Seeder
{
    public function run(): void
    {
        $terms = [
            ['name' => 'Immediate', 'due_days' => 0],
            ['name' => 'Net 15', 'due_days' => 15],
            ['name' => 'Net 30', 'due_days' => 30],
            ['name' => 'Net 45', 'due_days' => 45],
        ];

        foreach ($terms as $term) {
            PaymentTerm::create($term);
        }
    }
}

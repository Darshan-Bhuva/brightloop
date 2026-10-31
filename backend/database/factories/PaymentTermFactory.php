<?php

namespace Database\Factories;

use App\Models\PaymentTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentTerm>
 */
class PaymentTermFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $days = fake()->randomElement([0, 15, 30, 45]);

        return [
            'name' => $days === 0 ? 'Immediate' : 'Net '.$days,
            'due_days' => $days,
        ];
    }
}

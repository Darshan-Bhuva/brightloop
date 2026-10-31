<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin', 'email' => 'admin@brightloop.test', 'password' => 'Admin@12345', 'role' => Role::Admin],
            ['name' => 'Staff', 'email' => 'staff@brightloop.test', 'password' => 'Staff@12345', 'role' => Role::Staff],
            ['name' => 'Demo Customer', 'email' => 'customer@brightloop.test', 'password' => 'Customer@12345', 'role' => Role::Customer],
        ];

        foreach ($users as $user) {
            User::create([...$user, 'is_active' => true, 'email_verified_at' => now()]);
        }

        $customerUser = User::where('email', 'customer@brightloop.test')->firstOrFail();

        Customer::create([
            'user_id' => $customerUser->id,
            'name' => 'Demo Customer',
            'email' => 'customer@brightloop.test',
        ]);
    }
}

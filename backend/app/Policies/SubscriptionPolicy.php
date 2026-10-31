<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Customer;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SubscriptionPolicy
{
    /**
     * Admin/staff see every subscription; a customer only their own (404 for others).
     */
    public function view(User $user, Subscription $subscription): Response
    {
        if ($user->role !== Role::Customer) {
            return Response::allow();
        }

        return Customer::whereKey($subscription->customer_id)->where('user_id', $user->id)->exists()
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}

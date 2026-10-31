<?php

namespace App\Policies;

use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Invoice $invoice): bool
    {
        if (in_array($user->role, [Role::Admin, Role::Staff], true)) {
            return true;
        }

        if ($user->role === Role::Customer) {
            return $invoice->customer?->user_id === $user->id
                && $invoice->status !== InvoiceStatus::Draft;
        }

        return false;
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, [Role::Admin, Role::Staff], true);
    }

    public function confirm(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, [Role::Admin, Role::Staff], true);
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, [Role::Admin, Role::Staff], true);
    }

    public function send(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, [Role::Admin, Role::Staff], true);
    }
}

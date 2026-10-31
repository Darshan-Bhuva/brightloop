<?php

namespace App\Observers;

use App\Models\Subscription;

class SubscriptionObserver
{
    /**
     * BR-11: number = SUB-<id padded to 6>, set right after insert inside the caller's transaction.
     */
    public function created(Subscription $subscription): void
    {
        $subscription->number = 'SUB-'.str_pad((string) $subscription->id, 6, '0', STR_PAD_LEFT);
        $subscription->saveQuietly();
    }
}

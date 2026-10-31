<?php

use App\Services\SubscriptionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('subscriptions:auto-close', function (SubscriptionService $subscriptionService) {
    $this->info('Closed '.$subscriptionService->autoClose().' expired subscription(s).');
})->purpose('Close active subscriptions past expiry_date whose plan has auto_close (BR-4)');

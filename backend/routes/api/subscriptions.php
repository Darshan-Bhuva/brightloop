<?php

use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

// Customers: own records only (scoped in SubscriptionService::list and SubscriptionPolicy::view).
Route::middleware(['auth:api', 'role:admin,staff,customer'])->group(function (): void {
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/pause', [SubscriptionController::class, 'pause'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/close', [SubscriptionController::class, 'close'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])->whereNumber('subscription');
});

Route::middleware(['auth:api', 'role:admin,staff'])->group(function (): void {
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::put('/subscriptions/{subscription}', [SubscriptionController::class, 'update'])->whereNumber('subscription');
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/send-quotation', [SubscriptionController::class, 'sendQuotation'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/confirm', [SubscriptionController::class, 'confirm'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/activate', [SubscriptionController::class, 'activate'])->whereNumber('subscription');
    Route::post('/subscriptions/{subscription}/discounts', [SubscriptionController::class, 'attachDiscount'])->whereNumber('subscription');
    Route::delete('/subscriptions/{subscription}/discounts/{discountId}', [SubscriptionController::class, 'detachDiscount'])
        ->whereNumber(['subscription', 'discountId']);
});

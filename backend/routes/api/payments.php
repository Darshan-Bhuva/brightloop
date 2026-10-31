<?php

use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

// Customers: own records only (scoped in PaymentService::list).
Route::middleware(['auth:api', 'role:admin,staff,customer'])->group(function (): void {
    Route::get('/payments', [PaymentController::class, 'index']);
});

Route::middleware(['auth:api', 'role:admin,staff'])->group(function (): void {
    Route::post('/payments', [PaymentController::class, 'store']);
});

Route::middleware(['auth:api', 'role:admin'])->group(function (): void {
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->whereNumber('payment');
});

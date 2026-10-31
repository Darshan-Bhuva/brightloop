<?php

use App\Http\Controllers\Api\CustomerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'role:admin,staff'])->group(function (): void {
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->whereNumber('customer');
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])->whereNumber('customer');
});

Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])
    ->middleware(['auth:api', 'role:admin'])
    ->whereNumber('customer');

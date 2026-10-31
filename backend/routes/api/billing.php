<?php

use App\Http\Controllers\Api\BillingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'role:admin,staff'])->group(function () {
    Route::get('/billing/due', [BillingController::class, 'due']);
    Route::post('/billing/run', [BillingController::class, 'run']);
});

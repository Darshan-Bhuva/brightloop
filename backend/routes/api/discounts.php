<?php

use App\Http\Controllers\Api\DiscountController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api'])->group(function () {
    // Read access: admin and staff
    Route::middleware(['role:admin,staff'])->group(function () {
        Route::get('/discounts', [DiscountController::class, 'index']);
        Route::get('/discounts/{discount}', [DiscountController::class, 'show']);
    });

    // Write access: admin only
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/discounts', [DiscountController::class, 'store']);
        Route::put('/discounts/{discount}', [DiscountController::class, 'update']);
        Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy']);
    });
});

<?php

use App\Http\Controllers\Api\PaymentTermController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TaxController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api'])->group(function () {
    // Read access for Admin and Staff
    Route::middleware(['role:admin,staff'])->group(function () {
        Route::get('/taxes', [TaxController::class, 'index']);
        Route::get('/payment-terms', [PaymentTermController::class, 'index']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
    });

    // Write access for Admin only
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/taxes', [TaxController::class, 'store']);
        Route::put('/taxes/{tax}', [TaxController::class, 'update']);
        Route::delete('/taxes/{tax}', [TaxController::class, 'destroy']);

        Route::post('/payment-terms', [PaymentTermController::class, 'store']);
        Route::put('/payment-terms/{payment_term}', [PaymentTermController::class, 'update']);
        Route::delete('/payment-terms/{payment_term}', [PaymentTermController::class, 'destroy']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });
});

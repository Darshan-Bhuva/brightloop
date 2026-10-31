<?php

use App\Http\Controllers\Api\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api'])->group(function () {
    // Read: Admin, Staff, Customer (Customer scoped in controller/policy)
    Route::middleware(['role:admin,staff,customer'])->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    });

    // Actions & updates: Admin and Staff only
    Route::middleware(['role:admin,staff'])->group(function () {
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::post('/invoices/{invoice}/confirm', [InvoiceController::class, 'confirm']);
        Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
        Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
        Route::post('/invoices/bulk-confirm', [InvoiceController::class, 'bulkConfirm']);
    });
});

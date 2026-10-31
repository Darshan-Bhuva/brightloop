<?php

use App\Http\Controllers\Api\PlanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api'])->group(function () {
    // Read access: admin and staff
    Route::middleware(['role:admin,staff'])->group(function () {
        Route::get('/plans', [PlanController::class, 'index']);
        Route::get('/plans/{plan}', [PlanController::class, 'show']);
    });

    // Write access: admin only
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/plans', [PlanController::class, 'store']);
        Route::put('/plans/{plan}', [PlanController::class, 'update']);
        Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);
    });
});

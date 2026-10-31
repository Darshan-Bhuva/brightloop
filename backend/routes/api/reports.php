<?php

use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'role:admin,staff'])->group(function (): void {
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/revenue-trend', [ReportController::class, 'revenueTrend']);
    Route::get('/reports/overdue-aging', [ReportController::class, 'overdueAging']);
});

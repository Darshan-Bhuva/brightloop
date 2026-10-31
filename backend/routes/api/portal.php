<?php

use App\Http\Controllers\Api\PortalController;
use Illuminate\Support\Facades\Route;

// Customer only; figures are scoped to customers.user_id = auth user in ReportService::portalSummary.
Route::middleware(['auth:api', 'role:customer'])->group(function (): void {
    Route::get('/portal/summary', [PortalController::class, 'summary']);
});

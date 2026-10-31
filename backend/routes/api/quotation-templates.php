<?php

use App\Http\Controllers\Api\QuotationTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'role:admin,staff'])->group(function (): void {
    Route::get('/quotation-templates', [QuotationTemplateController::class, 'index']);
    Route::post('/quotation-templates', [QuotationTemplateController::class, 'store']);
    Route::get('/quotation-templates/{quotationTemplate}', [QuotationTemplateController::class, 'show'])->whereNumber('quotationTemplate');
    Route::put('/quotation-templates/{quotationTemplate}', [QuotationTemplateController::class, 'update'])->whereNumber('quotationTemplate');
    Route::delete('/quotation-templates/{quotationTemplate}', [QuotationTemplateController::class, 'destroy'])->whereNumber('quotationTemplate');
});

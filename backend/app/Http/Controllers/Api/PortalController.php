<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceListItemResource;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function summary(Request $request): JsonResponse
    {
        $summary = $this->reportService->portalSummary($request->user());
        $summary['recent_invoices'] = InvoiceListItemResource::collection($summary['recent_invoices'])->resolve($request);

        return ApiResponse::success($summary);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\RevenueTrendRequest;
use App\Http\Requests\Report\SummaryReportRequest;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function summary(SummaryReportRequest $request): JsonResponse
    {
        return ApiResponse::success($this->reportService->summary($request->validated()));
    }

    public function revenueTrend(RevenueTrendRequest $request): JsonResponse
    {
        return ApiResponse::success($this->reportService->revenueTrend($request->validated()));
    }

    public function overdueAging(): JsonResponse
    {
        return ApiResponse::success($this->reportService->overdueAging());
    }
}

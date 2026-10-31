<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\DueListRequest;
use App\Http\Requests\Billing\RunBillingRequest;
use App\Http\Resources\DueSubscriptionResource;
use App\Services\BillingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class BillingController extends Controller
{
    public function __construct(private readonly BillingService $billingService) {}

    public function due(DueListRequest $request): JsonResponse
    {
        $asOfDate = $request->input('as_of_date', now()->toDateString());
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $paginator = $this->billingService->getDueSubscriptions($asOfDate, $perPage);

        return ApiResponse::paginated($paginator, DueSubscriptionResource::class);
    }

    public function run(RunBillingRequest $request): JsonResponse
    {
        $asOfDate = $request->input('as_of_date', now()->toDateString());
        $subscriptionIds = $request->input('subscription_ids');

        $result = $this->billingService->runBilling(
            $asOfDate,
            $subscriptionIds,
            $request->user()?->id,
        );

        return ApiResponse::success($result);
    }
}

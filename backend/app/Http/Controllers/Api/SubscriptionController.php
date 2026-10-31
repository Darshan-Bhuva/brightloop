<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\AttachDiscountRequest;
use App\Http\Requests\Subscription\CloseSubscriptionRequest;
use App\Http\Requests\Subscription\ListSubscriptionsRequest;
use App\Http\Requests\Subscription\RenewSubscriptionRequest;
use App\Http\Requests\Subscription\StoreSubscriptionRequest;
use App\Http\Requests\Subscription\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionListResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptionService) {}

    public function index(ListSubscriptionsRequest $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->subscriptionService->list($request->validated(), $request->user()),
            SubscriptionListResource::class,
        );
    }

    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        return ApiResponse::created(new SubscriptionResource(
            $this->subscriptionService->create($request->validated(), $request->user()),
        ));
    }

    public function show(Subscription $subscription): JsonResponse
    {
        Gate::authorize('view', $subscription);

        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->show($subscription)));
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource(
            $this->subscriptionService->update($subscription, $request->validated()),
        ));
    }

    public function destroy(Subscription $subscription): JsonResponse
    {
        $this->subscriptionService->delete($subscription);

        return ApiResponse::success(null);
    }

    public function sendQuotation(Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->sendQuotation($subscription)));
    }

    public function confirm(Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->confirm($subscription)));
    }

    public function activate(Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->activate($subscription)));
    }

    public function pause(Subscription $subscription): JsonResponse
    {
        Gate::authorize('view', $subscription);

        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->pause($subscription)));
    }

    public function resume(Subscription $subscription): JsonResponse
    {
        Gate::authorize('view', $subscription);

        return ApiResponse::success(new SubscriptionResource($this->subscriptionService->resume($subscription)));
    }

    public function close(CloseSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource(
            $this->subscriptionService->close($subscription, $request->validated('reason')),
        ));
    }

    public function renew(RenewSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource(
            $this->subscriptionService->renew($subscription, $request->validated('new_expiry_date')),
        ));
    }

    public function attachDiscount(AttachDiscountRequest $request, Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource(
            $this->subscriptionService->attachDiscount($subscription, (int) $request->validated('discount_id')),
        ));
    }

    public function detachDiscount(Subscription $subscription, int $discountId): JsonResponse
    {
        return ApiResponse::success(new SubscriptionResource(
            $this->subscriptionService->detachDiscount($subscription, $discountId),
        ));
    }
}

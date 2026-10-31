<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\ListPaymentsRequest;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\InvoiceListItemResource;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService) {}

    public function index(ListPaymentsRequest $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->paymentService->list($request->validated(), $request->user()),
            PaymentResource::class,
        );
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $result = $this->paymentService->record($request->validated(), $request->user());

        return ApiResponse::created([
            'payment' => (new PaymentResource($result['payment']))->resolve($request),
            'invoice' => (new InvoiceListItemResource($result['invoice']))->resolve($request),
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $this->paymentService->delete($payment);

        return ApiResponse::success(null);
    }
}

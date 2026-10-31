<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ListCustomersRequest;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use App\Support\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $customerService) {}

    public function index(ListCustomersRequest $request): JsonResponse
    {
        $customers = $this->customerService->list($request->validated());

        return $customers instanceof LengthAwarePaginator
            ? ApiResponse::paginated($customers, CustomerResource::class)
            : ApiResponse::success(CustomerResource::collection($customers));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        return ApiResponse::created(new CustomerResource($this->customerService->create($request->validated())));
    }

    public function show(Customer $customer): JsonResponse
    {
        return ApiResponse::success(new CustomerResource($this->customerService->withCounts($customer)));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        return ApiResponse::success(new CustomerResource($this->customerService->update($customer, $request->validated())));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->customerService->delete($customer);

        return ApiResponse::success(null);
    }
}

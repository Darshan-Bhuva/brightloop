<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StorePaymentTermRequest;
use App\Http\Requests\Catalog\UpdatePaymentTermRequest;
use App\Http\Resources\PaymentTermResource;
use App\Models\PaymentTerm;
use App\Services\PaymentTermService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentTermController extends Controller
{
    public function __construct(private readonly PaymentTermService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = PaymentTerm::query();

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('name', $operator, "%{$search}%");
        }

        $sort = $request->input('sort');
        $allowedSorts = ['name', 'due_days', 'created_at', 'id'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'due_days';
        }

        $direction = strtolower((string) $request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction)->orderBy('id', 'asc');

        if ($request->boolean('all') || $request->input('all') === '1') {
            $terms = $query->limit(500)->get();

            return ApiResponse::success(PaymentTermResource::collection($terms));
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, PaymentTermResource::class);
    }

    public function store(StorePaymentTermRequest $request): JsonResponse
    {
        $term = $this->service->create($request->validated());

        return ApiResponse::created(new PaymentTermResource($term));
    }

    public function update(UpdatePaymentTermRequest $request, PaymentTerm $paymentTerm): JsonResponse
    {
        $term = $this->service->update($paymentTerm, $request->validated());

        return ApiResponse::success(new PaymentTermResource($term));
    }

    public function destroy(PaymentTerm $paymentTerm): JsonResponse
    {
        $this->service->delete($paymentTerm);

        return ApiResponse::success(null);
    }
}

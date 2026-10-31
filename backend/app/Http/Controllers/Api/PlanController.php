<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StorePlanRequest;
use App\Http\Requests\Catalog\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use App\Services\PlanService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    public function __construct(private readonly PlanService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = Plan::query()->with('tax');

        if ($request->filled('billing_period')) {
            $query->where('billing_period', $request->input('billing_period'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== null && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('available') && filter_var($request->input('available'), FILTER_VALIDATE_BOOLEAN)) {
            $today = now()->toDateString();
            $query->where('is_active', true)
                ->where('start_date', '<=', $today)
                ->where(function (Builder $q) use ($today) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                });
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('name', $operator, "%{$search}%");
        }

        $sort = $request->input('sort');
        $allowedSorts = ['name', 'price', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $direction = strtolower((string) $request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction)->orderBy('id', 'asc');

        if ($request->boolean('all') || $request->input('all') === '1') {
            $plans = $query->limit(500)->get();

            return ApiResponse::success(PlanResource::collection($plans));
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, PlanResource::class);
    }

    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = $this->service->create($request->validated());

        return ApiResponse::created(new PlanResource($plan));
    }

    public function show(Plan $plan): JsonResponse
    {
        $plan->loadMissing('tax');

        return ApiResponse::success(new PlanResource($plan));
    }

    public function update(UpdatePlanRequest $request, Plan $plan): JsonResponse
    {
        $plan = $this->service->update($plan, $request->validated());

        return ApiResponse::success(new PlanResource($plan));
    }

    public function destroy(Plan $plan): JsonResponse
    {
        $this->service->delete($plan);

        return ApiResponse::success(null);
    }
}

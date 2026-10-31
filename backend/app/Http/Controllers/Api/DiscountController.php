<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreDiscountRequest;
use App\Http\Requests\Catalog\UpdateDiscountRequest;
use App\Http\Resources\DiscountResource;
use App\Models\Discount;
use App\Services\DiscountService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscountController extends Controller
{
    public function __construct(private readonly DiscountService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = Discount::query()->with('products');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('applies_to')) {
            $query->where('applies_to', $request->input('applies_to'));
        }

        if ($request->filled('state')) {
            $this->service->applyStateFilter($query, (string) $request->input('state'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function (Builder $q) use ($search, $operator) {
                $q->where('name', $operator, "%{$search}%")
                    ->orWhere('code', $operator, "%{$search}%");
            });
        }

        $sort = $request->input('sort');
        $allowedSorts = ['name', 'value', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $direction = strtolower((string) $request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction)->orderBy('id', 'asc');

        if ($request->boolean('all') || $request->input('all') === '1') {
            $discounts = $query->limit(500)->get();

            return ApiResponse::success(DiscountResource::collection($discounts));
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, DiscountResource::class);
    }

    public function store(StoreDiscountRequest $request): JsonResponse
    {
        $discount = $this->service->create($request->validated());

        return ApiResponse::created(new DiscountResource($discount));
    }

    public function show(Discount $discount): JsonResponse
    {
        $discount->loadMissing('products');

        return ApiResponse::success(new DiscountResource($discount));
    }

    public function update(UpdateDiscountRequest $request, Discount $discount): JsonResponse
    {
        $discount = $this->service->update($discount, $request->validated());

        return ApiResponse::success(new DiscountResource($discount));
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $this->service->delete($discount);

        return ApiResponse::success(null);
    }
}

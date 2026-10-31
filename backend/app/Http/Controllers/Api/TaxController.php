<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreTaxRequest;
use App\Http\Requests\Catalog\UpdateTaxRequest;
use App\Http\Resources\TaxResource;
use App\Models\Tax;
use App\Services\TaxService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaxController extends Controller
{
    public function __construct(private readonly TaxService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = Tax::query();

        if ($request->has('is_active') && $request->input('is_active') !== null && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('name', $operator, "%{$search}%");
        }

        $sort = $request->input('sort');
        $allowedSorts = ['name', 'rate', 'created_at', 'id'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $direction = strtolower((string) $request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction)->orderBy('id', 'asc');

        if ($request->boolean('all') || $request->input('all') === '1') {
            $taxes = $query->limit(500)->get();

            return ApiResponse::success(TaxResource::collection($taxes));
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, TaxResource::class);
    }

    public function store(StoreTaxRequest $request): JsonResponse
    {
        $tax = $this->service->create($request->validated());

        return ApiResponse::created(new TaxResource($tax));
    }

    public function update(UpdateTaxRequest $request, Tax $tax): JsonResponse
    {
        $tax = $this->service->update($tax, $request->validated());

        return ApiResponse::success(new TaxResource($tax));
    }

    public function destroy(Tax $tax): JsonResponse
    {
        $this->service->delete($tax);

        return ApiResponse::success(null);
    }
}

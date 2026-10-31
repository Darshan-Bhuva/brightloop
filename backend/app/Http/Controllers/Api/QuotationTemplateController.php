<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuotationTemplate\ListQuotationTemplatesRequest;
use App\Http\Requests\QuotationTemplate\StoreQuotationTemplateRequest;
use App\Http\Requests\QuotationTemplate\UpdateQuotationTemplateRequest;
use App\Http\Resources\QuotationTemplateResource;
use App\Models\QuotationTemplate;
use App\Services\QuotationTemplateService;
use App\Support\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class QuotationTemplateController extends Controller
{
    public function __construct(private readonly QuotationTemplateService $templateService) {}

    public function index(ListQuotationTemplatesRequest $request): JsonResponse
    {
        $templates = $this->templateService->list($request->validated());

        return $templates instanceof LengthAwarePaginator
            ? ApiResponse::paginated($templates, QuotationTemplateResource::class)
            : ApiResponse::success(QuotationTemplateResource::collection($templates));
    }

    public function store(StoreQuotationTemplateRequest $request): JsonResponse
    {
        return ApiResponse::created(new QuotationTemplateResource(
            $this->templateService->create($request->validated(), $request->user()),
        ));
    }

    public function show(QuotationTemplate $quotationTemplate): JsonResponse
    {
        return ApiResponse::success(new QuotationTemplateResource($quotationTemplate->load(QuotationTemplateService::relations())));
    }

    public function update(UpdateQuotationTemplateRequest $request, QuotationTemplate $quotationTemplate): JsonResponse
    {
        return ApiResponse::success(new QuotationTemplateResource(
            $this->templateService->update($quotationTemplate, $request->validated()),
        ));
    }

    public function destroy(QuotationTemplate $quotationTemplate): JsonResponse
    {
        $this->templateService->delete($quotationTemplate);

        return ApiResponse::success(null);
    }
}

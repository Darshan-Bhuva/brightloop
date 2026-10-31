<?php

namespace App\Http\Controllers\Api;

use App\Enums\InvoiceStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\BulkConfirmInvoiceRequest;
use App\Http\Requests\Billing\CancelInvoiceRequest;
use App\Http\Requests\Billing\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceListItemResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Invoice::query()->with(['customer', 'subscription']);

        // Customer scoping: own records only, never sees draft
        if ($user?->role === Role::Customer) {
            $query->whereHas('customer', function (Builder $q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', '!=', InvoiceStatus::Draft->value);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id') && $user?->role !== Role::Customer) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        if ($request->filled('subscription_id')) {
            $query->where('subscription_id', $request->input('subscription_id'));
        }

        if ($request->has('overdue') && filter_var($request->input('overdue'), FILTER_VALIDATE_BOOLEAN)) {
            $today = now()->toDateString();
            $query->where('status', InvoiceStatus::Confirmed->value)
                ->where('due_date', '<', $today)
                ->where('amount_due', '>', 0);
        }

        if ($request->filled('invoice_from')) {
            $query->where('invoice_date', '>=', $request->input('invoice_from'));
        }

        if ($request->filled('invoice_to')) {
            $query->where('invoice_date', '<=', $request->input('invoice_to'));
        }

        if ($request->filled('due_from')) {
            $query->where('due_date', '>=', $request->input('due_from'));
        }

        if ($request->filled('due_to')) {
            $query->where('due_date', '<=', $request->input('due_to'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function (Builder $q) use ($search, $operator) {
                $q->where('number', $operator, "%{$search}%")
                    ->orWhereHas('customer', function (Builder $custQ) use ($search, $operator) {
                        $custQ->where('name', $operator, "%{$search}%");
                    });
            });
        }

        // Sorting
        $sort = $request->input('sort');
        $allowedSorts = ['number', 'invoice_date', 'due_date', 'total', 'amount_due'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'invoice_date';
        }

        $direction = strtolower((string) $request->input('direction')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction)->orderBy('id', 'desc');

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, InvoiceListItemResource::class);
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $user = $request->user();

        // Customer scoping
        if ($user?->role === Role::Customer) {
            if ($invoice->customer?->user_id !== $user->id || $invoice->status === InvoiceStatus::Draft) {
                abort(404, 'Resource not found.');
            }
        }

        $invoice->loadMissing([
            'customer',
            'subscription',
            'paymentTerm',
            'lines.discount',
            'payments.recordedBy',
            'payments.customer',
            'payments.invoice',
        ]);

        return ApiResponse::success(new InvoiceResource($invoice));
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $updated = $this->invoiceService->updateDraft($invoice, $request->validated());

        return ApiResponse::success(new InvoiceResource($updated));
    }

    public function confirm(Invoice $invoice): JsonResponse
    {
        $confirmed = $this->invoiceService->confirm($invoice);

        return ApiResponse::success(new InvoiceResource($confirmed));
    }

    public function cancel(CancelInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $cancelled = $this->invoiceService->cancel($invoice, $request->input('reason'));

        return ApiResponse::success(new InvoiceResource($cancelled));
    }

    public function send(Invoice $invoice): JsonResponse
    {
        $sent = $this->invoiceService->send($invoice);

        return ApiResponse::success(new InvoiceResource($sent));
    }

    public function bulkConfirm(BulkConfirmInvoiceRequest $request): JsonResponse
    {
        $result = $this->invoiceService->bulkConfirm($request->validated()['ids']);

        return ApiResponse::success($result);
    }
}

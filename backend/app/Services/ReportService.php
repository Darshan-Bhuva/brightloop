<?php

namespace App\Services;

use App\Enums\BillingPeriod;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * BR-10 / BR-12: every number is computed with aggregate SQL; no models are loaded,
 * except the 5 recent invoices of the portal summary. Money is rounded in SQL and
 * returned as the 2-decimal string PostgreSQL produces.
 */
class ReportService
{
    private const CACHE_SECONDS = 60;

    /**
     * date_trunc unit, generate_series step and period label per RPT-02 interval.
     */
    private const INTERVALS = [
        'day' => ['unit' => 'day', 'step' => '1 day', 'format' => 'YYYY-MM-DD'],
        'week' => ['unit' => 'week', 'step' => '1 week', 'format' => 'YYYY-MM-DD'],
        'month' => ['unit' => 'month', 'step' => '1 month', 'format' => 'YYYY-MM'],
    ];

    /**
     * RPT-01.
     *
     * @param  array{date_from: string, date_to: string}  $params
     * @return array<string, mixed>
     */
    public function summary(array $params): array
    {
        $from = Carbon::parse($params['date_from'])->toDateString();
        $to = Carbon::parse($params['date_to'])->toDateString();
        $today = now()->toDateString();

        return Cache::remember("reports:summary:{$from}:{$to}:{$today}", self::CACHE_SECONDS, fn () => [
            'period' => ['date_from' => $from, 'date_to' => $to],
            ...$this->subscriptionFigures($from, $to),
            ...$this->invoiceFigures($from, $to, $today),
        ]);
    }

    /**
     * RPT-02: one row per day/week/month bucket from date_from to date_to (no gaps).
     *
     * @param  array{date_from: string, date_to: string, interval?: string}  $params
     * @return array<int, array{period: string, invoiced: string, collected: string}>
     */
    public function revenueTrend(array $params): array
    {
        $from = Carbon::parse($params['date_from'])->toDateString();
        $to = Carbon::parse($params['date_to'])->toDateString();
        $interval = $params['interval'] ?? 'month';
        $config = self::INTERVALS[$interval];

        return Cache::remember("reports:revenue-trend:{$from}:{$to}:{$interval}", self::CACHE_SECONDS, function () use ($from, $to, $config) {
            $rows = DB::select(
                <<<'SQL'
                SELECT to_char(b.bucket, ?) AS period,
                       ROUND(COALESCE(i.invoiced, 0), 2) AS invoiced,
                       ROUND(COALESCE(p.collected, 0), 2) AS collected
                FROM generate_series(date_trunc(?, ?::date::timestamp), date_trunc(?, ?::date::timestamp), ?::interval) AS b(bucket)
                LEFT JOIN (
                    SELECT date_trunc(?, invoice_date::timestamp) AS bucket, SUM(total) AS invoiced
                    FROM invoices
                    WHERE status IN (?, ?) AND invoice_date BETWEEN ? AND ?
                    GROUP BY 1
                ) i ON i.bucket = b.bucket
                LEFT JOIN (
                    SELECT date_trunc(?, payment_date::timestamp) AS bucket, SUM(amount) AS collected
                    FROM payments
                    WHERE payment_date BETWEEN ? AND ?
                    GROUP BY 1
                ) p ON p.bucket = b.bucket
                ORDER BY b.bucket
                SQL,
                [
                    $config['format'],
                    $config['unit'], $from, $config['unit'], $to, $config['step'],
                    $config['unit'], InvoiceStatus::Confirmed->value, InvoiceStatus::Paid->value, $from, $to,
                    $config['unit'], $from, $to,
                ],
            );

            return array_map(fn (object $row) => [
                'period' => $row->period,
                'invoiced' => (string) $row->invoiced,
                'collected' => (string) $row->collected,
            ], $rows);
        });
    }

    /**
     * RPT-03: open overdue invoices (BR-9) grouped by days past due.
     *
     * @return array{total_overdue: string, buckets: array<int, array{label: string, count: int, amount: string}>}
     */
    public function overdueAging(): array
    {
        $today = now()->toDateString();

        return Cache::remember("reports:overdue-aging:{$today}", self::CACHE_SECONDS, function () use ($today) {
            $row = DB::selectOne(
                <<<'SQL'
                SELECT ROUND(COALESCE(SUM(amount_due), 0), 2) AS total_overdue,
                       COUNT(*) FILTER (WHERE days <= 30) AS c1,
                       ROUND(COALESCE(SUM(amount_due) FILTER (WHERE days <= 30), 0), 2) AS a1,
                       COUNT(*) FILTER (WHERE days BETWEEN 31 AND 60) AS c2,
                       ROUND(COALESCE(SUM(amount_due) FILTER (WHERE days BETWEEN 31 AND 60), 0), 2) AS a2,
                       COUNT(*) FILTER (WHERE days BETWEEN 61 AND 90) AS c3,
                       ROUND(COALESCE(SUM(amount_due) FILTER (WHERE days BETWEEN 61 AND 90), 0), 2) AS a3,
                       COUNT(*) FILTER (WHERE days > 90) AS c4,
                       ROUND(COALESCE(SUM(amount_due) FILTER (WHERE days > 90), 0), 2) AS a4
                FROM (
                    SELECT (?::date - due_date) AS days, amount_due
                    FROM invoices
                    WHERE status = ? AND due_date < ? AND amount_due > 0
                ) overdue
                SQL,
                [$today, InvoiceStatus::Confirmed->value, $today],
            );

            $buckets = [];
            foreach (['1-30', '31-60', '61-90', '90+'] as $index => $label) {
                $n = $index + 1;
                $buckets[] = [
                    'label' => $label,
                    'count' => (int) $row->{"c{$n}"},
                    'amount' => (string) $row->{"a{$n}"},
                ];
            }

            return ['total_overdue' => (string) $row->total_overdue, 'buckets' => $buckets];
        });
    }

    /**
     * PORTAL-01: figures for the logged-in customer only (customers.user_id = auth user).
     *
     * @return array{active_subscriptions: int, next_billing_date: string|null, outstanding_amount: string,
     *               overdue_count: int, recent_invoices: Collection<int, Invoice>}
     */
    public function portalSummary(User $user): array
    {
        $customerId = Customer::where('user_id', $user->id)->value('id');
        $today = now()->toDateString();

        $subscriptions = DB::table('subscriptions')
            ->where('customer_id', $customerId)
            ->whereNull('deleted_at')
            ->where('status', SubscriptionStatus::Active->value)
            ->selectRaw('COUNT(*) AS active_subscriptions')
            ->selectRaw('MIN(next_invoice_date) FILTER (WHERE is_paused = false) AS next_billing_date')
            ->first();

        $invoices = DB::table('invoices')
            ->where('customer_id', $customerId)
            ->where('status', InvoiceStatus::Confirmed->value)
            ->selectRaw('ROUND(COALESCE(SUM(amount_due), 0), 2) AS outstanding_amount')
            ->selectRaw('COUNT(*) FILTER (WHERE due_date < ? AND amount_due > 0) AS overdue_count', [$today])
            ->first();

        $recent = Invoice::query()
            ->with([
                'customer' => fn ($query) => $query->withTrashed()->select(['id', 'name']),
                'subscription' => fn ($query) => $query->withTrashed()->select(['id', 'number']),
            ])
            ->where('customer_id', $customerId)
            ->where('status', '!=', InvoiceStatus::Draft->value)
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return [
            'active_subscriptions' => (int) $subscriptions->active_subscriptions,
            'next_billing_date' => $subscriptions->next_billing_date,
            'outstanding_amount' => (string) $invoices->outstanding_amount,
            'overdue_count' => (int) $invoices->overdue_count,
            'recent_invoices' => $recent,
        ];
    }

    /**
     * @return array{subscriptions: array<string, mixed>, mrr: string}
     */
    private function subscriptionFigures(string $from, string $to): array
    {
        $statuses = SubscriptionStatus::cases();
        $active = SubscriptionStatus::Active->value;
        $periodEnd = Carbon::parse($to)->addDay()->toDateString();

        $query = DB::table('subscriptions as s')
            ->join('plans as p', 'p.id', '=', 's.plan_id')
            ->whereNull('s.deleted_at')
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw('COUNT(*) FILTER (WHERE s.status = ? AND s.is_paused = true) AS paused', [$active])
            ->selectRaw('COUNT(*) FILTER (WHERE s.created_at >= ? AND s.created_at < ?) AS new_in_period', [$from, $periodEnd])
            ->selectRaw('COUNT(*) FILTER (WHERE s.closed_at >= ? AND s.closed_at < ?) AS closed_in_period', [$from, $periodEnd])
            ->selectRaw(
                'ROUND(COALESCE(SUM(CASE p.billing_period WHEN ? THEN s.total * 30 WHEN ? THEN s.total * 4.345 '
                .'WHEN ? THEN s.total WHEN ? THEN s.total / 12 END) FILTER (WHERE s.status = ? AND s.is_paused = false), 0), 2) AS mrr',
                [BillingPeriod::Daily->value, BillingPeriod::Weekly->value, BillingPeriod::Monthly->value, BillingPeriod::Yearly->value, $active],
            );

        foreach ($statuses as $status) {
            $query->selectRaw("COUNT(*) FILTER (WHERE s.status = ?) AS status_{$status->value}", [$status->value]);
        }

        $row = $query->first();

        $byStatus = [];
        foreach ($statuses as $status) {
            $byStatus[$status->value] = (int) $row->{"status_{$status->value}"};
        }

        return [
            'subscriptions' => [
                'total' => (int) $row->total,
                'active' => $byStatus[$active],
                'paused' => (int) $row->paused,
                'by_status' => $byStatus,
                'new_in_period' => (int) $row->new_in_period,
                'closed_in_period' => (int) $row->closed_in_period,
            ],
            'mrr' => (string) $row->mrr,
        ];
    }

    /**
     * @return array{revenue: array<string, string>, receivables: array<string, mixed>, invoices_by_status: array<string, int>}
     */
    private function invoiceFigures(string $from, string $to, string $today): array
    {
        $statuses = InvoiceStatus::cases();
        $confirmed = InvoiceStatus::Confirmed->value;

        $query = DB::table('invoices')
            ->selectRaw(
                'ROUND(COALESCE(SUM(total) FILTER (WHERE status IN (?, ?) AND invoice_date BETWEEN ? AND ?), 0), 2) AS invoiced',
                [$confirmed, InvoiceStatus::Paid->value, $from, $to],
            )
            ->selectRaw('ROUND(COALESCE(SUM(amount_due) FILTER (WHERE status = ?), 0), 2) AS outstanding_amount', [$confirmed])
            ->selectRaw('COUNT(*) FILTER (WHERE status = ?) AS outstanding_count', [$confirmed])
            ->selectRaw(
                'ROUND(COALESCE(SUM(amount_due) FILTER (WHERE status = ? AND due_date < ? AND amount_due > 0), 0), 2) AS overdue_amount',
                [$confirmed, $today],
            )
            ->selectRaw('COUNT(*) FILTER (WHERE status = ? AND due_date < ? AND amount_due > 0) AS overdue_count', [$confirmed, $today]);

        foreach ($statuses as $status) {
            $query->selectRaw("COUNT(*) FILTER (WHERE status = ?) AS status_{$status->value}", [$status->value]);
        }

        $row = $query->first();

        $collected = DB::table('payments')
            ->whereBetween('payment_date', [$from, $to])
            ->selectRaw('ROUND(COALESCE(SUM(amount), 0), 2) AS collected')
            ->value('collected');

        $byStatus = [];
        foreach ($statuses as $status) {
            $byStatus[$status->value] = (int) $row->{"status_{$status->value}"};
        }

        return [
            'revenue' => [
                'invoiced_in_period' => (string) $row->invoiced,
                'collected_in_period' => (string) $collected,
            ],
            'receivables' => [
                'outstanding_amount' => (string) $row->outstanding_amount,
                'outstanding_count' => (int) $row->outstanding_count,
                'overdue_amount' => (string) $row->overdue_amount,
                'overdue_count' => (int) $row->overdue_count,
            ],
            'invoices_by_status' => $byStatus,
        ];
    }
}

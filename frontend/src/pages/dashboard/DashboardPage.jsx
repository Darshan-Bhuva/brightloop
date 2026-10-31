import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Repeat,
  DollarSign,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { getReportsSummary, getRevenueTrend, getOverdueAging } from '@/api/reports'
import { getInvoices } from '@/api/invoices'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate } from '@/lib/format'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

const DATE_PRESETS = [
  { label: 'This Month', key: 'this_month' },
  { label: 'Last Month', key: 'last_month' },
  { label: 'This Year', key: 'this_year' },
  { label: 'Custom', key: 'custom' },
]

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Calculate default dates
  const today = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return d.toISOString().split('T')[0]
  }, [today])
  const defaultTo = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return d.toISOString().split('T')[0]
  }, [today])

  // Initial values from query params or defaults
  const [selectedPreset, setSelectedPreset] = useState('this_month')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || defaultFrom)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || defaultTo)

  // Report States
  const [summary, setSummary] = useState(null)
  const [revenueTrend, setRevenueTrend] = useState([])
  const [agingData, setAgingData] = useState(null)
  const [overdueInvoices, setOverdueInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Apply preset calculation
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey)
    const now = new Date()
    let from = ''
    let to = ''

    if (presetKey === 'this_month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    } else if (presetKey === 'last_month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    } else if (presetKey === 'this_year') {
      from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      to = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
    } else {
      return
    }

    setDateFrom(from)
    setDateTo(to)
    setSearchParams({ date_from: from, date_to: to })
  }

  // Load All Dashboard Data
  const loadDashboardData = useCallback(async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      handleApiError({ response: { status: 422, data: { message: 'Start date cannot be after end date.' } } })
      return
    }

    setIsLoading(true)
    try {
      const [sumRes, trendRes, agingRes, overdueRes] = await Promise.all([
        getReportsSummary({ date_from: dateFrom, date_to: dateTo }),
        getRevenueTrend({ date_from: dateFrom, date_to: dateTo, interval: 'month' }),
        getOverdueAging(),
        getInvoices({ overdue: true, sort: 'due_date', direction: 'asc', per_page: 10 }),
      ])

      setSummary(sumRes.data)
      setRevenueTrend(trendRes.data || [])
      setAgingData(agingRes.data)
      setOverdueInvoices(overdueRes.data || [])
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Recharts custom numeric format helper
  const currencyFormatter = (val) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`
    return `₹${val}`
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header & Date Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Executive overview of recurring subscriptions, MRR velocity, revenue collection, and receivables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Buttons */}
          <div className="flex items-center rounded-sm border border-border bg-white p-0.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-1 text-xs font-mono transition-colors rounded-sm ${
                  selectedPreset === p.key
                    ? 'bg-black text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {selectedPreset === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-sm border border-border">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setSearchParams({ date_from: e.target.value, date_to: dateTo })
                }}
                className="h-7 text-xs border-zinc-200 font-mono w-32"
              />
              <span className="text-xs text-zinc-400">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setSearchParams({ date_from: dateFrom, date_to: e.target.value })
                }}
                className="h-7 text-xs border-zinc-200 font-mono w-32"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="rounded-sm border-border text-black hover:bg-zinc-50 h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (5 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Active Subscriptions */}
        <Link to="/subscriptions?status=active" className="block group">
          <Card className="rounded-md border border-border bg-white shadow-none hover:border-black transition-colors h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Active Subs
                </span>
                <Repeat className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-mono font-bold text-black">
                  {summary ? summary.subscriptions.active.toLocaleString() : '-'}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
                  <span>Total: {summary?.subscriptions.total}</span>
                  {summary?.subscriptions.paused > 0 && (
                    <span className="text-amber-700 font-medium">
                      {summary.subscriptions.paused} paused
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 2: MRR */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                Monthly Run Rate
              </span>
              <DollarSign className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-bold text-black">
                {summary ? formatMoney(summary.mrr) : '-'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Normalized active MRR</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Collected in Period */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                Collected (Period)
              </span>
              <FileCheck className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-bold text-black">
                {summary ? formatMoney(summary.revenue.collected_in_period) : '-'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Invoiced: {summary ? formatMoney(summary.revenue.invoiced_in_period) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Outstanding Receivables */}
        <Link to="/invoices?status=confirmed" className="block group">
          <Card className="rounded-md border border-border bg-white shadow-none hover:border-black transition-colors h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Outstanding
                </span>
                <TrendingUp className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-mono font-bold text-black">
                  {summary ? formatMoney(summary.receivables.outstanding_amount) : '-'}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {summary?.receivables.outstanding_count} open invoices
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 5: Overdue Receivables (Alert Color) */}
        <Link to="/invoices?overdue=true" className="block group">
          <Card className="rounded-md border border-rose-300 bg-rose-50/40 shadow-none hover:border-primary transition-colors h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-primary">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  Overdue Total
                </span>
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-mono font-bold text-primary">
                  {summary ? formatMoney(summary.receivables.overdue_amount) : '-'}
                </div>
                <p className="text-[11px] text-primary/80 font-medium mt-1">
                  {summary?.receivables.overdue_count} overdue invoices
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart (2 columns wide) */}
        <Card className="rounded-md border border-border bg-white shadow-none lg:col-span-2">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
                Revenue Invoiced vs Collected
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500 mt-0.5">
                Monthly cash realization trend across contract cycles (RPT-02).
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-50">
              Monthly Trend
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={currencyFormatter}
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [formatMoney(val), '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingBottom: '12px' }}
                  />
                  <Bar dataKey="invoiced" name="Invoiced" fill="#18181B" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#F81927" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Aging Chart (P1) */}
        <Card className="rounded-md border border-border bg-white shadow-none lg:col-span-1">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
              Receivables Aging Buckets
            </CardTitle>
            <CardDescription className="text-[11px] text-zinc-500 mt-0.5">
              Outstanding overdue amounts grouped by overdue days (RPT-03).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agingData?.buckets || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tickFormatter={currencyFormatter}
                    tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#000000', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [formatMoney(val), 'Amount Overdue']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#F81927" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown & Top Overdue Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriptions Status Breakdown */}
        <Card className="rounded-md border border-border bg-white shadow-none lg:col-span-1">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
              Contracts by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {summary?.subscriptions.by_status && (
              <div className="space-y-2.5">
                {Object.entries(summary.subscriptions.by_status).map(([st, count]) => {
                  const pct = Math.round((count / (summary.subscriptions.total || 1)) * 100)
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="uppercase text-zinc-700 font-semibold">{st}</span>
                        <span className="text-zinc-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            st === 'active'
                              ? 'bg-black'
                              : st === 'closed'
                              ? 'bg-zinc-400'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-zinc-500">
              <span>New in period: +{summary?.subscriptions.new_in_period}</span>
              <span>Closed in period: {summary?.subscriptions.closed_in_period}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Overdue Invoices Table (2 columns wide) */}
        <Card className="rounded-md border border-border bg-white shadow-none lg:col-span-2">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                <span>Top Overdue Invoices</span>
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500 mt-0.5">
                Urgent receivables requiring payment collection follow-up.
              </CardDescription>
            </div>
            <Link
              to="/invoices?overdue=true"
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <span>View all overdue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Customer</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Due Date</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Aging</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Amount Due</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-400 text-xs italic">
                      No overdue invoices currently recorded. All accounts in good standing.
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueInvoices.slice(0, 5).map((inv) => (
                    <TableRow key={inv.id} className="border-b border-border hover:bg-zinc-50/50">
                      <TableCell className="font-mono text-xs font-semibold text-black">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-black">
                        {inv.customer?.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-zinc-600">
                        {formatDate(inv.due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-rose-100 text-primary border border-rose-200 text-[10px] font-mono">
                          {inv.days_overdue}d overdue
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-primary text-right">
                        {formatMoney(inv.amount_due)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-600 hover:text-black">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Clock,
  Coins,
  ShieldAlert,
} from 'lucide-react'

import { getDueSubscriptions, runBilling } from '@/api/billing'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

export default function BillingPage() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [asOfDate, setAsOfDate] = useState(todayStr)
  const [dueList, setDueList] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Selected subscription IDs for selective billing
  const [selectedIds, setSelectedIds] = useState([])

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Last run result state
  const [runResult, setRunResult] = useState(null)

  // Fetch due subscriptions
  const fetchDueSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getDueSubscriptions({
        as_of_date: asOfDate,
        page,
        per_page: perPage,
      })
      setDueList(res.data || [])
      setMeta(res.meta || null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch due subscriptions'))
    } finally {
      setIsLoading(false)
    }
  }, [asOfDate, page, perPage])

  useEffect(() => {
    fetchDueSubscriptions()
  }, [fetchDueSubscriptions])

  // Handle Select All / Deselect All
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(dueList.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Execute Billing Run
  const handleRunBilling = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        as_of_date: asOfDate,
      }
      if (selectedIds.length > 0) {
        payload.subscription_ids = selectedIds
      }

      const res = await runBilling(payload)
      const data = res.data || {}
      setRunResult(data)
      setSelectedIds([])
      toast.success(
        `Billing run complete: ${data.invoices_created} draft invoice(s) created.`
      )
      // Refetch due list
      await fetchDueSubscriptions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Billing run failed'))
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }

  // Calculate estimated total due
  const totalEstimatedAmount = useMemo(() => {
    return dueList.reduce((acc, curr) => acc + Number(curr.estimated_total || 0), 0)
  }, [dueList])

  // Table columns definition
  const columns = [
    {
      key: 'select',
      title: (
        <Checkbox
          checked={dueList.length > 0 && selectedIds.length === dueList.length}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      sortable: false,
      render: (_, row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={() => handleToggleSelect(row.id)}
          aria-label={`Select ${row.number}`}
        />
      ),
    },
    {
      key: 'number',
      title: 'Subscription',
      sortable: false,
      render: (val, row) => (
        <Link
          to={`/subscriptions/${row.id}`}
          className="font-mono text-sm font-semibold text-primary hover:underline"
        >
          {val}
        </Link>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      sortable: false,
      render: (val) => <span className="font-medium text-foreground">{val?.name || '-'}</span>,
    },
    {
      key: 'plan',
      title: 'Plan & Cycle',
      sortable: false,
      render: (val) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{val?.name}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {val?.billing_period}
          </span>
        </div>
      ),
    },
    {
      key: 'next_invoice_date',
      title: 'Due Date',
      sortable: false,
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <DateText date={val} />
        </div>
      ),
    },
    {
      key: 'periods_due',
      title: 'Periods Due',
      sortable: false,
      render: (val) => (
        <Badge variant={val > 1 ? 'destructive' : 'secondary'} className="font-mono">
          {val} {val === 1 ? 'period' : 'periods'}
        </Badge>
      ),
    },
    {
      key: 'estimated_total',
      title: 'Estimated Total',
      sortable: false,
      className: 'text-right',
      render: (val) => <MoneyText amount={val} className="font-semibold text-right" />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Engine"
        subtitle="Process recurring subscription cycles, generate draft invoices, and catch up missed periods (BR-5)."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Billing Date:</span>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  setAsOfDate(e.target.value)
                  setPage(1)
                }}
                className="w-40 font-mono text-sm h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDueSubscriptions}
              disabled={isLoading}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={dueList.length === 0 || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Billing {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All Due'}
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions Due</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {meta?.total ?? dueList.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active subscriptions with next invoice date on or before{' '}
              <span className="font-mono font-medium">{formatDate(asOfDate)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Billing Total</CardTitle>
            <Coins className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              <MoneyText amount={totalEstimatedAmount} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-discount projected gross revenue for this billing batch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Engine Rule</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">Idempotent Execution (BR-5)</div>
            <p className="text-xs text-muted-foreground mt-1">
              Creates DRAFT invoices, copies product lines, snapshots taxes, and evaluates eligible discounts.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Panel */}
      {runResult && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">
                  Billing Execution Report — As of {formatDate(runResult.as_of_date)}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRunResult(null)}
                className="text-xs h-7"
              >
                Dismiss
              </Button>
            </div>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Billing batch processed safely inside atomic transactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="rounded-md bg-background/80 p-3 border">
                <div className="text-xs text-muted-foreground">Processed</div>
                <div className="text-xl font-bold font-mono">{runResult.processed}</div>
              </div>
              <div className="rounded-md bg-emerald-100/80 dark:bg-emerald-900/40 p-3 border border-emerald-300 dark:border-emerald-800">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Invoices Created
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {runResult.invoices_created}
                </div>
              </div>
              <div className="rounded-md bg-background/80 p-3 border">
                <div className="text-xs text-muted-foreground">Skipped (Billed)</div>
                <div className="text-xl font-bold font-mono">{runResult.skipped}</div>
              </div>
              <div className="rounded-md bg-background/80 p-3 border">
                <div className="text-xs text-muted-foreground">Auto-Closed</div>
                <div className="text-xl font-bold font-mono">{runResult.auto_closed}</div>
              </div>
              <div className="rounded-md bg-background/80 p-3 border">
                <div className="text-xs text-muted-foreground">Failures</div>
                <div
                  className={`text-xl font-bold font-mono ${
                    runResult.failed > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  {runResult.failed}
                </div>
              </div>
            </div>

            {runResult.failures?.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Subscription Billing Warnings:
                </div>
                {runResult.failures.map((f, i) => (
                  <div key={i} className="text-xs font-mono text-destructive/90">
                    {f.number}: {f.message}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button asChild size="sm" className="gap-2">
                <Link to="/invoices?status=draft">
                  View new draft invoices
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Subscriptions Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Subscriptions Due for Billing</CardTitle>
              <CardDescription>
                Select individual subscriptions or click &quot;Run Billing All Due&quot; to execute the run.
              </CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <div className="text-xs font-medium text-muted-foreground">
                {selectedIds.length} subscription(s) selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={dueList}
            columns={columns}
            loading={isLoading}
            pagination={meta}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage)
              setPage(1)
            }}
            emptyState={
              <EmptyState
                icon={CheckCircle2}
                title="All subscriptions up to date"
                description={`No active subscriptions are due for billing on or before ${formatDate(
                  asOfDate
                )}.`}
              />
            }
          />
        </CardContent>
      </Card>

      {/* Confirm Run Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Execute Recurring Billing Run"
        description={
          selectedIds.length > 0
            ? `Run billing for ${selectedIds.length} selected subscription(s) as of ${formatDate(
                asOfDate
              )}? This will create draft invoices and update subscription billing dates.`
            : `Run recurring billing for all ${
                meta?.total ?? dueList.length
              } due subscription(s) as of ${formatDate(
                asOfDate
              )}? This will create draft invoices and advance billing periods.`
        }
        confirmText={isSubmitting ? 'Processing...' : 'Run Billing'}
        variant="default"
        onConfirm={handleRunBilling}
      />
    </div>
  )
}

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Layers,
  Plus,
  Search,
  RotateCw,
  Edit,
  Trash2,
} from 'lucide-react'

import { getPlans, deletePlan } from '@/api/catalog'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BILLING_PERIODS, BILLING_PERIOD_LABELS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

export default function PlansList() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [plans, setPlans] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  // Filters
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, planId: null, planName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: perPage,
      }
      if (search) params.search = search
      if (periodFilter !== 'all') params.billing_period = periodFilter

      const res = await getPlans(params)
      setPlans(res.data || [])
      setMeta(res.meta || null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch subscription plans'))
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, search, periodFilter])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleDeletePlan = async () => {
    if (!deleteDialog.planId) return
    setIsDeleting(true)
    try {
      await deletePlan(deleteDialog.planId)
      toast.success('Plan deleted successfully')
      setDeleteDialog({ open: false, planId: null, planName: '' })
      fetchPlans()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete plan'))
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: 'Plan Name',
        sortable: false,
        render: (val, row) => (
          <div className="flex flex-col gap-0.5">
            <Link
              to={isAdmin ? `/plans/${row.id}/edit` : '#'}
              className={`font-semibold text-sm ${
                isAdmin ? 'text-primary hover:underline' : 'text-foreground'
              }`}
            >
              {val}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Min Qty: {row.min_quantity}</span>
              {row.tax && <span>&bull; {row.tax.name}</span>}
            </div>
          </div>
        ),
      },
      {
        key: 'price',
        title: 'Price / Cycle',
        sortable: false,
        render: (val, row) => (
          <div className="flex items-center gap-2">
            <MoneyText amount={val} className="font-mono font-bold text-foreground text-sm" />
            <Badge variant="outline" className="text-[10px] capitalize font-mono">
              {row.billing_period}
            </Badge>
          </div>
        ),
      },
      {
        key: 'validity',
        title: 'Validity Window',
        sortable: false,
        render: (_, row) => (
          <div className="text-xs font-mono text-muted-foreground">
            <DateText date={row.start_date} />
            <span className="mx-1">&rarr;</span>
            {row.end_date ? <DateText date={row.end_date} /> : <span>Ongoing</span>}
          </div>
        ),
      },
      {
        key: 'lifecycle',
        title: 'Policy Flags',
        sortable: false,
        render: (_, row) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.pausable && (
              <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                Pausable
              </Badge>
            )}
            {row.renewable && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                Renewable
              </Badge>
            )}
            {row.auto_close && (
              <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
                Auto-Close
              </Badge>
            )}
            {!row.closable && (
              <Badge variant="secondary" className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200">
                Non-Closable
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'is_active',
        title: 'Status',
        sortable: false,
        render: (val) => (
          <Badge
            variant="outline"
            className={`text-xs font-mono ${
              val
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {val ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: 'actions',
              title: '',
              sortable: false,
              className: 'text-right w-16',
              render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link to={`/plans/${row.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDeleteDialog({
                        open: true,
                        planId: row.id,
                        planName: row.name,
                      })
                    }
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [isAdmin]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage recurring plan tiers, billing frequencies, pricing rules, and lifecycle controls."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPlans}
              disabled={isLoading}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isAdmin && (
              <Button asChild size="sm">
                <Link to="/plans/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Plan
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search plan name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
        </div>

        <div className="w-48">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Billing Periods</SelectItem>
              {Object.entries(BILLING_PERIODS).map(([key, val]) => (
                <SelectItem key={key} value={val}>
                  {BILLING_PERIOD_LABELS[val] || val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plans Table */}
      <DataTable
        data={plans}
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
            icon={Layers}
            title="No subscription plans found"
            description="Create subscription plans to configure pricing tiers and billing cadences."
            action={
              isAdmin ? (
                <Button asChild size="sm">
                  <Link to="/plans/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create First Plan
                  </Link>
                </Button>
              ) : null
            }
          />
        }
      />

      {/* Delete Plan Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, planId: null, planName: '' })
        }
        title="Delete Subscription Plan"
        description={`Are you sure you want to delete "${deleteDialog.planName}"? Active subscriptions referencing this plan cannot be affected.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Plan'}
        variant="destructive"
        onConfirm={handleDeletePlan}
      />
    </div>
  )
}

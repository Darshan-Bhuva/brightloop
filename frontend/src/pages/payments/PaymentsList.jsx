import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CreditCard,
  Search,
  RotateCw,
  Plus,
  Trash2,
  Calendar,
  X,
  FileText,
  User,
  Hash,
} from 'lucide-react'

import { getPayments, deletePayment } from '@/api/payments'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RecordPaymentDialog } from '@/components/common/RecordPaymentDialog'
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
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

export default function PaymentsList() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [searchParams, setSearchParams] = useSearchParams()

  const methodFilter = searchParams.get('method') || 'all'
  const search = searchParams.get('search') || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [sortField, setSortField] = useState('payment_date')
  const [sortDirection, setSortDirection] = useState('desc')

  // Search input local state
  const [searchInput, setSearchInput] = useState(search)

  // Dialog states
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, paymentId: null, invoiceNum: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync search input
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: perPage,
        sort: sortField,
        direction: sortDirection,
      }

      if (methodFilter !== 'all') {
        params.method = methodFilter
      }
      if (search) {
        params.search = search
      }
      if (dateFrom) {
        params.date_from = dateFrom
      }
      if (dateTo) {
        params.date_to = dateTo
      }

      const res = await getPayments(params)
      setPayments(res.data || [])
      setMeta(res.meta || null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch payments'))
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, sortField, sortDirection, methodFilter, search, dateFrom, dateTo])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Update query params
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('search', searchInput)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
    setPage(1)
  }

  const hasActiveFilters = Boolean(methodFilter !== 'all' || search || dateFrom || dateTo)

  // Delete payment action (PAY-03)
  const handleDeletePayment = async () => {
    if (!deleteDialog.paymentId) return
    setIsDeleting(true)
    try {
      await deletePayment(deleteDialog.paymentId)
      toast.success('Payment deleted and invoice balances reversed')
      setDeleteDialog({ open: false, paymentId: null, invoiceNum: '' })
      fetchPayments()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete payment'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Method styling helper
  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'upi':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
      case 'bank_transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
      case 'card':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
      case 'cash':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
      case 'cheque':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300'
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
    }
  }

  // Table columns
  const columns = useMemo(
    () => [
      {
        key: 'invoice_number',
        title: 'Invoice #',
        sortable: false,
        render: (val, row) => (
          <Link
            to={`/invoices/${row.invoice_id}`}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {val || `INV-${String(row.invoice_id).padStart(6, '0')}`}
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
        key: 'method',
        title: 'Method',
        sortable: false,
        render: (val) => (
          <Badge variant="outline" className={`capitalize font-mono text-xs ${getMethodBadgeClass(val)}`}>
            {PAYMENT_METHOD_LABELS[val] || val}
          </Badge>
        ),
      },
      {
        key: 'amount',
        title: 'Amount',
        sortable: true,
        className: 'text-right',
        render: (val) => (
          <MoneyText
            amount={val}
            className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right"
          />
        ),
      },
      {
        key: 'payment_date',
        title: 'Date',
        sortable: true,
        render: (val) => <DateText date={val} />,
      },
      {
        key: 'reference',
        title: 'Reference',
        sortable: false,
        render: (val) =>
          val ? (
            <span className="font-mono text-xs text-muted-foreground">{val}</span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
      },
      {
        key: 'recorded_by',
        title: 'Recorded By',
        sortable: false,
        render: (val) => (
          <span className="text-xs text-muted-foreground">{val?.name || 'System'}</span>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: 'actions',
              title: '',
              sortable: false,
              className: 'text-right w-12',
              render: (_, row) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDeleteDialog({
                      open: true,
                      paymentId: row.id,
                      invoiceNum: row.invoice_number,
                    })
                  }
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Delete payment (reverses invoice balances)"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
        title="Payments"
        subtitle="Record settlement transactions against confirmed invoices, monitor collection channels, and maintain the audit ledger."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayments}
              disabled={isLoading}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsRecordDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reference #, invoice, or customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Method Filter */}
          <div className="w-40">
            <Select
              value={methodFilter}
              onValueChange={(val) => updateParam('method', val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                  <SelectItem key={key} value={val}>
                    {PAYMENT_METHOD_LABELS[val] || val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => updateParam('date_from', e.target.value)}
              className="w-36 h-9 text-xs font-mono"
            />
            <span className="text-xs text-muted-foreground">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => updateParam('date_to', e.target.value)}
              className="w-36 h-9 text-xs font-mono"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Payments DataTable */}
      <DataTable
        data={payments}
        columns={columns}
        loading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
        onSortChange={(field, direction) => {
          setSortField(field)
          setSortDirection(direction)
        }}
        sortField={sortField}
        sortDirection={sortDirection}
        emptyState={
          <EmptyState
            icon={CreditCard}
            title="No payments recorded"
            description={
              hasActiveFilters
                ? 'No transactions matched the selected filters. Try clearing or expanding your criteria.'
                : 'Record customer settlement payments against confirmed invoices.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setIsRecordDialogOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Record First Payment
                </Button>
              )
            }
          />
        }
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        onSuccess={() => fetchPayments()}
      />

      {/* Delete Payment Confirm Dialog (PAY-03) */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, paymentId: null, invoiceNum: '' })
        }
        title="Delete Payment Record"
        description={`Are you sure you want to delete this payment for invoice ${deleteDialog.invoiceNum}? This will reverse the collected amount and return the invoice to Confirmed status if an outstanding balance remains.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Payment'}
        variant="destructive"
        onConfirm={handleDeletePayment}
      />
    </div>
  )
}

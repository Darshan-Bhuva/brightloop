import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FileText,
  CreditCard,
  Search,
  RotateCw,
  CheckCircle,
  XCircle,
  Send,
  Printer,
  Eye,
  AlertCircle,
  MoreHorizontal,
  X,
  Filter,
} from 'lucide-react'

import { getInvoices, confirmInvoice, cancelInvoice, sendInvoice, bulkConfirmInvoices } from '@/api/invoices'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RecordPaymentDialog } from '@/components/common/RecordPaymentDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { INVOICE_STATUSES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

export default function InvoicesList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters state from URL or defaults
  const currentTab = searchParams.get('status') || 'all'
  const overdueOnly = searchParams.get('overdue') === 'true'
  const search = searchParams.get('search') || ''
  const invoiceFrom = searchParams.get('invoice_from') || ''
  const invoiceTo = searchParams.get('invoice_to') || ''

  const [invoices, setInvoices] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [sortField, setSortField] = useState('invoice_date')
  const [sortDirection, setSortDirection] = useState('desc')

  // Search input local state
  const [searchInput, setSearchInput] = useState(search)

  // Selection for bulk confirmation
  const [selectedIds, setSelectedIds] = useState([])

  // Modal dialog states
  const [confirmDialog, setConfirmDialog] = useState({ open: false, invoiceId: null })
  const [paymentDialog, setPaymentDialog] = useState({ open: false, invoice: null })
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [cancelDialog, setCancelDialog] = useState({ open: false, invoiceId: null, reason: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync search input
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: perPage,
        sort: sortField,
        direction: sortDirection,
      }

      if (currentTab !== 'all') {
        params.status = currentTab
      }
      if (overdueOnly) {
        params.overdue = true
      }
      if (search) {
        params.search = search
      }
      if (invoiceFrom) {
        params.invoice_from = invoiceFrom
      }
      if (invoiceTo) {
        params.invoice_to = invoiceTo
      }

      const res = await getInvoices(params)
      setInvoices(res.data || [])
      setMeta(res.meta || null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch invoices'))
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, sortField, sortDirection, currentTab, overdueOnly, search, invoiceFrom, invoiceTo])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Clear selections when tab or page changes
  useEffect(() => {
    setSelectedIds([])
  }, [currentTab, overdueOnly, page])

  // Handle URL query updates
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '' || value === false || value === 'all') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('search', searchInput)
  }

  // Handle Clear All Filters
  const handleClearFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    currentTab !== 'all' || overdueOnly || search || invoiceFrom || invoiceTo
  )

  // Selection logic
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(invoices.map((inv) => inv.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Action: Single Confirm
  const handleConfirmSingle = async () => {
    if (!confirmDialog.invoiceId) return
    setIsSubmitting(true)
    try {
      await confirmInvoice(confirmDialog.invoiceId)
      toast.success('Invoice confirmed successfully')
      setConfirmDialog({ open: false, invoiceId: null })
      fetchInvoices()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to confirm invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Bulk Confirm
  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return
    setIsSubmitting(true)
    try {
      const res = await bulkConfirmInvoices({ ids: selectedIds })
      const { confirmed, skipped } = res.data || {}
      toast.success(`Bulk confirm complete: ${confirmed} invoice(s) confirmed.`)
      if (skipped?.length > 0) {
        toast.warning(`${skipped.length} invoice(s) were skipped (already confirmed or invalid).`)
      }
      setSelectedIds([])
      setBulkConfirmOpen(false)
      fetchInvoices()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Bulk confirm failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Cancel Invoice
  const handleCancelInvoice = async () => {
    if (!cancelDialog.invoiceId) return
    setIsSubmitting(true)
    try {
      await cancelInvoice(cancelDialog.invoiceId, { reason: cancelDialog.reason })
      toast.success('Invoice cancelled')
      setCancelDialog({ open: false, invoiceId: null, reason: '' })
      fetchInvoices()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to cancel invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Send Invoice
  const handleSendInvoice = async (id) => {
    try {
      await sendInvoice(id)
      toast.success('Invoice sent to customer via email')
      fetchInvoices()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send invoice'))
    }
  }

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: (
          <Checkbox
            checked={invoices.length > 0 && selectedIds.length === invoices.length}
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
        title: 'Invoice #',
        sortable: true,
        render: (val, row) => (
          <Link
            to={`/invoices/${row.id}`}
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
        key: 'subscription',
        title: 'Subscription',
        sortable: false,
        render: (val) =>
          val ? (
            <Link
              to={`/subscriptions/${val.id}`}
              className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {val.number}
            </Link>
          ) : (
            '-'
          ),
      },
      {
        key: 'invoice_date',
        title: 'Invoice Date',
        sortable: true,
        render: (val) => <DateText date={val} />,
      },
      {
        key: 'due_date',
        title: 'Due Date',
        sortable: true,
        render: (val, row) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <DateText date={val} />
            {row.is_overdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-mono">
                Overdue ({row.days_overdue}d)
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'total',
        title: 'Total',
        sortable: true,
        className: 'text-right',
        render: (val) => <MoneyText amount={val} className="font-semibold text-right" />,
      },
      {
        key: 'amount_due',
        title: 'Amount Due',
        sortable: true,
        className: 'text-right',
        render: (val, row) => (
          <MoneyText
            amount={val}
            className={`font-mono text-right font-semibold ${
              row.is_overdue
                ? 'text-destructive font-bold'
                : Number(val) > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        ),
      },
      {
        key: 'status',
        title: 'Status',
        sortable: false,
        render: (val) => <StatusBadge status={val} type="invoice" />,
      },
      {
        key: 'actions',
        title: '',
        sortable: false,
        className: 'text-right w-12',
        render: (_, row) => {
          const allowed = row.allowed_actions || []
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/invoices/${row.id}`} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>

                {allowed.includes('confirm') && (
                  <DropdownMenuItem
                    onClick={() => setConfirmDialog({ open: true, invoiceId: row.id })}
                    className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Invoice
                  </DropdownMenuItem>
                )}

                {allowed.includes('record_payment') && (
                  <DropdownMenuItem
                    onClick={() => setPaymentDialog({ open: true, invoice: row })}
                    className="cursor-pointer text-primary focus:text-primary"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </DropdownMenuItem>
                )}

                {allowed.includes('send') && (
                  <DropdownMenuItem
                    onClick={() => handleSendInvoice(row.id)}
                    className="cursor-pointer"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send to Customer
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link to={`/invoices/${row.id}/print`} className="cursor-pointer">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Layout
                  </Link>
                </DropdownMenuItem>

                {allowed.includes('cancel') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setCancelDialog({ open: true, invoiceId: row.id, reason: '' })
                      }
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Invoice
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [invoices, selectedIds]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices, track collections, monitor overdue amounts, and perform bulk operations."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInvoices}
              disabled={isLoading}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link to="/billing">
                <FileText className="h-4 w-4 mr-2" />
                Go to Billing Engine
              </Link>
            </Button>
          </div>
        }
      />

      {/* Status Tabs Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <Tabs
          value={currentTab}
          onValueChange={(val) => updateParam('status', val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={INVOICE_STATUSES.DRAFT} className="capitalize">
              Draft
            </TabsTrigger>
            <TabsTrigger value={INVOICE_STATUSES.CONFIRMED} className="capitalize">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value={INVOICE_STATUSES.PAID} className="capitalize">
              Paid
            </TabsTrigger>
            <TabsTrigger value={INVOICE_STATUSES.CANCELLED} className="capitalize">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overdue Only Filter Switch */}
        <div className="flex items-center space-x-2 bg-muted/40 px-3 py-1.5 rounded-lg border">
          <Switch
            id="overdue-toggle"
            checked={overdueOnly}
            onCheckedChange={(checked) => {
              if (checked) {
                const next = new URLSearchParams(searchParams)
                next.set('overdue', 'true')
                setSearchParams(next, { replace: true })
                setSortField('due_date')
                setSortDirection('asc')
                setPage(1)
              } else {
                updateParam('overdue', false)
              }
            }}
          />
          <Label htmlFor="overdue-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            Overdue Only
          </Label>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoice # or customer..."
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From:</span>
            <Input
              type="date"
              value={invoiceFrom}
              onChange={(e) => updateParam('invoice_from', e.target.value)}
              className="w-36 h-8 text-xs font-mono"
            />
            <span className="text-xs text-muted-foreground">To:</span>
            <Input
              type="date"
              value={invoiceTo}
              onChange={(e) => updateParam('invoice_to', e.target.value)}
              className="w-36 h-8 text-xs font-mono"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Filter className="h-4 w-4" />
            <span>{selectedIds.length} invoice(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setBulkConfirmOpen(true)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-xs h-8"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Bulk Confirm Selected ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-xs h-8"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Invoices DataTable */}
      <DataTable
        data={invoices}
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
            icon={FileText}
            title={overdueOnly ? 'No overdue invoices' : 'No invoices found'}
            description={
              hasActiveFilters
                ? 'Try adjusting or clearing your search and date filters to see more results.'
                : 'Execute billing runs to generate automated invoices for active subscriptions.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/billing">Go to Billing Engine</Link>
                </Button>
              )
            }
          />
        }
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog({ open, invoice: null })}
        invoice={paymentDialog.invoice}
        onSuccess={() => fetchInvoices()}
      />

      {/* Confirm Single Invoice Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, invoiceId: null })}
        title="Confirm Invoice"
        description="Are you sure you want to confirm this invoice? It will transition from Draft to Confirmed (or Paid if amount due is 0) and unlock payment recording and emailing."
        confirmText={isSubmitting ? 'Confirming...' : 'Confirm Invoice'}
        variant="default"
        onConfirm={handleConfirmSingle}
      />

      {/* Bulk Confirm Dialog */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={`Bulk Confirm ${selectedIds.length} Invoices`}
        description={`Are you sure you want to confirm ${selectedIds.length} selected invoices? Draft invoices will be confirmed, while already confirmed or invalid invoices will be safely skipped.`}
        confirmText={isSubmitting ? 'Processing...' : 'Bulk Confirm'}
        variant="default"
        onConfirm={handleBulkConfirm}
      />

      {/* Cancel Invoice Dialog with Reason */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, invoiceId: null, reason: '' })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Provide an optional reason for cancelling this invoice. Confirmed invoices with recorded payments cannot be cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cancel-reason">Reason for cancellation</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Customer requested revised terms, billing dispute, etc."
              value={cancelDialog.reason}
              onChange={(e) =>
                setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))
              }
              maxLength={255}
              rows={3}
            />
            <span className="text-[11px] text-muted-foreground block text-right">
              {cancelDialog.reason.length} / 255
            </span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialog({ open: false, invoiceId: null, reason: '' })}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleCancelInvoice}
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

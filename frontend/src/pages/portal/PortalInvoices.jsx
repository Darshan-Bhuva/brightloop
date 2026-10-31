import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  ExternalLink,
  Printer,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react'
import { getInvoices } from '@/api/invoices'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/common/EmptyState'

const PORTAL_INVOICE_TABS = [
  { key: 'all', label: 'All Statements' },
  { key: 'confirmed', label: 'Pending Payment' },
  { key: 'paid', label: 'Paid & Settled' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchCustomerInvoices = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        search: search.trim() || undefined,
        status: statusTab !== 'all' ? statusTab : undefined,
      }
      // Role is customer; customer never sees drafts
      const res = await getInvoices(params, 'customer')
      setInvoices(res.data || [])
      if (res.meta) {
        setMeta(res.meta)
      } else {
        setMeta({ current_page: 1, last_page: 1, total: res.data?.length || 0, per_page: 15 })
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, statusTab, search])

  useEffect(() => {
    fetchCustomerInvoices()
  }, [fetchCustomerInvoices])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            My Invoices
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Access, view, and print official statements and tax invoices issued for your account.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomerInvoices}
          disabled={isLoading}
          className="rounded-sm border-border text-black hover:bg-zinc-50 h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
        {PORTAL_INVOICE_TABS.map((tab) => {
          const isActive = statusTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusTab(tab.key)
                setPage(1)
              }}
              className={`px-4 py-2 text-xs font-mono uppercase font-semibold transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-500 hover:text-black hover:border-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by invoice number (e.g. INV-000001)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 rounded-sm border-border h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice #</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Contract #</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Due Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Invoice Total</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Amount Due</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Status</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading invoices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <EmptyState
                      icon={Receipt}
                      title="No invoices found"
                      description="No statement matching the selected status filter was found."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-b border-border hover:bg-zinc-50/50">
                    <TableCell className="font-mono text-xs font-semibold text-black">
                      <Link to={`/portal/invoices/${inv.id}`} className="hover:text-primary hover:underline">
                        {inv.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {inv.subscription?.number || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(inv.invoice_date)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(inv.due_date)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-black text-right font-medium">
                      {formatMoney(inv.total)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-right">
                      <span className={parseFloat(inv.amount_due) > 0 ? 'text-primary' : 'text-zinc-600'}>
                        {formatMoney(inv.amount_due)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={inv.status} />
                        {inv.is_overdue && (
                          <Badge className="bg-rose-100 text-primary border border-rose-200 text-[10px] font-mono">
                            {inv.days_overdue}d Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/portal/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-600 hover:text-black">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span>View</span>
                          </Button>
                        </Link>
                        <Link to={`/invoices/${inv.id}/print`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-600 hover:text-black">
                            <Printer className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.total > 15 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-zinc-500">
              <div>
                Page <span className="font-mono font-semibold text-black">{meta.current_page}</span> of{' '}
                <span className="font-mono font-semibold text-black">{meta.last_page}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1}
                  className="rounded-sm border-border h-8 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page}
                  className="rounded-sm border-border h-8 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getPayments } from '@/api/payments'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate } from '@/lib/format'
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

export default function PortalPayments() {
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchCustomerPayments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        search: search.trim() || undefined,
      }
      const res = await getPayments(params)
      setPayments(res.data || [])
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
  }, [page, search])

  useEffect(() => {
    fetchCustomerPayments()
  }, [fetchCustomerPayments])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            Payment Receipts
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Confirmed settlements and payment verification receipts for your Brightloop account.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomerPayments}
          disabled={isLoading}
          className="rounded-sm border-border text-black hover:bg-zinc-50 h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by invoice number or payment reference..."
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

      {/* Payments Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Settlement Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice Reference</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Payment Method</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Transaction ID / Reference</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Amount Paid</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading payment history...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <EmptyState
                      icon={CreditCard}
                      title="No payment receipts found"
                      description="Payment settlements recorded against your account statements will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((pmt) => (
                  <TableRow key={pmt.id} className="border-b border-border hover:bg-zinc-50/50">
                    <TableCell className="text-xs font-mono text-zinc-700">
                      {formatDate(pmt.payment_date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-black">
                      {pmt.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-50 border-zinc-200">
                        {pmt.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {pmt.reference || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-emerald-700 text-right">
                      {formatMoney(pmt.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {pmt.note || '-'}
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

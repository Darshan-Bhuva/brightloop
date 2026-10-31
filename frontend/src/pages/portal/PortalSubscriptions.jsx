import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Repeat,
} from 'lucide-react'
import { getSubscriptions } from '@/api/subscriptions'
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

export default function PortalSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchCustomerSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        search: search.trim() || undefined,
      }
      const res = await getSubscriptions(params)
      setSubscriptions(res.data || [])
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
    fetchCustomerSubscriptions()
  }, [fetchCustomerSubscriptions])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            My Subscriptions
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            View active packages, billing frequency, and contract lifecycle status.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomerSubscriptions}
          disabled={isLoading}
          className="rounded-sm border-border text-black hover:bg-zinc-50 h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search Input */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by contract number..."
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

      {/* Subscriptions Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Contract #</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Plan</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Billing Cycle</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Start Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Expiry Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Next Invoice</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Recurring Total</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Status</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading your subscriptions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8">
                    <EmptyState
                      icon={Repeat}
                      title="No subscriptions active"
                      description="You do not have any subscription contracts registered yet."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-b border-border hover:bg-zinc-50/50">
                    <TableCell className="font-mono text-xs font-semibold text-black">
                      <Link to={`/portal/subscriptions/${sub.id}`} className="hover:text-primary hover:underline">
                        {sub.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-black">
                      {sub.plan?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-50 border-zinc-200">
                        {sub.plan?.billing_period}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(sub.start_date)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(sub.expiry_date)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {sub.next_invoice_date ? formatDate(sub.next_invoice_date) : '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-black text-right">
                      {formatMoney(sub.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={sub.status} />
                        {sub.is_paused && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono uppercase font-bold tracking-wider">
                            PAUSED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/portal/subscriptions/${sub.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-600 hover:text-black">
                          <span className="mr-1">Manage</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
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

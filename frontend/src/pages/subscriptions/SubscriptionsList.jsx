import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
} from 'lucide-react'
import { getSubscriptions } from '@/api/subscriptions'
import { getCustomers } from '@/api/customers'
import { getPlans } from '@/api/catalog'
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

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
]

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)

  // Filter States
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [planId, setPlanId] = useState('')
  const [isPausedOnly, setIsPausedOnly] = useState(false)
  const [startFrom, setStartFrom] = useState('')
  const [startTo, setStartTo] = useState('')
  const [expiryFrom, setExpiryFrom] = useState('')
  const [expiryTo, setExpiryTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')

  // Dropdown Dependencies
  const [customers, setCustomers] = useState([])
  const [plans, setPlans] = useState([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Load dropdown lists once
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [custRes, planRes] = await Promise.all([
          getCustomers({ all: 1 }),
          getPlans({ all: 1 }),
        ])
        setCustomers(custRes.data || [])
        setPlans(planRes.data || [])
      } catch (err) {
        console.error('Failed to load dropdown filters', err)
      }
    }
    loadDropdowns()
  }, [])

  // Fetch subscriptions with active filters
  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        sort: sortField,
        direction: sortDirection,
      }

      if (statusTab !== 'all') params.status = statusTab
      if (search.trim()) params.search = search.trim()
      if (customerId) params.customer_id = customerId
      if (planId) params.plan_id = planId
      if (isPausedOnly) params.is_paused = 'true'
      if (startFrom) params.start_from = startFrom
      if (startTo) params.start_to = startTo
      if (expiryFrom) params.expiry_from = expiryFrom
      if (expiryTo) params.expiry_to = expiryTo

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
  }, [
    page,
    statusTab,
    search,
    customerId,
    planId,
    isPausedOnly,
    startFrom,
    startTo,
    expiryFrom,
    expiryTo,
    sortField,
    sortDirection,
  ])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Handle Tab Switch
  const handleTabChange = (key) => {
    setStatusTab(key)
    setPage(1)
  }

  // Handle Sort Change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('')
    setCustomerId('')
    setPlanId('')
    setIsPausedOnly(false)
    setStartFrom('')
    setStartTo('')
    setExpiryFrom('')
    setExpiryTo('')
    setStatusTab('all')
    setPage(1)
  }

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(customerId) ||
    Boolean(planId) ||
    isPausedOnly ||
    Boolean(startFrom) ||
    Boolean(startTo) ||
    Boolean(expiryFrom) ||
    Boolean(expiryTo) ||
    statusTab !== 'all'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage recurring subscriptions, quotations, renewals, and lifecycle states.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
            disabled={isLoading}
            className="rounded-sm border-border text-black hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/subscriptions/new">
            <Button className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none">
              <Plus className="h-4 w-4 mr-2" />
              New Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
        {STATUS_TABS.map((tab) => {
          const isActive = statusTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
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

      {/* Search & Filter Controls */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by number (e.g. SUB-000001) or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9 rounded-sm border-border h-9"
              />
            </div>

            {/* Customer Dropdown */}
            <div className="w-full md:w-56">
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value)
                  setPage(1)
                }}
                className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Dropdown */}
            <div className="w-full md:w-52">
              <select
                value={planId}
                onChange={(e) => {
                  setPlanId(e.target.value)
                  setPage(1)
                }}
                className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">All Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Advanced Filters Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`rounded-sm border-border h-9 text-xs px-3 ${
                showAdvancedFilters ? 'bg-zinc-100 text-black' : 'text-zinc-600'
              }`}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <span>Filters</span>
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-zinc-500 hover:text-black rounded-sm"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Advanced Collapsible Filters */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/60 p-3 rounded-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-600 font-semibold">Start Date From</label>
                <Input
                  type="date"
                  value={startFrom}
                  onChange={(e) => {
                    setStartFrom(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-sm text-xs bg-white border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-600 font-semibold">Start Date To</label>
                <Input
                  type="date"
                  value={startTo}
                  onChange={(e) => {
                    setStartTo(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-sm text-xs bg-white border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-600 font-semibold">Expiry Date From</label>
                <Input
                  type="date"
                  value={expiryFrom}
                  onChange={(e) => {
                    setExpiryFrom(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-sm text-xs bg-white border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-600 font-semibold">Expiry Date To</label>
                <Input
                  type="date"
                  value={expiryTo}
                  onChange={(e) => {
                    setExpiryTo(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-sm text-xs bg-white border-border"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800">
                  <input
                    type="checkbox"
                    checked={isPausedOnly}
                    onChange={(e) => {
                      setIsPausedOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="rounded-sm border-zinc-300 text-black focus:ring-black h-4 w-4"
                  />
                  <span>Show only paused subscriptions</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead
                  onClick={() => handleSort('number')}
                  className="text-xs font-mono font-semibold uppercase text-zinc-600 cursor-pointer hover:text-black"
                >
                  Number {sortField === 'number' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">
                  Plan & Period
                </TableHead>
                <TableHead
                  onClick={() => handleSort('start_date')}
                  className="text-xs font-mono font-semibold uppercase text-zinc-600 cursor-pointer hover:text-black"
                >
                  Start Date {sortField === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  onClick={() => handleSort('expiry_date')}
                  className="text-xs font-mono font-semibold uppercase text-zinc-600 cursor-pointer hover:text-black"
                >
                  Expiry Date {sortField === 'expiry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">
                  Next Invoice
                </TableHead>
                <TableHead
                  onClick={() => handleSort('total')}
                  className="text-xs font-mono font-semibold uppercase text-zinc-600 cursor-pointer hover:text-black text-right"
                >
                  Total {sortField === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">
                  Status
                </TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading subscriptions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8">
                    <EmptyState
                      icon={Calendar}
                      title="No subscriptions found"
                      description={
                        hasActiveFilters
                          ? 'No subscriptions match your current filter settings. Try clearing some filters.'
                          : 'No subscriptions exist in this category yet.'
                      }
                      action={
                        hasActiveFilters ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="rounded-sm mt-3 border-border"
                          >
                            Reset All Filters
                          </Button>
                        ) : (
                          <Link to="/subscriptions/new">
                            <Button size="sm" className="bg-primary text-white rounded-sm mt-3">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Subscription
                            </Button>
                          </Link>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-b border-border hover:bg-zinc-50/60 transition-colors">
                    {/* Number */}
                    <TableCell className="font-mono text-xs font-semibold text-black">
                      <Link
                        to={`/subscriptions/${sub.id}`}
                        className="text-black hover:text-primary underline-offset-4 hover:underline"
                      >
                        {sub.number}
                      </Link>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="text-xs font-medium text-black">
                      {sub.customer?.name || '-'}
                    </TableCell>

                    {/* Plan & Period */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-black">{sub.plan?.name || '-'}</span>
                        {sub.plan?.billing_period && (
                          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-100 border-zinc-200">
                            {sub.plan.billing_period}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Start Date */}
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(sub.start_date)}
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {formatDate(sub.expiry_date)}
                    </TableCell>

                    {/* Next Invoice Date */}
                    <TableCell className="text-xs font-mono text-zinc-600">
                      {sub.next_invoice_date ? formatDate(sub.next_invoice_date) : '-'}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-xs font-mono font-semibold text-black text-right">
                      {formatMoney(sub.total)}
                    </TableCell>

                    {/* Status Badge (+ Paused Badge) */}
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

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link to={`/subscriptions/${sub.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-sm"
                        >
                          <span className="text-xs mr-1">View</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {meta.total > 0 && (
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
              <div>
                Showing page <span className="font-mono font-semibold text-black">{meta.current_page}</span> of{' '}
                <span className="font-mono font-semibold text-black">{meta.last_page}</span> ({meta.total} subscriptions total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || isLoading}
                  className="rounded-sm border-border h-8 text-xs px-3"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page || isLoading}
                  className="rounded-sm border-border h-8 text-xs px-3"
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

import React, { useState } from 'react'
import {
  Repeat,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  FilterBar,
  StatusBadge,
  MoneyText,
  DateText,
} from '@/components/common'
import { SUBSCRIPTION_STATUSES } from '@/lib/constants'

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('number')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const kpis = [
    { title: 'ACTIVE SUBSCRIPTIONS', value: '1,800', note: '+12% from last cycle', icon: Repeat },
    { title: 'ESTIMATED MRR', value: '₹12,50,000.00', note: 'Monthly run rate', icon: DollarSign },
    { title: 'COLLECTED (MTD)', value: '₹7,50,000.00', note: '83% collection rate', icon: FileCheck },
    { title: 'OUTSTANDING', value: '₹3,00,000.00', note: '210 open invoices', icon: TrendingUp },
    { title: 'OVERDUE TOTAL', value: '₹90,000.00', note: '55 overdue invoices', icon: AlertTriangle, alert: true },
  ]

  const demoSubscriptions = [
    {
      id: 1,
      number: 'SUB-000001',
      customer: { id: 1, name: 'Acme Corporation' },
      plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly' },
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      total: '1378.82',
      start_date: '2026-10-15',
    },
    {
      id: 2,
      number: 'SUB-000002',
      customer: { id: 2, name: 'Stark Industries' },
      plan: { id: 2, name: 'Yearly Business', billing_period: 'yearly' },
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      total: '11798.82',
      start_date: '2026-10-18',
    },
    {
      id: 3,
      number: 'SUB-000003',
      customer: { id: 3, name: 'Wayne Enterprises' },
      plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly' },
      status: SUBSCRIPTION_STATUSES.CONFIRMED,
      total: '999.00',
      start_date: '2026-10-20',
    },
    {
      id: 4,
      number: 'SUB-000004',
      customer: { id: 4, name: 'Cyberdyne Systems' },
      plan: { id: 3, name: 'Weekly Trial', billing_period: 'weekly' },
      status: SUBSCRIPTION_STATUSES.QUOTATION,
      total: '234.82',
      start_date: '2026-10-22',
    },
    {
      id: 5,
      number: 'SUB-000005',
      customer: { id: 5, name: 'Umbrella Health' },
      plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly' },
      status: SUBSCRIPTION_STATUSES.DRAFT,
      total: '1500.00',
      start_date: '2026-10-25',
    },
  ]

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredRows = demoSubscriptions
    .filter((sub) => {
      const matchSearch =
        !search ||
        sub.number.toLowerCase().includes(search.toLowerCase()) ||
        sub.customer.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || sub.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (sortField === 'customer') {
        aVal = a.customer.name
        bVal = b.customer.name
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const columns = [
    {
      key: 'number',
      label: 'Reference',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-xs text-foreground">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (_, row) => <span className="font-sans font-medium text-sm">{row.customer.name}</span>,
    },
    {
      key: 'plan',
      label: 'Plan & Period',
      render: (_, row) => (
        <span className="font-sans text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{row.plan.name}</span>
          <span className="font-mono text-[11px] ml-1.5 opacity-70 capitalize">({row.plan.billing_period})</span>
        </span>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (val) => <DateText date={val} className="font-mono text-xs text-muted-foreground" />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} type="subscription" />,
    },
    {
      key: 'total',
      label: 'Total (INR)',
      align: 'right',
      sortable: true,
      render: (val) => <MoneyText amount={val} className="text-right font-mono font-semibold text-xs" />,
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Overview
            </span>
            <span className="text-muted-foreground">/</span>
            <Badge variant="signal" className="text-[10px]">
              Brightloop Industrial System
            </Badge>
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
            Operations Dashboard
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1 max-w-2xl">
            Real-time subscriber metrics, receivables, and billing pipeline performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            CYCLE STATUS: OK
          </Button>
          <Button size="sm">
            NEW SUBSCRIPTION
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card
              key={kpi.title}
              className={`p-1 ${
                kpi.alert
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  {kpi.title}
                </span>
                <Icon
                  className={`h-4 w-4 ${
                    kpi.alert ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className={`font-sans text-2xl font-bold tracking-tight ${
                    kpi.alert ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {kpi.value}
                </div>
                <p className="font-mono text-[11px] text-muted-foreground mt-1.5">
                  {kpi.note}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FilterBar Demo */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter subscriptions..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Draft', value: SUBSCRIPTION_STATUSES.DRAFT },
              { label: 'Quotation', value: SUBSCRIPTION_STATUSES.QUOTATION },
              { label: 'Confirmed', value: SUBSCRIPTION_STATUSES.CONFIRMED },
              { label: 'Active', value: SUBSCRIPTION_STATUSES.ACTIVE },
              { label: 'Closed', value: SUBSCRIPTION_STATUSES.CLOSED },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('')
        }}
      />

      {/* Reusable DataTable Demo with Sort Headers and Server Pagination */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-bold uppercase tracking-tight text-foreground">
              Recent Subscriptions
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {filteredRows.length} RECORDS
            </Badge>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Server Pagination & Sort Header Demo
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredRows}
          sort={sortField}
          direction={sortDir}
          onSort={handleSort}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          meta={{
            current_page: page,
            last_page: 1,
            per_page: perPage,
            total: filteredRows.length,
          }}
        />
      </div>
    </div>
  )
}

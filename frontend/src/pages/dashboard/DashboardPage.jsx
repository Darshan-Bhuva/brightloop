import React from 'react'
import {
  Repeat,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

export default function DashboardPage() {
  const kpis = [
    { title: 'ACTIVE SUBSCRIPTIONS', value: '1,800', note: '+12% from last cycle', icon: Repeat },
    { title: 'ESTIMATED MRR', value: '₹12,50,000.00', note: 'Monthly run rate', icon: DollarSign },
    { title: 'COLLECTED (MTD)', value: '₹7,50,000.00', note: '83% collection rate', icon: FileCheck },
    { title: 'OUTSTANDING', value: '₹3,00,000.00', note: '210 open invoices', icon: TrendingUp },
    { title: 'OVERDUE TOTAL', value: '₹90,000.00', note: '55 overdue invoices', icon: AlertTriangle, alert: true },
  ]

  const demoRows = [
    { id: 'SUB-000001', customer: 'Acme Corp', plan: 'Monthly Starter', period: 'monthly', status: 'active', amount: '₹1,378.82', date: '2026-10-15' },
    { id: 'SUB-000002', customer: 'Stark Industries', plan: 'Yearly Business', period: 'yearly', status: 'active', amount: '₹11,798.82', date: '2026-10-18' },
    { id: 'SUB-000003', customer: 'Wayne Enterprises', plan: 'Monthly Starter', period: 'monthly', status: 'paused', amount: '₹999.00', date: '2026-10-20' },
    { id: 'SUB-000004', customer: 'Cyberdyne Systems', plan: 'Weekly Trial', period: 'weekly', status: 'quotation', amount: '₹234.82', date: '2026-10-22' },
    { id: 'SUB-000005', customer: 'Umbrella Health', plan: 'Monthly Starter', period: 'monthly', status: 'draft', amount: '₹1,500.00', date: '2026-10-25' },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">ACTIVE</Badge>
      case 'paused':
        return <Badge variant="secondary">PAUSED</Badge>
      case 'quotation':
        return <Badge variant="outline">QUOTATION</Badge>
      case 'draft':
        return <Badge variant="subtle">DRAFT</Badge>
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>
    }
  }

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

      {/* KPI Cards: High contrast, flat, breathable */}
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

      {/* Demo DataTable: Clean industrial layout, monospace numbers */}
      <Card className="p-2 border-border">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
                  Recent Subscriptions
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  5 RECORDS
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                DataTable preview with server-styled columns, status chips, and monetary values.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                FILTER
              </Button>
              <Button size="sm" variant="secondary">
                EXPORT
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Reference
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Plan & Period
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Start Date
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Total (INR)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoRows.map((row) => (
                <TableRow key={row.id} className="border-b border-border/60 hover:bg-muted/50">
                  <TableCell className="font-mono font-bold text-xs text-foreground">
                    {row.id}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-sm">
                    {row.customer}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{row.plan}</span>
                    <span className="font-mono text-[11px] ml-1.5 opacity-70">({row.period})</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.date}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(row.status)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-xs">
                    {row.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Industrial Pagination footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground mt-4 gap-3">
            <div className="font-mono text-[11px]">
              SHOWING <span className="text-foreground font-semibold">1</span> TO <span className="text-foreground font-semibold">5</span> OF <span className="text-foreground font-semibold">5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled className="h-8 text-xs font-mono">
                PREVIOUS
              </Button>
              <Button variant="default" size="sm" className="h-8 w-8 text-xs font-mono p-0">
                1
              </Button>
              <Button variant="outline" size="sm" disabled className="h-8 text-xs font-mono">
                NEXT
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

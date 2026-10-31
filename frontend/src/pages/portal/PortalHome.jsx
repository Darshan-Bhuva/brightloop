import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Repeat,
  Receipt,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Printer,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { getPortalSummary } from '@/api/portal'
import { useAuth } from '@/context/AuthContext'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate } from '@/lib/format'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/common/EmptyState'

export default function PortalHome() {
  const { user, customer } = useAuth()
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true)
      try {
        const res = await getPortalSummary()
        setSummary(res.data)
      } catch (err) {
        handleApiError(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSummary()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome & Account Identity Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-sm font-semibold">
              Customer Portal
            </span>
            {customer?.company_name && (
              <span className="text-xs text-zinc-500 font-medium">
                {customer.company_name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            Welcome back, {user?.name || customer?.name || 'Customer'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your Brightloop subscription contracts, view invoices, and track billing receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/portal/subscriptions">
            <Button variant="outline" size="sm" className="rounded-sm border-border text-xs h-8">
              <Repeat className="h-3.5 w-3.5 mr-1.5" />
              My Subscriptions
            </Button>
          </Link>
          <Link to="/portal/invoices">
            <Button size="sm" className="rounded-sm bg-primary text-white hover:bg-primary/95 text-xs h-8 shadow-none">
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              View Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Metric Cards (PORTAL-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Subscriptions */}
        <Link to="/portal/subscriptions" className="block group">
          <Card className="rounded-md border border-border bg-white shadow-none hover:border-black transition-colors">
            <CardContent className="p-4 flex flex-col justify-between h-28">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Active Services
                </span>
                <Repeat className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
              <div className="text-2xl font-mono font-bold text-black">
                {summary ? summary.active_subscriptions : '-'}
              </div>
              <span className="text-[11px] text-zinc-400">View current packages →</span>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 2: Next Billing Cycle */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardContent className="p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                Next Billing Date
              </span>
              <Calendar className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-lg font-mono font-bold text-black">
              {summary?.next_billing_date ? formatDate(summary.next_billing_date) : 'No pending cycle'}
            </div>
            <span className="text-[11px] text-zinc-400">Scheduled auto-generation</span>
          </CardContent>
        </Card>

        {/* Metric 3: Outstanding Amount */}
        <Link to="/portal/invoices" className="block group">
          <Card className="rounded-md border border-border bg-white shadow-none hover:border-black transition-colors">
            <CardContent className="p-4 flex flex-col justify-between h-28">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Amount Due
                </span>
                <Receipt className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
              <div className="text-2xl font-mono font-bold text-black">
                {summary ? formatMoney(summary.outstanding_amount) : '-'}
              </div>
              <span className="text-[11px] text-zinc-400">Total unpaid balance</span>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 4: Overdue Notice */}
        <Card
          className={`rounded-md border shadow-none ${
            summary?.overdue_count > 0
              ? 'border-rose-300 bg-rose-50/50'
              : 'border-border bg-white'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                Overdue Status
              </span>
              <AlertCircle
                className={`h-4 w-4 ${summary?.overdue_count > 0 ? 'text-primary' : 'text-zinc-400'}`}
              />
            </div>
            <div
              className={`text-2xl font-mono font-bold ${
                summary?.overdue_count > 0 ? 'text-primary' : 'text-black'
              }`}
            >
              {summary ? (summary.overdue_count > 0 ? `${summary.overdue_count} Overdue` : 'Clear') : '-'}
            </div>
            <span className="text-[11px] text-zinc-400">
              {summary?.overdue_count > 0 ? 'Immediate action requested' : 'Account in good standing'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Table (PORTAL-01 recent_invoices: no drafts) */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5 text-zinc-400" />
              <span>Recent Invoices & Statements</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-zinc-500 mt-0.5">
              Statements generated for your active subscriptions (latest 5).
            </CardDescription>
          </div>
          <Link
            to="/portal/invoices"
            className="text-xs font-mono text-zinc-600 hover:text-black flex items-center gap-1"
          >
            <span>All Invoices</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice Number</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Contract</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Invoice Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Due Date</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Total</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Amount Due</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Status</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading recent statements...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !summary?.recent_invoices || summary.recent_invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <EmptyState
                      icon={Receipt}
                      title="No invoices found"
                      description="Statements will be automatically generated and listed here once billing cycles execute."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                summary.recent_invoices.map((inv) => (
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
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/portal/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-600 hover:text-black">
                            <ExternalLink className="h-3 w-3" />
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
        </CardContent>
      </Card>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link to="/portal/subscriptions" className="block group">
          <div className="p-4 rounded-md border border-border bg-white hover:border-black transition-colors flex items-start gap-3">
            <Repeat className="h-5 w-5 text-black mt-0.5" />
            <div>
              <h4 className="font-heading font-semibold text-sm text-black group-hover:text-primary transition-colors">
                My Subscriptions
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Review active packages, pause during downtime, or request contract renewals.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/portal/payments" className="block group">
          <div className="p-4 rounded-md border border-border bg-white hover:border-black transition-colors flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-black mt-0.5" />
            <div>
              <h4 className="font-heading font-semibold text-sm text-black group-hover:text-primary transition-colors">
                Payment Receipts
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Access confirmation references, payment dates, and settlement receipts.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/profile" className="block group">
          <div className="p-4 rounded-md border border-border bg-white hover:border-black transition-colors flex items-start gap-3">
            <User className="h-5 w-5 text-black mt-0.5" />
            <div>
              <h4 className="font-heading font-semibold text-sm text-black group-hover:text-primary transition-colors">
                Company & Billing Profile
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update business name, GST/tax address, phone, and billing email contacts.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

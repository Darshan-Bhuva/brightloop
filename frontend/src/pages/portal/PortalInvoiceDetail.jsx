import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Calendar,
  Building,
  CreditCard,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { getInvoice } from '@/api/invoices'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

export default function PortalInvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getInvoice(id, 'customer')
      setInvoice(res.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading statement...</span>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-xl font-heading font-semibold text-black">Invoice Not Found</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/portal/invoices')}
          className="rounded-sm border-border mt-2"
        >
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Print Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal/invoices')}
            className="rounded-sm border-border text-zinc-600 hover:text-black h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-mono font-bold text-black tracking-tight">
                {invoice.number}
              </h1>
              <StatusBadge status={invoice.status} />
              {invoice.is_overdue && (
                <Badge className="bg-rose-100 text-primary border border-rose-200 text-[10px] font-mono">
                  {invoice.days_overdue}d Overdue
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Issued on {formatDate(invoice.invoice_date)} • Due on {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/invoices/${id}/print`}>
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm border-border text-xs h-8 text-black hover:bg-zinc-100 font-medium"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer & Billing Address */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Building className="h-3.5 w-3.5 text-zinc-400" />
              <span>Billed To</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1.5 text-xs">
            <div className="font-semibold text-sm text-black">{invoice.customer?.name}</div>
            {invoice.customer?.company_name && (
              <div className="text-zinc-700 font-medium">{invoice.customer.company_name}</div>
            )}
            {invoice.customer?.address_line && (
              <div className="text-zinc-500">{invoice.customer.address_line}</div>
            )}
            <div className="text-zinc-500">
              {[invoice.customer?.city, invoice.customer?.state, invoice.customer?.country, invoice.customer?.postal_code]
                .filter(Boolean)
                .join(', ')}
            </div>
            {invoice.customer?.phone && (
              <div className="text-zinc-500 pt-1">Phone: {invoice.customer.phone}</div>
            )}
          </CardContent>
        </Card>

        {/* Contract & Term Information */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Invoice Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Related Contract:</span>
              <Link
                to={`/portal/subscriptions/${invoice.subscription?.id}`}
                className="font-mono text-black font-semibold hover:text-primary hover:underline"
              >
                {invoice.subscription?.number}
              </Link>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Payment Terms:</span>
              <span className="font-medium text-black">
                {invoice.payment_term?.name || 'Standard'}
              </span>
            </div>
            {invoice.period_start && invoice.period_end && (
              <div className="flex items-center justify-between text-zinc-600">
                <span>Coverage Period:</span>
                <span className="font-mono text-zinc-700">
                  {formatDate(invoice.period_start)} to {formatDate(invoice.period_end)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-border">
              <span>Outstanding Amount Due:</span>
              <span className={`font-mono font-bold text-sm ${parseFloat(invoice.amount_due) > 0 ? 'text-primary' : 'text-emerald-600'}`}>
                {formatMoney(invoice.amount_due)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Lines Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
            Statement Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Item Description</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-center w-24">Qty</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-28">Unit Price</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-28">Discount</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-28">Tax</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-36">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.lines || []).map((line) => (
                <TableRow key={line.id} className="border-b border-border">
                  <TableCell className="text-xs font-medium text-black">
                    {line.description}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-zinc-700">
                    {line.quantity}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-700 text-right">
                    {formatMoney(line.unit_price)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-emerald-700 text-right">
                    {parseFloat(line.discount_amount) > 0 ? `-${formatMoney(line.discount_amount)}` : '-'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-600 text-right">
                    {formatMoney(line.tax_amount)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-black text-right">
                    {formatMoney(line.line_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals Summary */}
          <div className="p-4 border-t border-border bg-zinc-50/30 flex justify-end">
            <div className="w-80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-black">{formatMoney(invoice.subtotal)}</span>
              </div>
              {parseFloat(invoice.discount_total) > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Discounts Applied</span>
                  <span className="font-mono">-{formatMoney(invoice.discount_total)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-zinc-600">
                <span>Taxes</span>
                <span className="font-mono font-medium text-black">{formatMoney(invoice.tax_total)}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between font-semibold text-black">
                <span>Total Amount</span>
                <span className="font-mono text-base">{formatMoney(invoice.total)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Amount Paid</span>
                <span className="font-mono text-emerald-700 font-medium">{formatMoney(invoice.amount_paid)}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between font-bold text-black">
                <span>Balance Due</span>
                <span className="font-mono text-lg text-primary">{formatMoney(invoice.amount_due)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recorded Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span>Payment Settlements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Payment Date</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Method</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Reference #</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Amount Settled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((pmt) => (
                  <TableRow key={pmt.id} className="border-b border-border">
                    <TableCell className="text-xs font-mono text-zinc-600">{formatDate(pmt.payment_date)}</TableCell>
                    <TableCell className="text-xs font-mono uppercase font-semibold text-black">{pmt.method}</TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600">{pmt.reference || '-'}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-emerald-700 text-right">
                      {formatMoney(pmt.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

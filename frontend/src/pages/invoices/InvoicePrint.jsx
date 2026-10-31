import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getInvoice } from '@/api/invoices'
import { formatDate } from '@/lib/format'
import { MoneyText } from '@/components/common/MoneyText'

export default function InvoicePrint() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const res = await getInvoice(id)
        setInvoice(res.data || null)
      } catch {
        // Handled in render
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RotateCw className="h-5 w-5 animate-spin" />
          <span>Preparing printable invoice...</span>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4">
        <p className="text-muted-foreground">Invoice #{id} could not be loaded.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/invoices">Return to Invoices</Link>
        </Button>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'
  const isCancelled = invoice.status === 'cancelled'

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8 print:p-0 print:bg-white text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Control Bar (Screen only) */}
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to={`/invoices/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} size="sm" className="bg-primary hover:bg-primary/90">
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Printable Invoice Paper Sheet */}
        <div className="rounded-xl border bg-white p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-primary">Brightloop</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Billing
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Brightloop Technologies Pvt. Ltd.</p>
              <p className="text-xs text-muted-foreground">100 Innovation Boulevard, Cyber City</p>
              <p className="text-xs text-muted-foreground">Bengaluru, Karnataka 560100</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">GSTIN: 29AABCU9603R1ZM</p>
            </div>

            <div className="text-right space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight font-mono">INVOICE</h1>
              <p className="text-base font-bold font-mono text-primary">{invoice.number}</p>
              <div className="pt-1">
                {isPaid ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PAID IN FULL
                  </span>
                ) : isCancelled ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-100 text-red-800 border border-red-300">
                    CANCELLED
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300">
                    {invoice.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Invoice Meta */}
          <div className="grid grid-cols-2 gap-8 py-8 border-b text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Billed To
              </div>
              <div className="font-bold text-base">{invoice.customer?.name}</div>
              {invoice.customer?.company_name && (
                <div className="text-sm font-medium text-zinc-700">{invoice.customer.company_name}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {invoice.customer?.address_line && <div>{invoice.customer.address_line}</div>}
                {(invoice.customer?.city || invoice.customer?.state) && (
                  <div>
                    {[invoice.customer.city, invoice.customer.state, invoice.customer.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {invoice.customer?.country && <div>{invoice.customer.country}</div>}
                {invoice.customer?.email && <div className="pt-1">{invoice.customer.email}</div>}
                {invoice.customer?.phone && <div>{invoice.customer.phone}</div>}
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Invoice Details
              </div>
              <div className="flex justify-end gap-3 text-xs">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="font-mono font-medium">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-end gap-3 text-xs">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-mono font-medium">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex justify-end gap-3 text-xs">
                <span className="text-muted-foreground">Billing Period:</span>
                <span className="font-mono font-medium">
                  {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                </span>
              </div>
              <div className="flex justify-end gap-3 text-xs">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span className="font-medium">
                  {invoice.payment_term?.name || 'Immediate'} ({invoice.payment_term?.due_days || 0} days)
                </span>
              </div>
              <div className="flex justify-end gap-3 text-xs">
                <span className="text-muted-foreground">Subscription #:</span>
                <span className="font-mono font-medium text-primary">
                  {invoice.subscription?.number || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-8">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Item Description</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Discount</th>
                  <th className="pb-3 text-right">Tax</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoice.lines?.map((line, idx) => (
                  <tr key={line.id || idx} className="py-3">
                    <td className="py-3 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900">{line.description}</div>
                    </td>
                    <td className="py-3 text-right font-mono text-xs">{line.quantity}</td>
                    <td className="py-3 text-right font-mono text-xs">
                      <MoneyText amount={line.unit_price} />
                    </td>
                    <td className="py-3 text-right font-mono text-xs">
                      {Number(line.discount_amount || 0) > 0 ? (
                        <span>-<MoneyText amount={line.discount_amount} /></span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 text-right font-mono text-xs">
                      <div><MoneyText amount={line.tax_amount} /></div>
                      {line.tax_name && (
                        <div className="text-[10px] text-muted-foreground">
                          {line.tax_name} ({line.tax_rate}%)
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-xs">
                      <MoneyText amount={line.line_total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4 border-t">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal:</span>
                <MoneyText amount={invoice.subtotal} className="font-mono" />
              </div>
              {Number(invoice.discount_total || 0) > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Discount:</span>
                  <span>-<MoneyText amount={invoice.discount_total} className="font-mono" /></span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax Total:</span>
                <MoneyText amount={invoice.tax_total} className="font-mono" />
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base text-zinc-900">
                <span>Total:</span>
                <MoneyText amount={invoice.total} className="font-mono" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Amount Paid:</span>
                <MoneyText amount={invoice.amount_paid} className="font-mono" />
              </div>
              <div className="flex justify-between font-bold text-sm border-t pt-2">
                <span className={invoice.is_overdue ? 'text-red-600' : 'text-primary'}>
                  Balance Due:
                </span>
                <MoneyText
                  amount={invoice.amount_due}
                  className={`font-mono ${
                    invoice.is_overdue ? 'text-red-600 font-extrabold' : 'text-primary'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Notes and Payment Information */}
          <div className="mt-12 pt-6 border-t grid grid-cols-2 gap-8 text-xs text-muted-foreground">
            <div>
              <div className="font-bold text-zinc-900 mb-1">Notes & Terms</div>
              <p className="whitespace-pre-wrap">{invoice.notes || 'Payment is due per agreed payment terms.'}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-zinc-900 mb-1">Payment Instructions</div>
              <p>Bank: HDFC Bank Ltd.</p>
              <p>Account: 50200012345678 (Brightloop Tech Pvt Ltd)</p>
              <p>IFSC Code: HDFC0001234 &bull; UPI: brightloop@hdfcbank</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-[11px] text-muted-foreground">
            Thank you for partnering with Brightloop. For inquiries, email billing@brightloop.test.
          </div>
        </div>
      </div>
    </div>
  )
}

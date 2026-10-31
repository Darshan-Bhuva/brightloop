import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  Printer,
  Building,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Receipt,
  RotateCw,
  Edit,
  CreditCard,
} from 'lucide-react'

import { getInvoice, confirmInvoice, cancelInvoice, sendInvoice, updateInvoice } from '@/api/invoices'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Action dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Edit draft dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ due_date: '', notes: '' })

  // Fetch invoice details
  const fetchInvoiceDetails = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getInvoice(id)
      const data = res.data || {}
      setInvoice(data)
      setEditForm({
        due_date: data.due_date || '',
        notes: data.notes || '',
      })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch invoice details'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInvoiceDetails()
  }, [fetchInvoiceDetails])

  // Handle Confirm Invoice
  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await confirmInvoice(id)
      toast.success('Invoice confirmed successfully')
      setConfirmDialogOpen(false)
      fetchInvoiceDetails()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to confirm invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Cancel Invoice
  const handleCancel = async () => {
    setIsSubmitting(true)
    try {
      await cancelInvoice(id, { reason: cancelReason })
      toast.success('Invoice cancelled')
      setCancelDialogOpen(false)
      setCancelReason('')
      fetchInvoiceDetails()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to cancel invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Send Invoice
  const handleSend = async () => {
    setIsSubmitting(true)
    try {
      await sendInvoice(id)
      toast.success(`Invoice sent to ${invoice.customer?.email || 'customer'}`)
      setSendDialogOpen(false)
      fetchInvoiceDetails()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Update Invoice (INV-03)
  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateInvoice(id, editForm)
      toast.success('Invoice details updated')
      setEditDialogOpen(false)
      fetchInvoiceDetails()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update invoice'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RotateCw className="h-5 w-5 animate-spin" />
          <span>Loading invoice details...</span>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Invoice not found or could not be loaded.
          </CardContent>
        </Card>
      </div>
    )
  }

  const allowed = invoice.allowed_actions || []

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link to="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>

        {/* Action Buttons strictly driven by allowed_actions (BR-8) */}
        <div className="flex flex-wrap items-center gap-2">
          {allowed.includes('edit') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          )}

          {allowed.includes('confirm') && (
            <Button
              size="sm"
              onClick={() => setConfirmDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Confirm Invoice
            </Button>
          )}

          {allowed.includes('send') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSendDialogOpen(true)}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Send to Customer
            </Button>
          )}

          {allowed.includes('print') && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/invoices/${invoice.id}/print`}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print View
              </Link>
            </Button>
          )}

          {allowed.includes('cancel') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold">{invoice.number}</span>
            <StatusBadge status={invoice.status} type="invoice" size="md" />
            {invoice.is_overdue && (
              <Badge variant="destructive" className="font-mono text-xs">
                Overdue by {invoice.days_overdue} day(s)
              </Badge>
            )}
          </div>
        }
        subtitle={
          <span>
            Generated for subscription{' '}
            <Link
              to={`/subscriptions/${invoice.subscription?.id}`}
              className="font-mono font-semibold text-primary hover:underline"
            >
              {invoice.subscription?.number}
            </Link>{' '}
            &bull; Billing cycle: {formatDate(invoice.period_start)} to {formatDate(invoice.period_end)}
          </span>
        }
      />

      {/* Overdue Warning Alert */}
      {invoice.is_overdue && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Invoice Overdue:</span> This invoice was due on{' '}
            <span className="font-mono font-medium">{formatDate(invoice.due_date)}</span> ({invoice.days_overdue} days ago). Total outstanding due is{' '}
            <span className="font-mono font-bold">{invoice.amount_due} INR</span>.
          </div>
        </div>
      )}

      {/* Invoice Overview Metadata */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Customer & Billing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-bold text-base text-foreground">
                {invoice.customer?.name}
              </div>
              {invoice.customer?.company_name && (
                <div className="text-muted-foreground text-xs font-medium">
                  {invoice.customer?.company_name}
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              {invoice.customer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{invoice.customer.email}</span>
                </div>
              )}
              {invoice.customer?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{invoice.customer.phone}</span>
                </div>
              )}
              {(invoice.customer?.address_line || invoice.customer?.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span>
                    {[
                      invoice.customer.address_line,
                      invoice.customer.city,
                      invoice.customer.state,
                      invoice.customer.postal_code,
                      invoice.customer.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Dates and Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Invoice Terms & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span className="font-medium font-mono">{formatDate(invoice.invoice_date)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Due Date:</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-medium ${invoice.is_overdue ? 'text-destructive font-bold' : ''}`}>
                  {formatDate(invoice.due_date)}
                </span>
                {invoice.payment_term && (
                  <Badge variant="outline" className="text-[10px]">
                    {invoice.payment_term.name} ({invoice.payment_term.due_days}d)
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Billing Period:</span>
              <span className="font-medium font-mono">
                {formatDate(invoice.period_start)} &rarr; {formatDate(invoice.period_end)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Sent Status:</span>
              <span className="text-xs">
                {invoice.sent_at ? (
                  <span className="text-emerald-600 font-medium">Sent on {formatDateTime(invoice.sent_at)}</span>
                ) : (
                  <span className="text-muted-foreground">Not yet emailed</span>
                )}
              </span>
            </div>
            {invoice.cancelled_at && (
              <div className="flex justify-between items-center py-1 text-destructive">
                <span>Cancelled:</span>
                <span className="text-xs font-mono">
                  {formatDateTime(invoice.cancelled_at)} ({invoice.cancel_reason || 'No reason specified'})
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
          <CardDescription>
            Recurring plan line and provisioned products with snapshotted taxes and evaluated discounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No line items on this invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoice.lines?.map((line, idx) => (
                    <TableRow key={line.id || idx}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{line.description}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <MoneyText amount={line.unit_price} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(line.discount_amount || 0) > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 font-semibold">
                              -<MoneyText amount={line.discount_amount} />
                            </span>
                            {line.discount_name && (
                              <span className="text-[10px] text-muted-foreground">
                                {line.discount_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <div className="flex flex-col items-end">
                          <span><MoneyText amount={line.tax_amount} /></span>
                          {line.tax_name && (
                            <span className="text-[10px] text-muted-foreground">
                              {line.tax_name} ({line.tax_rate}%)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        <MoneyText amount={line.line_total} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Financial Totals Breakdown Box */}
          <div className="flex justify-end p-6 border-t bg-muted/10">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <MoneyText amount={invoice.subtotal} className="font-mono" />
              </div>
              {Number(invoice.discount_total || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Discounts:</span>
                  <span>-<MoneyText amount={invoice.discount_total} className="font-mono" /></span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax Total:</span>
                <MoneyText amount={invoice.tax_total} className="font-mono" />
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount:</span>
                <MoneyText amount={invoice.total} className="font-mono" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Amount Paid:</span>
                <MoneyText amount={invoice.amount_paid} className="font-mono" />
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span className={invoice.is_overdue ? 'text-destructive' : 'text-primary'}>
                  Amount Due:
                </span>
                <MoneyText
                  amount={invoice.amount_due}
                  className={`font-mono ${
                    invoice.is_overdue ? 'text-destructive font-extrabold' : 'text-primary'
                  }`}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Customer Instructions */}
      {invoice.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes & Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment History Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Payment Transactions</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {invoice.payments?.length || 0} recorded
            </Badge>
          </div>
          <CardDescription>
            Recorded settlements and payment ledger for this invoice (Module M6).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-sm">
                    No payments have been recorded for this invoice yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium capitalize">
                      {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <DateText date={payment.payment_date} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payment.recorded_by?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600">
                      <MoneyText amount={payment.amount} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Invoice Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirm Invoice"
        description={`Confirm invoice ${invoice.number}? Status will transition to Confirmed (or Paid if balance is zero), locking lines and enabling sending and payment operations.`}
        confirmText={isSubmitting ? 'Confirming...' : 'Confirm Invoice'}
        variant="default"
        onConfirm={handleConfirm}
      />

      {/* Send Email Dialog */}
      <ConfirmDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Invoice to Customer"
        description={`Dispatch invoice ${invoice.number} via email to ${invoice.customer?.email}?`}
        confirmText={isSubmitting ? 'Sending...' : 'Send Invoice'}
        variant="default"
        onConfirm={handleSend}
      />

      {/* Cancel Invoice Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Provide an optional reason for cancelling invoice {invoice.number}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cancel-reason-detail">Cancellation reason</Label>
            <Textarea
              id="cancel-reason-detail"
              placeholder="e.g. Terms adjusted, billing dispute, duplicate run..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={255}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Draft Invoice Dialog (INV-03) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Draft Invoice</DialogTitle>
              <DialogDescription>
                Update due date and notes for draft invoice {invoice.number}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, due_date: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-notes">Notes / Terms</Label>
                <Textarea
                  id="edit-notes"
                  rows={4}
                  maxLength={1000}
                  placeholder="Invoice notes, wire transfer instructions, etc."
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { CreditCard, CheckCircle2, AlertCircle, Search } from 'lucide-react'

import { recordPayment } from '@/api/payments'
import { getInvoices } from '@/api/invoices'
import { MoneyText } from '@/components/common/MoneyText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice: initialInvoice = null,
  onSuccess,
}) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // If initial invoice is not passed, manage invoice selection
  const [selectedInvoice, setSelectedInvoice] = useState(initialInvoice)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [confirmedInvoices, setConfirmedInvoices] = useState([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

  // Form State
  const [method, setMethod] = useState(PAYMENT_METHODS.UPI)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Sync initial invoice
  useEffect(() => {
    if (initialInvoice) {
      setSelectedInvoice(initialInvoice)
      setAmount(initialInvoice.amount_due ? String(initialInvoice.amount_due) : '')
    } else {
      setSelectedInvoice(null)
      setAmount('')
    }
    setMethod(PAYMENT_METHODS.UPI)
    setPaymentDate(todayStr)
    setReference('')
    setNote('')
    setErrorMsg('')
  }, [initialInvoice, open, todayStr])

  // Search confirmed invoices if not provided
  const fetchConfirmedInvoices = useCallback(async (query = '') => {
    setIsLoadingInvoices(true)
    try {
      const res = await getInvoices({
        status: 'confirmed',
        search: query,
        per_page: 20,
      })
      setConfirmedInvoices(res.data || [])
    } catch {
      // Fallback
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [])

  useEffect(() => {
    if (open && !initialInvoice) {
      fetchConfirmedInvoices(invoiceSearch)
    }
  }, [open, initialInvoice, invoiceSearch, fetchConfirmedInvoices])

  const handleSelectInvoice = (invId) => {
    const inv = confirmedInvoices.find((i) => String(i.id) === String(invId))
    if (inv) {
      setSelectedInvoice(inv)
      setAmount(inv.amount_due ? String(inv.amount_due) : '')
      setErrorMsg('')
    }
  }

  const handlePayFullDue = () => {
    if (selectedInvoice?.amount_due) {
      setAmount(String(selectedInvoice.amount_due))
      setErrorMsg('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!selectedInvoice?.id) {
      setErrorMsg('Please select a confirmed invoice.')
      return
    }

    const numAmount = Number(amount)
    const maxDue = Number(selectedInvoice.amount_due || 0)

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Payment amount must be greater than 0.')
      return
    }

    if (numAmount > maxDue) {
      setErrorMsg(`Amount cannot exceed the total outstanding due of ${maxDue.toFixed(2)} INR.`)
      return
    }

    if (paymentDate > todayStr) {
      setErrorMsg('Payment date cannot be in the future.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        method,
        amount: numAmount.toFixed(2),
        payment_date: paymentDate,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      }

      const res = await recordPayment(payload)
      const data = res.data || {}
      toast.success(
        `Payment of ${numAmount.toFixed(2)} INR recorded for ${selectedInvoice.number}`
      )
      onSuccess?.(data)
      onOpenChange(false)
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to record payment')
      setErrorMsg(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <DialogTitle>Record Payment</DialogTitle>
            </div>
            <DialogDescription>
              Record an incoming settlement against a confirmed invoice (PAY-02).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Invoice Selection or Display */}
            <div className="space-y-1.5">
              <Label htmlFor="invoice-selection" className="text-xs font-semibold uppercase font-mono">
                Target Invoice <span className="text-destructive">*</span>
              </Label>
              {initialInvoice ? (
                <div className="rounded-lg border bg-muted/40 p-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono font-bold text-primary">{initialInvoice.number}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({initialInvoice.customer?.name})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Amount Due:</span>
                    <MoneyText
                      amount={initialInvoice.amount_due}
                      className="font-mono font-bold text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedInvoice ? String(selectedInvoice.id) : ''}
                    onValueChange={handleSelectInvoice}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select confirmed invoice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {confirmedInvoices.length === 0 ? (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          {isLoadingInvoices ? 'Loading...' : 'No confirmed invoices available'}
                        </div>
                      ) : (
                        confirmedInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            <div className="flex items-center justify-between w-full gap-4 text-xs">
                              <span className="font-mono font-bold">{inv.number}</span>
                              <span className="text-muted-foreground">{inv.customer?.name}</span>
                              <span className="font-mono font-semibold text-primary">
                                Due: {inv.amount_due} INR
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedInvoice && (
                    <div className="flex justify-between items-center text-xs px-1 text-muted-foreground">
                      <span>Total Amount: {selectedInvoice.total} INR</span>
                      <span className="font-semibold text-foreground">
                        Outstanding: {selectedInvoice.amount_due} INR
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="payment-method" className="text-xs font-semibold uppercase font-mono">
                  Method <span className="text-destructive">*</span>
                </Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="payment-method" className="h-9">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {PAYMENT_METHOD_LABELS[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="payment-amount" className="text-xs font-semibold uppercase font-mono">
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  {selectedInvoice && Number(selectedInvoice.amount_due || 0) > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFullDue}
                      className="text-[11px] text-primary hover:underline font-mono"
                    >
                      Pay Full Due
                    </button>
                  )}
                </div>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrorMsg('')
                  }}
                  className="h-9 font-mono font-semibold"
                  required
                />
              </div>
            </div>

            {/* Payment Date & Reference */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="payment-date" className="text-xs font-semibold uppercase font-mono">
                  Payment Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  max={todayStr}
                  value={paymentDate}
                  onChange={(e) => {
                    setPaymentDate(e.target.value)
                    setErrorMsg('')
                  }}
                  className="h-9 font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-ref" className="text-xs font-semibold uppercase font-mono">
                  Reference #
                </Label>
                <Input
                  id="payment-ref"
                  type="text"
                  placeholder="e.g. UPI-129482, CHQ-4820"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={100}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-note" className="text-xs font-semibold uppercase font-mono">
                Notes / Remarks
              </Label>
              <Textarea
                id="payment-note"
                placeholder="Optional payment notes or settlement remarks..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="text-xs"
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                {note.length} / 500
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedInvoice}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

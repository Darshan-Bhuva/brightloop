import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  RefreshCw,
  Calendar,
  Layers,
  AlertTriangle,
  Check,
  FileText,
} from 'lucide-react'
import {
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
  renewSubscription,
} from '@/api/subscriptions'
import { useConfirmSubscription } from '@/hooks/useSubscriptions'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyText } from '@/components/common/MoneyText'
import { DateText } from '@/components/common/DateText'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const LIFECYCLE_STEPS = ['draft', 'quotation', 'confirmed', 'active', 'closed']

export default function PortalSubscriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Dialogs for customer self-serve actions
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getSubscription(id)
      setSubscription(res.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Customer acceptance mutation hook
  const confirmMutation = useConfirmSubscription({
    onSuccess: (res) => {
      setSubscription(res.data)
      setIsAcceptDialogOpen(false)
      toast.success('Quotation accepted')
      fetchSubscription()
    },
    onError: (err) => {
      handleApiError(err)
      setIsAcceptDialogOpen(false)
      fetchSubscription()
    },
  })

  // Customer permitted actions: confirm, pause, resume, close, renew
  const handleAcceptQuotation = async () => {
    setIsActionLoading(true)
    try {
      await confirmMutation.mutateAsync(id)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePause = async () => {
    setIsActionLoading(true)
    try {
      const res = await pauseSubscription(id)
      setSubscription(res.data)
      toast.warning('Subscription paused successfully')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleResume = async () => {
    setIsActionLoading(true)
    try {
      const res = await resumeSubscription(id)
      setSubscription(res.data)
      toast.success('Subscription resumed')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCloseSubmit = async () => {
    setIsActionLoading(true)
    try {
      const res = await closeSubscription(id, { reason: closeReason.trim() || undefined })
      setSubscription(res.data)
      setIsCloseDialogOpen(false)
      setCloseReason('')
      toast.success('Subscription has been closed')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRenewSubmit = async () => {
    if (!newExpiryDate) {
      toast.error('Please select a new expiry date')
      return
    }
    if (subscription && newExpiryDate <= subscription.expiry_date) {
      toast.error('New expiry date must be after current expiry date')
      return
    }

    setIsActionLoading(true)
    try {
      const res = await renewSubscription(id, { new_expiry_date: newExpiryDate })
      setSubscription(res.data)
      setIsRenewDialogOpen(false)
      setNewExpiryDate('')
      toast.success('Subscription renewed successfully')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading subscription details...</span>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-xl font-heading font-semibold text-black">Subscription Not Found</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/portal/subscriptions')}
          className="rounded-sm border-border mt-2"
        >
          Back to Subscriptions
        </Button>
      </div>
    )
  }

  const allowed = subscription.allowed_actions || []
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(subscription.status)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Customer Self-Serve Actions */}
      <div className="flex flex-col gap-4 pb-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal/subscriptions')}
              className="rounded-sm border-border text-zinc-600 hover:text-black h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-mono font-bold text-black tracking-tight">
                  {subscription.number}
                </h1>
                <StatusBadge status={subscription.status} />
                {subscription.is_paused && (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono uppercase font-bold tracking-wider">
                    PAUSED
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Plan: <span className="font-semibold text-black">{subscription.plan?.name}</span> ({subscription.plan?.billing_period})
              </p>
            </div>
          </div>

          {/* Customer Self-Serve Actions (strictly from allowed_actions) */}
          <div className="flex items-center flex-wrap gap-2">
            {allowed.includes('confirm') && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAcceptDialogOpen(true)}
                disabled={isActionLoading}
                className="rounded-sm bg-primary text-white hover:bg-primary/90 h-8 text-xs font-semibold shadow-sm gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Accept Quotation
              </Button>
            )}

            {allowed.includes('pause') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={isActionLoading}
                className="rounded-sm border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 h-8 text-xs font-medium"
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause Service
              </Button>
            )}

            {allowed.includes('resume') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={isActionLoading}
                className="rounded-sm border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 h-8 text-xs font-medium"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Resume Service
              </Button>
            )}

            {allowed.includes('renew') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextExp = new Date(subscription.expiry_date)
                  nextExp.setFullYear(nextExp.getFullYear() + 1)
                  setNewExpiryDate(nextExp.toISOString().split('T')[0])
                  setIsRenewDialogOpen(true)
                }}
                disabled={isActionLoading}
                className="rounded-sm border-border text-black hover:bg-zinc-100 h-8 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Request Renewal
              </Button>
            )}

            {allowed.includes('close') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseDialogOpen(true)}
                disabled={isActionLoading}
                className="rounded-sm border-border text-zinc-700 hover:text-primary hover:border-primary/40 h-8 text-xs font-medium"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel Contract
              </Button>
            )}
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="pt-2">
          <div className="grid grid-cols-5 gap-2 text-center">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex
              const isClosed = subscription.status === 'closed' && step === 'closed'

              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      isClosed
                        ? 'bg-zinc-700'
                        : isCurrent
                        ? 'bg-primary'
                        : isPast
                        ? 'bg-black'
                        : 'bg-zinc-200'
                    }`}
                  />
                  <div className="flex items-center gap-1 mt-2">
                    {isPast && <Check className="h-3 w-3 text-black" />}
                    <span
                      className={`text-[11px] font-mono uppercase ${
                        isCurrent
                          ? 'font-bold text-primary'
                          : isPast
                          ? 'font-medium text-black'
                          : 'text-zinc-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quotation Notice Banner */}
      {(subscription.status === 'quotation' || allowed.includes('confirm')) && (
        <Card className="rounded-md border-amber-300 bg-amber-50/50 shadow-none">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-black">
                    Official Quotation Proposal
                  </h3>
                  {subscription.quotation_valid_until && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900 font-mono text-[11px]">
                      Valid until <DateText date={subscription.quotation_valid_until} format="dd MMM yyyy" className="font-semibold ml-1" />
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-600">
                  Please review the proposed plan fee and line items below. Quotation rate is{' '}
                  <MoneyText amount={subscription.total} className="font-bold text-black" /> per{' '}
                  <span className="font-medium text-black">{subscription.plan?.billing_period}</span>.
                </p>
              </div>
            </div>
            {allowed.includes('confirm') && (
              <Button
                type="button"
                onClick={() => setIsAcceptDialogOpen(true)}
                disabled={isActionLoading}
                className="rounded-sm bg-primary text-white hover:bg-primary/90 text-xs font-semibold px-4 h-9 shadow-sm shrink-0 gap-1.5"
              >
                <Check className="h-4 w-4" />
                Accept Quotation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Closed Notice Banner */}
      {subscription.status === 'closed' && (
        <div className="p-3.5 rounded-sm border border-zinc-300 bg-zinc-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
            <span className="font-semibold text-black">Subscription Closed:</span>
            <span className="text-zinc-600">
              Closed on {formatDateTime(subscription.closed_at)}
              {subscription.close_reason ? ` • Reason: "${subscription.close_reason}"` : ''}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-white border border-zinc-200 px-2 py-0.5 rounded-sm">
            TERMINATED
          </span>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Configuration Card */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Service Package</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">{subscription.plan?.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-50">
                {subscription.plan?.billing_period}
              </Badge>
            </div>
            <div className="text-zinc-600 flex items-center justify-between">
              <span>Recurring Price:</span>
              <MoneyText amount={subscription.plan?.price} className="font-semibold text-black" />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Invoicing Card */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Contract Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Start Date:</span>
              <DateText date={subscription.start_date} className="font-mono text-black" />
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Expiry Date:</span>
              <DateText date={subscription.expiry_date} className="font-mono text-black" />
            </div>
            {subscription.quotation_valid_until && (
              <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-border">
                <span>Quotation Valid Until:</span>
                <span className="font-mono text-black font-semibold">
                  Valid until <DateText date={subscription.quotation_valid_until} format="dd MMM yyyy" className="font-semibold" />
                </span>
              </div>
            )}
            {subscription.status === 'active' && (
              <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-border">
                <span>Next Billing Cycle:</span>
                <span className="font-mono font-semibold text-black">
                  {subscription.next_invoice_date ? <DateText date={subscription.next_invoice_date} /> : '-'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Lines Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
            Included Services & Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-24">Type</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Description</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-center w-24">Quantity</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-32">Rate</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-36">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subscription.lines || []).map((line) => (
                <TableRow key={line.id} className="border-b border-border">
                  <TableCell>
                    {line.line_type === 'plan' ? (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-mono uppercase">
                        Plan Fee
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-mono uppercase">
                        Product
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-black">
                    <div className="flex flex-col">
                      <span>{line.description}</span>
                      {line.variant_label && (
                        <span className="text-[10px] text-zinc-400 font-mono">{line.variant_label}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-zinc-700">
                    {line.quantity}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-700 text-right">
                    <MoneyText amount={line.unit_price} className="text-xs text-zinc-700" />
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-black text-right">
                    <MoneyText amount={line.total} className="text-xs font-semibold text-black" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals Summary */}
          <div className="p-4 border-t border-border bg-zinc-50/30 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Subtotal</span>
                <MoneyText amount={subscription.subtotal} className="font-mono font-medium text-black" />
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Tax Total</span>
                <MoneyText amount={subscription.tax_total} className="font-mono font-medium text-black" />
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between font-semibold text-black">
                <span>Total Periodic Rate</span>
                <MoneyText amount={subscription.total} className="text-lg text-primary font-bold" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Quotation Confirm Dialog */}
      <ConfirmDialog
        open={isAcceptDialogOpen}
        onOpenChange={setIsAcceptDialogOpen}
        title="Accept Quotation"
        description={`Accept this quotation for ${formatMoney(subscription.total)} per ${subscription.plan?.billing_period || 'period'}?`}
        confirmText="Accept Quotation"
        cancelText="Cancel"
        variant="primary"
        loading={isActionLoading}
        onConfirm={handleAcceptQuotation}
      />

      {/* Close Subscription Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-md border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-black">
              Cancel Subscription Contract
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Cancelling this contract will stop recurring service billing at the end of the current period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cust-close-reason" className="text-xs font-semibold uppercase font-mono text-zinc-700">
              Reason for Cancellation (Optional)
            </Label>
            <Input
              id="cust-close-reason"
              placeholder="e.g. Downsizing, no longer needed"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="rounded-sm border-border h-9 text-xs"
            />
          </div>
          <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCloseDialogOpen(false)}
              className="rounded-sm border-border text-zinc-700 h-9"
            >
              Back
            </Button>
            <Button
              onClick={handleCloseSubmit}
              disabled={isActionLoading}
              className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none"
            >
              {isActionLoading ? 'Processing...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Subscription Dialog */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-md border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-black">
              Renew Subscription
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Select a date to extend your contract coverage beyond {formatDate(subscription.expiry_date)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cust-renew-expiry" className="text-xs font-semibold uppercase font-mono text-zinc-700">
              Requested Expiry Date <span className="text-primary">*</span>
            </Label>
            <Input
              id="cust-renew-expiry"
              type="date"
              min={subscription.expiry_date}
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="rounded-sm border-border h-9 text-xs font-mono"
            />
          </div>
          <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRenewDialogOpen(false)}
              className="rounded-sm border-border text-zinc-700 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenewSubmit}
              disabled={isActionLoading || !newExpiryDate}
              className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none"
            >
              {isActionLoading ? 'Renewing...' : 'Submit Renewal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

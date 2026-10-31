import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Tag,
  RefreshCw,
  Calendar,
  Building,
  User,
  Layers,
  AlertTriangle,
  Receipt,
  Check,
  Plus,
} from 'lucide-react'
import {
  getSubscription,
  deleteSubscription,
  sendQuotation,
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
  renewSubscription,
  attachDiscount,
  detachDiscount,
} from '@/api/subscriptions'
import { getDiscounts } from '@/api/catalog'
import { handleApiError } from '@/lib/errors'
import { formatMoney, formatDate, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/common/StatusBadge'
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'

const LIFECYCLE_STEPS = ['draft', 'quotation', 'confirmed', 'active', 'closed']

export default function SubscriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Action Dialog States
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [selectedDiscountId, setSelectedDiscountId] = useState('')
  const [availableDiscounts, setAvailableDiscounts] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch Subscription
  const fetchSubscriptionDetails = useCallback(async () => {
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
    fetchSubscriptionDetails()
  }, [fetchSubscriptionDetails])

  // Load available discounts for attaching
  const loadAvailableDiscounts = async () => {
    try {
      const res = await getDiscounts({ all: 1 })
      // Eligible discounts: applies_to=subscription and state=active
      const filtered = (res.data || []).filter(
        (d) => d.applies_to === 'subscription' && (d.state === 'active' || d.is_active)
      )
      setAvailableDiscounts(filtered)
      if (filtered.length > 0) {
        setSelectedDiscountId(String(filtered[0].id))
      }
    } catch (err) {
      console.error('Failed to load discounts', err)
    }
  }

  // Action Handlers
  const handleSendQuotation = async () => {
    setIsActionLoading(true)
    try {
      const res = await sendQuotation(id)
      setSubscription(res.data)
      toast.success('Quotation sent to customer successfully')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    setIsActionLoading(true)
    try {
      const res = await confirmSubscription(id)
      setSubscription(res.data)
      toast.success('Subscription quotation confirmed')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleActivate = async () => {
    setIsActionLoading(true)
    try {
      const res = await activateSubscription(id)
      setSubscription(res.data)
      toast.success('Subscription activated and ready for billing')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePause = async () => {
    setIsActionLoading(true)
    try {
      const res = await pauseSubscription(id)
      setSubscription(res.data)
      toast.warning('Subscription paused')
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
      toast.success('Subscription successfully renewed')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsActionLoading(true)
    try {
      await deleteSubscription(id)
      toast.success(`Draft subscription ${subscription?.number} deleted`)
      navigate('/subscriptions')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleAttachDiscountSubmit = async () => {
    if (!selectedDiscountId) {
      toast.error('Please choose a discount to attach')
      return
    }

    setIsActionLoading(true)
    try {
      const res = await attachDiscount(id, { discount_id: Number(selectedDiscountId) })
      setSubscription(res.data)
      setIsDiscountDialogOpen(false)
      toast.success('Discount attached to subscription')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDetachDiscount = async (discountId) => {
    setIsActionLoading(true)
    try {
      const res = await detachDiscount(id, discountId)
      setSubscription(res.data)
      toast.success('Discount removed from subscription')
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
        <p className="text-xs text-zinc-500">The requested subscription does not exist or has been removed.</p>
        <Link to="/subscriptions">
          <Button size="sm" variant="outline" className="rounded-sm border-border mt-2">
            Back to Subscriptions
          </Button>
        </Link>
      </div>
    )
  }

  // Allowed actions array returned directly by API per BR-4
  const allowed = subscription.allowed_actions || []

  // Stepper calculations
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(subscription.status)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Navigation & Status Stepper */}
      <div className="flex flex-col gap-4 pb-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/subscriptions')}
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
                Customer: <span className="font-semibold text-black">{subscription.customer?.name}</span> • Created on {formatDate(subscription.created_at)}
              </p>
            </div>
          </div>

          {/* Action Buttons Rendered Strictly from allowed_actions */}
          <div className="flex items-center flex-wrap gap-2">
            {allowed.includes('edit') && (
              <Link to={`/subscriptions/${id}/edit`}>
                <Button variant="outline" size="sm" className="rounded-sm border-border h-8 text-xs">
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>
            )}

            {allowed.includes('send_quotation') && (
              <Button
                size="sm"
                onClick={handleSendQuotation}
                disabled={isActionLoading}
                className="rounded-sm bg-primary text-white hover:bg-primary/95 h-8 text-xs font-medium shadow-none"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send Quotation
              </Button>
            )}

            {allowed.includes('confirm') && (
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isActionLoading}
                className="rounded-sm bg-black text-white hover:bg-zinc-800 h-8 text-xs font-medium shadow-none"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                Confirm Subscription
              </Button>
            )}

            {allowed.includes('activate') && (
              <Button
                size="sm"
                onClick={handleActivate}
                disabled={isActionLoading}
                className="rounded-sm bg-primary text-white hover:bg-primary/95 h-8 text-xs font-medium shadow-none"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Activate
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
                Pause
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
                Resume
              </Button>
            )}

            {allowed.includes('renew') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Pre-set new expiry date as current + 1 year
                  const nextExp = new Date(subscription.expiry_date)
                  nextExp.setFullYear(nextExp.getFullYear() + 1)
                  setNewExpiryDate(nextExp.toISOString().split('T')[0])
                  setIsRenewDialogOpen(true)
                }}
                disabled={isActionLoading}
                className="rounded-sm border-border text-black hover:bg-zinc-100 h-8 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Renew
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
                Close
              </Button>
            )}

            {allowed.includes('delete') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isActionLoading}
                className="rounded-sm text-zinc-400 hover:text-primary hover:bg-rose-50 h-8 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Draft
              </Button>
            )}

            {allowed.includes('add_discount') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadAvailableDiscounts()
                  setIsDiscountDialogOpen(true)
                }}
                className="rounded-sm border-border text-zinc-700 hover:text-black h-8 text-xs"
              >
                <Tag className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                Attach Discount
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

      {/* Closed Notice Banner */}
      {subscription.status === 'closed' && (
        <div className="p-3.5 rounded-sm border border-zinc-300 bg-zinc-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-zinc-600 shrink-0" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Partner Card */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              <span>Customer</span>
            </CardTitle>
            <Link
              to={`/customers/${subscription.customer.id}`}
              className="text-[11px] text-zinc-500 hover:text-black hover:underline"
            >
              View Profile
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="font-semibold text-sm text-black">{subscription.customer?.name}</div>
            {subscription.customer?.company_name && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <Building className="h-3.5 w-3.5 text-zinc-400" />
                <span>{subscription.customer.company_name}</span>
              </div>
            )}
            <div className="text-zinc-500 font-mono text-[11px]">{subscription.customer?.email}</div>
            {subscription.customer?.phone && (
              <div className="text-zinc-500 text-[11px]">{subscription.customer.phone}</div>
            )}
          </CardContent>
        </Card>

        {/* Plan Configuration Card */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Plan Rules</span>
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
              <span className="font-mono font-semibold text-black">{formatMoney(subscription.plan?.price)}</span>
            </div>
            <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px] bg-zinc-50 text-zinc-600">
                Pausable: {subscription.plan?.pausable ? 'Yes' : 'No'}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-zinc-50 text-zinc-600">
                Closable: {subscription.plan?.closable ? 'Yes' : 'No'}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-zinc-50 text-zinc-600">
                Renewable: {subscription.plan?.renewable ? 'Yes' : 'No'}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-zinc-50 text-zinc-600">
                Auto-close: {subscription.plan?.auto_close ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contract Schedule Card */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Schedule & Billing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Payment Terms:</span>
              <span className="font-medium text-black">
                {subscription.payment_term?.name} (Due in {subscription.payment_term?.due_days}d)
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Start Date:</span>
              <span className="font-mono text-black">{formatDate(subscription.start_date)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Expiry Date:</span>
              <span className="font-mono text-black">{formatDate(subscription.expiry_date)}</span>
            </div>
            {subscription.quotation_valid_until && (
              <div className="flex items-center justify-between text-zinc-600">
                <span>Quotation Valid Until:</span>
                <span className="font-mono text-primary font-medium">
                  {formatDate(subscription.quotation_valid_until)}
                </span>
              </div>
            )}
            {subscription.status === 'active' && (
              <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-border">
                <span>Next Invoice Date:</span>
                <span className="font-mono font-semibold text-black">
                  {subscription.next_invoice_date ? formatDate(subscription.next_invoice_date) : '-'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Internal Notes */}
      {subscription.notes && (
        <Card className="rounded-md border border-border bg-zinc-50/50 shadow-none">
          <CardContent className="p-3 text-xs flex items-start gap-2">
            <span className="font-semibold font-mono text-zinc-600 uppercase text-[10px]">Notes:</span>
            <span className="text-zinc-700">{subscription.notes}</span>
          </CardContent>
        </Card>
      )}

      {/* Subscription Lines Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
            Subscription Contract Lines
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-24">Type</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Description</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-center w-24">Quantity</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-32">Unit Price</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-28">Amount</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right w-32">Tax</TableHead>
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
                    {formatMoney(line.unit_price)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-black text-right">
                    {formatMoney(line.amount)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-600 text-right">
                    {formatMoney(line.tax_amount)}{' '}
                    <span className="text-[10px] text-zinc-400">({line.tax_rate}%)</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-black text-right">
                    {formatMoney(line.total)}
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
                <span className="font-mono font-medium text-black">{formatMoney(subscription.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Tax Total</span>
                <span className="font-mono font-medium text-black">{formatMoney(subscription.tax_total)}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between font-semibold text-black">
                <span>Total Contract Value</span>
                <span className="font-mono text-lg text-primary">{formatMoney(subscription.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attached Discounts Section */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
              Attached Subscription Discounts
            </CardTitle>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Subscription-level discounts (BR-6) evaluated and applied during recurring invoice generation.
            </p>
          </div>
          {allowed.includes('add_discount') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadAvailableDiscounts()
                setIsDiscountDialogOpen(true)
              }}
              className="rounded-sm border-border text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Attach Discount
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {!subscription.discounts || subscription.discounts.length === 0 ? (
            <div className="text-center py-4 text-xs text-zinc-400 italic">
              No discounts attached to this subscription.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subscription.discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="p-3 rounded-sm border border-border bg-zinc-50/50 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-black">{discount.name}</div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {discount.type === 'percentage' ? `${discount.value}% off` : formatMoney(discount.value)}
                    </div>
                  </div>
                  {allowed.includes('add_discount') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDetachDiscount(discount.id)}
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-primary hover:bg-rose-50 rounded-sm"
                      title="Detach discount"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Invoices Section */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600 flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-zinc-400" />
            <span>Generated Invoices</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EmptyState
            icon={Receipt}
            title="No invoices generated yet"
            description="Recurring invoices for this subscription will appear here once billing runs are executed (Module M5)."
          />
        </CardContent>
      </Card>

      {/* Close Subscription Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-md border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-black">
              Close Subscription
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Closing this subscription stops future invoice generation. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="close-reason" className="text-xs font-semibold uppercase font-mono text-zinc-700">
              Reason for Closing (Optional)
            </Label>
            <Input
              id="close-reason"
              placeholder="e.g. Customer cancelled service, non-renewal"
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
              Cancel
            </Button>
            <Button
              onClick={handleCloseSubmit}
              disabled={isActionLoading}
              className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none"
            >
              {isActionLoading ? 'Closing...' : 'Confirm Close'}
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
              Extend contract validity. The new expiry date must be strictly after {formatDate(subscription.expiry_date)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="renew-expiry" className="text-xs font-semibold uppercase font-mono text-zinc-700">
              New Expiry Date <span className="text-primary">*</span>
            </Label>
            <Input
              id="renew-expiry"
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
              {isActionLoading ? 'Renewing...' : 'Renew Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-md border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-black">
              Attach Discount
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Select an active subscription-level discount to attach to this recurring contract.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="discount-select" className="text-xs font-semibold uppercase font-mono text-zinc-700">
              Available Discounts <span className="text-primary">*</span>
            </Label>
            {availableDiscounts.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No eligible subscription discounts found.</p>
            ) : (
              <select
                id="discount-select"
                value={selectedDiscountId}
                onChange={(e) => setSelectedDiscountId(e.target.value)}
                className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              >
                {availableDiscounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === 'percentage' ? `${d.value}%` : formatMoney(d.value)})
                  </option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscountDialogOpen(false)}
              className="rounded-sm border-border text-zinc-700 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttachDiscountSubmit}
              disabled={isActionLoading || !selectedDiscountId}
              className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none"
            >
              {isActionLoading ? 'Attaching...' : 'Attach Discount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Draft Subscription"
        description={`Are you sure you want to delete ${subscription.number}? This will permanently discard this draft proposal.`}
        confirmText={isActionLoading ? 'Deleting...' : 'Delete Draft'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

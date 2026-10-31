import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Sparkles,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import {
  createSubscription,
  getSubscription,
  updateSubscription,
} from '@/api/subscriptions'
import { getQuotationTemplates, getQuotationTemplate } from '@/api/quotations'
import { getCustomers } from '@/api/customers'
import { getPlans, getProducts, getPaymentTerms } from '@/api/catalog'
import { subscriptionSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

export default function SubscriptionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  // Dependencies
  const [customers, setCustomers] = useState([])
  const [plans, setPlans] = useState([])
  const [products, setProducts] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [quotationTemplates, setQuotationTemplates] = useState([])

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(null)

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      customer_id: '',
      plan_id: '',
      quotation_template_id: '',
      payment_term_id: '',
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: '',
      lines: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lines',
  })

  // Watch key values for real-time calculation
  const watchedPlanId = watch('plan_id')
  const watchedTemplateId = watch('quotation_template_id')
  const watchedLines = watch('lines') || []
  const watchedStartDate = watch('start_date')

  // Find currently selected plan object
  const selectedPlan = useMemo(() => {
    return plans.find((p) => String(p.id) === String(watchedPlanId)) || null
  }, [plans, watchedPlanId])

  // Extract lines error message from react-hook-form
  const lineErrorMessage = useMemo(() => {
    return (
      errors.lines?.message ||
      errors.lines?.root?.message ||
      (errors.lines && typeof errors.lines === 'object' && !Array.isArray(errors.lines) && errors.lines.message
        ? errors.lines.message
        : null)
    )
  }, [errors.lines])

  // Extract all errors for summary banner
  const allErrorsList = useMemo(() => {
    const list = []
    if (errors.customer_id?.message) list.push(errors.customer_id.message)
    if (errors.plan_id?.message) list.push(errors.plan_id.message)
    if (errors.payment_term_id?.message) list.push(errors.payment_term_id.message)
    if (errors.start_date?.message) list.push(errors.start_date.message)
    if (errors.expiry_date?.message) list.push(errors.expiry_date.message)
    if (lineErrorMessage) list.push(lineErrorMessage)
    if (errors.root?.message) list.push(errors.root.message)
    return [...new Set(list)]
  }, [errors, lineErrorMessage])

  // Load Dependencies and Subscription (if edit)
  const loadFormData = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const [custRes, planRes, prodRes, termsRes, tplRes] = await Promise.all([
        getCustomers({ all: 1 }),
        getPlans({ all: 1 }),
        getProducts({ all: 1 }),
        getPaymentTerms({ all: 1 }),
        getQuotationTemplates({ all: 1 }),
      ])

      setCustomers(custRes.data || [])
      setPlans(planRes.data || [])
      setProducts(prodRes.data || [])
      setPaymentTerms(termsRes.data || [])
      setQuotationTemplates(tplRes.data || [])

      if (isEdit) {
        const subRes = await getSubscription(id)
        const sub = subRes.data
        setCurrentSubscription(sub)

        // Check if editable per BR-4: only draft or quotation
        if (!['draft', 'quotation'].includes(sub.status)) {
          toast.error(`Subscription ${sub.number} cannot be edited because it is ${sub.status}.`)
          navigate(`/subscriptions/${id}`)
          return
        }

        setValue('customer_id', String(sub.customer.id))
        setValue('plan_id', String(sub.plan.id))
        setValue('quotation_template_id', sub.quotation_template_id ? String(sub.quotation_template_id) : '')
        setValue('payment_term_id', String(sub.payment_term.id))
        setValue('start_date', sub.start_date)
        setValue('expiry_date', sub.expiry_date)
        setValue('notes', sub.notes || '')

        // Populate product lines (filter out the server plan fee line)
        const productLines = (sub.lines || [])
          .filter((l) => l.line_type === 'product' && l.product_id)
          .map((l) => ({
            product_id: String(l.product_id),
            variant_id: l.variant_id ? String(l.variant_id) : '',
            quantity: Number(l.quantity) || 1,
          }))

        replace(productLines)
      } else {
        // Defaults for New Subscription
        if (termsRes.data?.length > 0) {
          setValue('payment_term_id', String(termsRes.data[0].id))
        }
        if (planRes.data?.length > 0) {
          const defaultPlan = planRes.data[0]
          setValue('plan_id', String(defaultPlan.id))
          // Default expiry 1 year out
          const exp = new Date()
          exp.setFullYear(exp.getFullYear() + 1)
          setValue('expiry_date', exp.toISOString().split('T')[0])
        }
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoadingData(false)
    }
  }, [id, isEdit, navigate, setValue, replace])

  useEffect(() => {
    loadFormData()
  }, [loadFormData])

  // Handle "Start from template" selection
  const handleTemplateSelect = async (e) => {
    const tplId = e.target.value
    setValue('quotation_template_id', tplId)

    if (!tplId) return

    try {
      const res = await getQuotationTemplate(tplId)
      const tpl = res.data
      if (tpl) {
        // Set Plan
        if (tpl.plan_id) {
          setValue('plan_id', String(tpl.plan_id))
        }
        // Set Expiry Date based on template validity_days
        if (tpl.validity_days && watchedStartDate) {
          const startDate = new Date(watchedStartDate)
          startDate.setDate(startDate.getDate() + (tpl.validity_days || 30))
          setValue('expiry_date', startDate.toISOString().split('T')[0])
        }
        // Replace product lines from template
        if (tpl.lines && tpl.lines.length > 0) {
          const newLines = tpl.lines.map((l) => ({
            product_id: String(l.product_id),
            variant_id: l.variant_id ? String(l.variant_id) : '',
            quantity: Number(l.quantity) || 1,
          }))
          replace(newLines)
          toast.info(`Prefilled plan and ${newLines.length} product lines from "${tpl.name}"`)
        }
      }
    } catch (err) {
      handleApiError(err)
    }
  }

  // Calculate Live Estimated Totals (BR-1, BR-2, BR-3)
  const calculationSummary = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0

    // 1. Plan fee line (BR-2)
    let planFeeAmount = 0
    let planFeeTax = 0
    if (selectedPlan) {
      planFeeAmount = parseFloat(selectedPlan.price) || 0
      const planTaxRate = parseFloat(selectedPlan.tax?.rate || 18)
      planFeeTax = (planFeeAmount * planTaxRate) / 100

      subtotal += planFeeAmount
      taxTotal += planFeeTax
    }

    // 2. Product lines (BR-1, BR-3)
    const productLineCalculations = watchedLines.map((line) => {
      const prod = products.find((p) => String(p.id) === String(line.product_id))
      if (!prod) {
        return { unitPrice: 0, amount: 0, taxAmount: 0, lineTotal: 0, taxRate: 0 }
      }

      const variant = prod.variants?.find((v) => String(v.id) === String(line.variant_id))
      const extraPrice = variant ? parseFloat(variant.extra_price) || 0 : 0
      const unitPrice = (parseFloat(prod.sales_price) || 0) + extraPrice
      const qty = Number(line.quantity) || 0
      const amount = unitPrice * qty
      const taxRate = parseFloat(prod.tax?.rate || 18)
      const taxAmount = (amount * taxRate) / 100
      const lineTotal = amount + taxAmount

      subtotal += amount
      taxTotal += taxAmount

      return {
        unitPrice,
        amount,
        taxAmount,
        lineTotal,
        taxRate,
      }
    })

    const total = subtotal + taxTotal

    return {
      planFeeAmount,
      planFeeTax,
      productLineCalculations,
      subtotal,
      taxTotal,
      total,
    }
  }, [selectedPlan, watchedLines, products])

  // Form Submission
  const onSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      // Check duplicate (product_id, variant_id) per PLAN.md SUB-02
      const lineKeys = new Set()
      for (const line of formData.lines || []) {
        const key = `${line.product_id}_${line.variant_id || 'null'}`
        if (lineKeys.has(key)) {
          toast.error('Duplicate product/variant lines are not permitted.')
          setIsSubmitting(false)
          return
        }
        lineKeys.add(key)
      }

      // Check min_quantity constraint per BR-2
      if (selectedPlan && selectedPlan.min_quantity > 1) {
        for (let i = 0; i < (formData.lines || []).length; i++) {
          const qty = Number(formData.lines[i].quantity)
          if (qty < selectedPlan.min_quantity) {
            setError(`lines.${i}.quantity`, {
              type: 'manual',
              message: `Minimum quantity for ${selectedPlan.name} is ${selectedPlan.min_quantity}`,
            })
            toast.error(`All product lines must have quantity >= ${selectedPlan.min_quantity} per plan rules.`)
            setIsSubmitting(false)
            return
          }
        }
      }

      const payload = {
        customer_id: Number(formData.customer_id),
        plan_id: Number(formData.plan_id),
        quotation_template_id: formData.quotation_template_id ? Number(formData.quotation_template_id) : null,
        payment_term_id: Number(formData.payment_term_id),
        start_date: formData.start_date,
        expiry_date: formData.expiry_date,
        notes: formData.notes ? formData.notes.trim() : null,
        lines: (formData.lines || []).map((l) => ({
          product_id: Number(l.product_id),
          variant_id: l.variant_id && l.variant_id !== '' ? Number(l.variant_id) : null,
          quantity: Number(l.quantity),
        })),
      }

      let res
      if (isEdit) {
        res = await updateSubscription(id, payload)
        toast.success(`Subscription ${res.data.number || currentSubscription?.number} updated successfully`)
      } else {
        res = await createSubscription(payload)
        toast.success(`Subscription ${res.data.number} created as Draft`)
      }

      navigate(`/subscriptions/${res.data.id}`)
    } catch (err) {
      handleApiError(err, setError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading subscription configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(isEdit ? `/subscriptions/${id}` : '/subscriptions')}
            className="rounded-sm border-border text-zinc-600 hover:text-black h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-black tracking-tight">
              {isEdit ? `Edit Subscription: ${currentSubscription?.number}` : 'New Subscription'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEdit
                ? 'Update customer lines, dates, and terms for this draft subscription.'
                : 'Configure a new recurring contract or prefill from a quotation template.'}
            </p>
          </div>
        </div>

        {isEdit && currentSubscription && (
          <Badge variant="outline" className="text-xs font-mono uppercase bg-zinc-50 border-zinc-200">
            Status: {currentSubscription.status}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Global Form Validation Error Banner */}
        {allErrorsList.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">Please correct the following errors:</p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                {allErrorsList.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Template Quick-Start Banner (Only for New) */}
        {!isEdit && quotationTemplates.length > 0 && (
          <Card className="rounded-md border border-zinc-200 bg-zinc-50/50 shadow-none">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold uppercase font-mono text-black">
                    Start from Quotation Template
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Instantly pre-populate standard plans and line bundles from an approved template.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={watchedTemplateId || ''}
                  onChange={handleTemplateSelect}
                  className="w-full h-8 rounded-sm border border-border bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Choose a Template (Optional)...</option>
                  {quotationTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.plan?.name})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 1: Customer & Contract Terms */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
              Contract Header & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Customer */}
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <Label htmlFor="sub-customer" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Customer Partner <span className="text-primary">*</span>
                </Label>
                <select
                  id="sub-customer"
                  {...register('customer_id')}
                  className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="text-xs text-primary mt-1">{errors.customer_id.message}</p>
                )}
              </div>

              {/* Plan */}
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <Label htmlFor="sub-plan" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Recurring Plan <span className="text-primary">*</span>
                </Label>
                <select
                  id="sub-plan"
                  {...register('plan_id')}
                  className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billing_period}) — {formatMoney(p.price)}
                    </option>
                  ))}
                </select>
                {errors.plan_id && (
                  <p className="text-xs text-primary mt-1">{errors.plan_id.message}</p>
                )}
              </div>

              {/* Payment Term */}
              <div className="space-y-1.5">
                <Label htmlFor="sub-terms" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Payment Term <span className="text-primary">*</span>
                </Label>
                <select
                  id="sub-terms"
                  {...register('payment_term_id')}
                  className="w-full h-9 rounded-sm border border-border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Term...</option>
                  {paymentTerms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Due: {t.due_days} days)
                    </option>
                  ))}
                </select>
                {errors.payment_term_id && (
                  <p className="text-xs text-primary mt-1">{errors.payment_term_id.message}</p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="sub-start" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Start Date <span className="text-primary">*</span>
                </Label>
                <Input
                  id="sub-start"
                  type="date"
                  {...register('start_date')}
                  className="rounded-sm border-border h-9 text-xs"
                />
                {errors.start_date && (
                  <p className="text-xs text-primary mt-1">{errors.start_date.message}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <Label htmlFor="sub-expiry" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Expiry Date <span className="text-primary">*</span>
                </Label>
                <Input
                  id="sub-expiry"
                  type="date"
                  {...register('expiry_date')}
                  className="rounded-sm border-border h-9 text-xs"
                />
                {errors.expiry_date && (
                  <p className="text-xs text-primary mt-1">{errors.expiry_date.message}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <Label htmlFor="sub-notes" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Internal Notes (Optional)
                </Label>
                <Input
                  id="sub-notes"
                  placeholder="Memo, special requirements..."
                  {...register('notes')}
                  className="rounded-sm border-border h-9 text-xs"
                />
              </div>
            </div>

            {/* Selected Plan Details Banner */}
            {selectedPlan && (
              <div className="p-3 bg-zinc-50 border border-border rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-zinc-400" />
                  <span className="font-semibold text-black">Plan Configuration:</span>
                  <span className="text-zinc-600">
                    {selectedPlan.name} ({selectedPlan.billing_period}) recurring fee of{' '}
                    <strong className="text-black font-mono">{formatMoney(selectedPlan.price)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Badge variant="outline" className="bg-white">
                    Min Qty: {selectedPlan.min_quantity}
                  </Badge>
                  {selectedPlan.pausable && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Pausable</Badge>}
                  {selectedPlan.closable && <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200">Closable</Badge>}
                  {selectedPlan.renewable && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Renewable</Badge>}
                  {selectedPlan.auto_close && <Badge className="bg-purple-50 text-purple-700 border-purple-200">Auto Close</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Subscription Lines & Products */}
        <Card className="rounded-md border border-border bg-white shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
                Subscription Line Items
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500 mt-0.5">
                Every subscription includes one auto-generated Plan Fee row plus optional add-on products.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  product_id: products[0]?.id ? String(products[0].id) : '',
                  variant_id: '',
                  quantity: selectedPlan ? Math.max(1, selectedPlan.min_quantity) : 1,
                })
              }
              className="rounded-sm border-border text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Product Line
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {lineErrorMessage && (
              <div className="mx-4 my-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-medium">{lineErrorMessage}</span>
              </div>
            )}
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-24">Type</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Item / Product</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-28">Quantity</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-32 text-right">Unit Price</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-24 text-right">Tax</TableHead>
                  <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 w-32 text-right">Amount</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. Read-only Plan Fee Line (BR-2) */}
                {selectedPlan && (
                  <TableRow className="bg-zinc-50/70 border-b border-border">
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-mono uppercase">
                        Plan Fee
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-black">
                      <div className="flex flex-col">
                        <span>Plan: {selectedPlan.name} ({selectedPlan.billing_period})</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Auto-generated base plan recurring fee</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-700">1</TableCell>
                    <TableCell className="text-xs font-mono text-black text-right">
                      {formatMoney(selectedPlan.price)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600 text-right">
                      {selectedPlan.tax?.rate || 18}%
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-black text-right">
                      {formatMoney(calculationSummary.planFeeAmount)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}

                {/* 2. Product Lines Repeater */}
                {fields.map((field, index) => {
                  const currentLine = watchedLines[index] || {}
                  const selectedProduct = products.find((p) => String(p.id) === String(currentLine.product_id))
                  const availableVariants = selectedProduct?.variants || []
                  const calc = calculationSummary.productLineCalculations[index] || {}

                  return (
                    <TableRow key={field.id} className="border-b border-border">
                      <TableCell>
                        <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-mono uppercase">
                          Product
                        </Badge>
                      </TableCell>

                      {/* Product & Variant Selector */}
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            {...register(`lines.${index}.product_id`)}
                            className="h-8 rounded-sm border border-border bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black flex-1"
                          >
                            <option value="">Select Product...</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} ({formatMoney(prod.sales_price)})
                              </option>
                            ))}
                          </select>

                          {availableVariants.length > 0 && (
                            <select
                              {...register(`lines.${index}.variant_id`)}
                              className="h-8 rounded-sm border border-border bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-black w-40"
                            >
                              <option value="">Standard (No Variant)</option>
                              {availableVariants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.attribute}: {v.value} (+{formatMoney(v.extra_price)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {errors.lines?.[index]?.product_id && (
                          <p className="text-[10px] text-primary mt-1">
                            {errors.lines[index].product_id.message}
                          </p>
                        )}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <Input
                          type="number"
                          min={selectedPlan ? selectedPlan.min_quantity : 1}
                          placeholder="Qty"
                          {...register(`lines.${index}.quantity`)}
                          className="h-8 rounded-sm border-border text-xs text-center font-mono"
                        />
                        {errors.lines?.[index]?.quantity && (
                          <p className="text-[10px] text-primary mt-1">
                            {errors.lines[index].quantity.message}
                          </p>
                        )}
                      </TableCell>

                      {/* Unit Price (Computed live per BR-1) */}
                      <TableCell className="text-xs font-mono text-zinc-700 text-right">
                        {formatMoney(calc.unitPrice || 0)}
                      </TableCell>

                      {/* Tax Rate */}
                      <TableCell className="text-xs font-mono text-zinc-600 text-right">
                        {calc.taxRate || 18}%
                      </TableCell>

                      {/* Line Amount */}
                      <TableCell className="text-xs font-mono font-semibold text-black text-right">
                        {formatMoney(calc.amount || 0)}
                      </TableCell>

                      {/* Delete Action */}
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-primary hover:bg-rose-50 rounded-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-zinc-400 text-xs italic">
                      {lineErrorMessage ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-rose-600 not-italic">
                          <div className="flex items-center gap-1.5 font-medium">
                            <AlertCircle className="h-4 w-4" />
                            <span>{lineErrorMessage}</span>
                          </div>
                          <span className="text-[11px] text-zinc-500">
                            Click &ldquo;Add Product Line&rdquo; above to attach at least one product.
                          </span>
                        </div>
                      ) : (
                        <span>No additional products added yet. Click &ldquo;Add Product Line&rdquo; to attach services or goods.</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 3: Live Estimation & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <div className="p-3 rounded-sm border border-border bg-zinc-50/50 flex items-start gap-2.5 text-xs text-zinc-600">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-black">Automatic Server Pricing & Rules:</span>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Unit prices and line amounts shown here are calculated live for estimation. When saved, the server will
                  snapshot product taxes, attach the recurring plan line, and generate the final contract totals.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <Card className="rounded-md border border-border bg-white shadow-none">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-mono font-semibold uppercase text-zinc-600">
                  Estimated Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-black">
                    {formatMoney(calculationSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Estimated Tax</span>
                  <span className="font-mono font-medium text-black">
                    {formatMoney(calculationSummary.taxTotal)}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between font-semibold text-black">
                  <span>Total Amount</span>
                  <span className="font-mono text-base text-primary">
                    {formatMoney(calculationSummary.total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/subscriptions/${id}` : '/subscriptions')}
            className="rounded-sm border-border text-zinc-700 h-9"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-6 h-9 shadow-none"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Subscription...</span>
              </div>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Subscription'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  FileText,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import {
  getQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
} from '@/api/quotations'
import { getPlans, getProducts } from '@/api/catalog'
import { quotationTemplateSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function QuotationTemplatesList() {
  const [templates, setTemplates] = useState([])
  const [plans, setPlans] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // React Hook Form for Create/Edit
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quotationTemplateSchema),
    defaultValues: {
      name: '',
      validity_days: 30,
      plan_id: '',
      notes: '',
      lines: [{ product_id: '', variant_id: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  const watchedLines = watch('lines') || []

  // Fetch dropdown dependencies
  useEffect(() => {
    async function loadDependencies() {
      try {
        const [plansRes, productsRes] = await Promise.all([
          getPlans({ all: 1 }),
          getProducts({ all: 1 }),
        ])
        setPlans(plansRes.data || [])
        setProducts(productsRes.data || [])
      } catch (err) {
        console.error('Failed to load plans or products', err)
      }
    }
    loadDependencies()
  }, [])

  // Fetch templates list
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getQuotationTemplates({ search, all: 1 })
      setTemplates(res.data || [])
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingTemplate(null)
    reset({
      name: '',
      validity_days: 30,
      plan_id: plans[0]?.id ? String(plans[0].id) : '',
      notes: '',
      lines: [{ product_id: products[0]?.id ? String(products[0].id) : '', variant_id: '', quantity: 1 }],
    })
    setIsDialogOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (tpl) => {
    setEditingTemplate(tpl)
    reset({
      name: tpl.name || '',
      validity_days: tpl.validity_days || 30,
      plan_id: tpl.plan_id ? String(tpl.plan_id) : '',
      notes: tpl.notes || '',
      lines:
        tpl.lines && tpl.lines.length > 0
          ? tpl.lines.map((l) => ({
              product_id: String(l.product_id),
              variant_id: l.variant_id ? String(l.variant_id) : '',
              quantity: Number(l.quantity) || 1,
            }))
          : [{ product_id: products[0]?.id ? String(products[0].id) : '', variant_id: '', quantity: 1 }],
    })
    setIsDialogOpen(true)
  }

  // Submit Handler
  const onSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        validity_days: Number(formData.validity_days),
        plan_id: Number(formData.plan_id),
        notes: formData.notes ? formData.notes.trim() : null,
        lines: formData.lines.map((l) => ({
          product_id: Number(l.product_id),
          variant_id: l.variant_id && l.variant_id !== '' ? Number(l.variant_id) : null,
          quantity: Number(l.quantity),
        })),
      }

      if (editingTemplate) {
        await updateQuotationTemplate(editingTemplate.id, payload)
        toast.success(`Template "${payload.name}" updated successfully`)
      } else {
        await createQuotationTemplate(payload)
        toast.success(`Template "${payload.name}" created successfully`)
      }

      setIsDialogOpen(false)
      fetchTemplates()
    } catch (err) {
      handleApiError(err, setError)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteConfirmTemplate) return
    setIsDeleting(true)
    try {
      await deleteQuotationTemplate(deleteConfirmTemplate.id)
      toast.success(`Template "${deleteConfirmTemplate.name}" deleted`)
      setDeleteConfirmTemplate(null)
      fetchTemplates()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-black tracking-tight">
            Quotation Templates
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pre-packaged standard subscription offers with predefined plans and product lines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTemplates}
            disabled={isLoading}
            className="rounded-sm border-border text-black hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-4 h-9 shadow-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search templates by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-sm border-border h-9"
              />
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="text-xs text-zinc-500 hover:text-black rounded-sm h-9"
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card className="rounded-md border border-border bg-white shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-600 font-mono flex items-center justify-between">
            <span>Template Library</span>
            <span className="text-xs font-normal text-zinc-400">
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Template Name</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Associated Plan</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Validity</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600">Included Lines</TableHead>
                <TableHead className="text-xs font-mono font-semibold uppercase text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading templates...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No quotation templates found"
                      description={
                        search
                          ? 'Try adjusting your search criteria.'
                          : 'Create your first quotation template to speed up recurring proposal creation.'
                      }
                      action={
                        !search && (
                          <Button
                            onClick={handleOpenCreate}
                            size="sm"
                            className="bg-primary text-white rounded-sm mt-3"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl) => (
                  <TableRow key={tpl.id} className="border-b border-border hover:bg-zinc-50/60 transition-colors">
                    <TableCell className="font-medium text-black">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{tpl.name}</span>
                        {tpl.notes && <span className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{tpl.notes}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tpl.plan ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{tpl.plan.name}</span>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-100 border-zinc-200">
                            {tpl.plan.billing_period}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{tpl.validity_days} days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs font-mono text-zinc-700">
                          {tpl.lines ? tpl.lines.length : 0} {tpl.lines?.length === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(tpl)}
                          className="h-8 px-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-sm"
                          title="Edit Template"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmTemplate(tpl)}
                          className="h-8 px-2 text-zinc-400 hover:text-primary hover:bg-rose-50 rounded-sm"
                          title="Delete Template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl rounded-md border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-semibold text-black">
              {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'New Quotation Template'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Configure standard parameters and line items for quick subscription quotation drafting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
            {/* Template Header Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-name" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Template Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="tpl-name"
                  placeholder="e.g. Standard SMB Onboarding Offer"
                  {...register('name')}
                  className="rounded-sm border-border h-9"
                />
                {errors.name && <p className="text-xs text-primary mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-plan" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Base Plan <span className="text-primary">*</span>
                </Label>
                <select
                  id="tpl-plan"
                  {...register('plan_id')}
                  className="w-full h-9 rounded-sm border border-border bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billing_period}) — {formatMoney(p.price)}
                    </option>
                  ))}
                </select>
                {errors.plan_id && <p className="text-xs text-primary mt-1">{errors.plan_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-validity" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Validity Period (Days) <span className="text-primary">*</span>
                </Label>
                <Input
                  id="tpl-validity"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="30"
                  {...register('validity_days')}
                  className="rounded-sm border-border h-9"
                />
                {errors.validity_days && (
                  <p className="text-xs text-primary mt-1">{errors.validity_days.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-notes" className="text-xs font-semibold uppercase font-mono text-zinc-700">
                  Internal Notes (Optional)
                </Label>
                <Input
                  id="tpl-notes"
                  placeholder="Context, requirements, or terms for this template..."
                  {...register('notes')}
                  className="rounded-sm border-border h-9"
                />
                {errors.notes && <p className="text-xs text-primary mt-1">{errors.notes.message}</p>}
              </div>
            </div>

            {/* Lines Repeater */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase font-mono text-zinc-700">
                    Included Product Lines <span className="text-primary">*</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Specify the default products, selected variants, and quantities for this offer.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      product_id: products[0]?.id ? String(products[0].id) : '',
                      variant_id: '',
                      quantity: 1,
                    })
                  }
                  className="rounded-sm border-border text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Line
                </Button>
              </div>

              {errors.lines && typeof errors.lines.message === 'string' && (
                <div className="p-2.5 rounded-sm bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-primary">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.lines.message}</span>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const currentLine = watchedLines[index] || {}
                  const selectedProduct = products.find((p) => String(p.id) === String(currentLine.product_id))
                  const availableVariants = selectedProduct?.variants || []

                  return (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-sm border border-border bg-zinc-50/50"
                    >
                      {/* Product Selector */}
                      <div className="flex-1 w-full sm:w-auto">
                        <select
                          {...register(`lines.${index}.product_id`)}
                          className="w-full h-8 rounded-sm border border-border bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">Select Product...</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({formatMoney(prod.sales_price)})
                            </option>
                          ))}
                        </select>
                        {errors.lines?.[index]?.product_id && (
                          <p className="text-[10px] text-primary mt-0.5">
                            {errors.lines[index].product_id.message}
                          </p>
                        )}
                      </div>

                      {/* Variant Selector (if product has variants) */}
                      {availableVariants.length > 0 && (
                        <div className="w-full sm:w-44">
                          <select
                            {...register(`lines.${index}.variant_id`)}
                            className="w-full h-8 rounded-sm border border-border bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                          >
                            <option value="">Standard (No Variant)</option>
                            {availableVariants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.attribute}: {v.value} (+{formatMoney(v.extra_price)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          {...register(`lines.${index}.quantity`)}
                          className="h-8 rounded-sm border-border text-xs text-center"
                        />
                        {errors.lines?.[index]?.quantity && (
                          <p className="text-[10px] text-primary mt-0.5">
                            {errors.lines[index].quantity.message}
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-primary hover:bg-rose-50 rounded-sm shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm border-border text-zinc-700 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-sm bg-primary text-white hover:bg-primary/95 font-medium px-5 h-9 shadow-none"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : editingTemplate ? (
                  'Update Template'
                ) : (
                  'Create Template'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteConfirmTemplate)}
        onOpenChange={(open) => !open && setDeleteConfirmTemplate(null)}
        title="Delete Quotation Template"
        description={`Are you sure you want to delete "${deleteConfirmTemplate?.name}"? Existing subscriptions created from this template will not be affected.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Template'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

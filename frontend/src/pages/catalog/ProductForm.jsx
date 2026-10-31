import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ArrowLeft, Layers, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { getProduct, createProduct, updateProduct, getTaxes } from '@/api/catalog';
import { productSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { PRODUCT_TYPES } from '@/lib/constants';

import { PageHeader, FormField, MoneyText } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = !isAdmin;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [taxes, setTaxes] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      type: PRODUCT_TYPES.SERVICE,
      sales_price: '',
      cost_price: '',
      tax_id: '',
      notes: '',
      is_active: true,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const watchedSalesPrice = watch('sales_price');
  const watchedVariants = watch('variants');

  // Load Taxes for tax_id select dropdown
  useEffect(() => {
    async function loadTaxes() {
      try {
        const res = await getTaxes({ all: 1 });
        setTaxes(res?.data || []);
      } catch (err) {
        console.error('Failed to load taxes dropdown:', err);
      }
    }
    loadTaxes();
  }, []);

  // Load existing product if editing
  useEffect(() => {
    if (!isEdit) return;

    async function loadProduct() {
      try {
        setLoading(true);
        const res = await getProduct(id);
        const prod = res?.data;
        if (prod) {
          reset({
            name: prod.name,
            type: prod.type,
            sales_price: prod.sales_price,
            cost_price: prod.cost_price,
            tax_id: prod.tax_id ? String(prod.tax_id) : '',
            notes: prod.notes || '',
            is_active: Boolean(prod.is_active),
            variants: (prod.variants || []).map((v) => ({
              id: v.id,
              attribute: v.attribute,
              value: v.value,
              extra_price: v.extra_price,
            })),
          });
        }
      } catch (err) {
        handleApiError(err);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, isEdit, reset, navigate]);

  // Real-time duplicate variant check
  const duplicateIndices = useMemo(() => {
    const duplicates = new Set();
    const seen = new Map();

    (watchedVariants || []).forEach((v, index) => {
      const attr = (v?.attribute || '').trim().toLowerCase();
      const val = (v?.value || '').trim().toLowerCase();
      if (!attr || !val) return;

      const key = `${attr}:${val}`;
      if (seen.has(key)) {
        duplicates.add(index);
        duplicates.add(seen.get(key));
      } else {
        seen.set(key, index);
      }
    });

    return duplicates;
  }, [watchedVariants]);

  const onSubmit = async (values) => {
    if (isReadOnly) return;

    if (duplicateIndices.size > 0) {
      toast.error('Duplicate variant combination found. Each (attribute, value) pair must be unique.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: values.name,
        type: values.type,
        sales_price: Number(values.sales_price),
        cost_price: Number(values.cost_price),
        tax_id: values.tax_id ? Number(values.tax_id) : null,
        notes: values.notes || null,
        is_active: Boolean(values.is_active),
        variants: (values.variants || []).map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          attribute: v.attribute.trim(),
          value: v.value.trim(),
          extra_price: v.extra_price ? Number(v.extra_price) : 0,
        })),
      };

      if (isEdit) {
        await updateProduct(id, payload);
        toast.success(`Product "${payload.name}" updated successfully.`);
      } else {
        await createProduct(payload);
        toast.success(`Product "${payload.name}" created successfully.`);
      }

      navigate('/products');
    } catch (err) {
      handleApiError(err, setError, { toastOn422: false });
    } finally {
      setSubmitting(false);
    }
  };

  const baseSales = parseFloat(watchedSalesPrice) || 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <div className="font-mono text-xs text-muted-foreground animate-pulse">
          LOADING PRODUCT SPECIFICATION...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={isEdit ? (isReadOnly ? 'View Product' : 'Edit Product') : 'New Product'}
        description={
          isReadOnly
            ? 'Staff view mode: inspecting product parameters and variants (read-only).'
            : 'Configure product attributes, base pricing, tax profile, and item variants.'
        }
        breadcrumbs={[
          { label: 'Catalog', href: '/products' },
          { label: 'Products', href: '/products' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        backHref="/products"
      />

      {isReadOnly && (
        <div className="p-3 bg-muted/50 border border-border rounded-sm flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span>STAFF ACCESS: View only. Product modifications require Administrator role.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Product Information Card */}
        <Card className="border-border">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="font-sans text-base font-bold uppercase tracking-tight">
              General Parameters
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Core identity, classification, and catalog status.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Product Name" required id="prod-name" error={errors.name}>
                  <Input
                    id="prod-name"
                    placeholder="e.g. Brightloop Business Suite, CRM Seat"
                    disabled={isReadOnly}
                    {...register('name')}
                    className="h-9 font-sans text-sm rounded-sm"
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Product Type" required id="prod-type" error={errors.type}>
                  <select
                    id="prod-type"
                    disabled={isReadOnly}
                    {...register('type')}
                    className="w-full h-9 px-3 font-mono text-xs rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                  >
                    <option value={PRODUCT_TYPES.SERVICE}>Service</option>
                    <option value={PRODUCT_TYPES.GOODS}>Goods</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField label="Sales Price (Base ₹)" required id="sales-price" error={errors.sales_price}>
                <div className="relative">
                  <Input
                    id="sales-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isReadOnly}
                    {...register('sales_price')}
                    className="h-9 font-mono text-xs rounded-sm pl-7"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    ₹
                  </span>
                </div>
              </FormField>

              <FormField label="Cost Price (₹)" required id="cost-price" error={errors.cost_price}>
                <div className="relative">
                  <Input
                    id="cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isReadOnly}
                    {...register('cost_price')}
                    className="h-9 font-mono text-xs rounded-sm pl-7"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    ₹
                  </span>
                </div>
              </FormField>

              <FormField label="Tax Rule" id="tax-id" error={errors.tax_id}>
                <select
                  id="tax-id"
                  disabled={isReadOnly}
                  {...register('tax_id')}
                  className="w-full h-9 px-3 font-mono text-xs rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                >
                  <option value="">No Tax (Exempt)</option>
                  {taxes.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({t.type === 'percentage' ? `${t.rate}%` : `₹${t.rate}`})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Notes & Description" id="notes" error={errors.notes}>
              <textarea
                id="notes"
                rows={3}
                placeholder="Product specifications, internal fulfillment notes, or SLA terms..."
                disabled={isReadOnly}
                {...register('notes')}
                className="w-full p-2.5 font-sans text-xs rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-active"
                type="checkbox"
                disabled={isReadOnly}
                {...register('is_active')}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
              />
              <label htmlFor="is-active" className="font-mono text-xs font-medium text-foreground cursor-pointer">
                Active in catalog (available for subscriptions and quotation lines)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Variants Repeater & Live Preview Card */}
        <Card className="border-border">
          <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-sans text-base font-bold uppercase tracking-tight">
                  Product Variants
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {fields.length} CONFIGURED
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Optional attribute variations (e.g. Brand: Odoo +560.00, Brand: Zoho +300.00).
              </CardDescription>
            </div>

            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ attribute: 'Brand', value: '', extra_price: '0.00' })}
                className="font-mono text-xs uppercase"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Variant
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            {fields.length === 0 ? (
              <div className="p-8 text-center rounded-sm border border-dashed border-border bg-muted/20">
                <Layers className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="font-sans text-xs font-medium text-foreground">No custom variants added.</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  This product will sell as a single standard item at base price ({formatMoney(baseSales)}).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground px-1 hidden sm:grid">
                  <div className="col-span-4">Attribute (e.g. Brand)</div>
                  <div className="col-span-4">Value (e.g. Odoo)</div>
                  <div className="col-span-3">Extra Price (₹)</div>
                  <div className="col-span-1 text-right">Remove</div>
                </div>

                {fields.map((fieldItem, idx) => {
                  const isDuplicate = duplicateIndices.has(idx);

                  return (
                    <div
                      key={fieldItem.id}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-sm border ${
                        isDuplicate
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="sm:col-span-4">
                        <Input
                          placeholder="e.g. Brand, Tier, Storage"
                          disabled={isReadOnly}
                          {...register(`variants.${idx}.attribute`)}
                          className="h-8 font-mono text-xs rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <Input
                          placeholder="e.g. Odoo, Zoho, Platinum"
                          disabled={isReadOnly}
                          {...register(`variants.${idx}.value`)}
                          className="h-8 font-mono text-xs rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            disabled={isReadOnly}
                            {...register(`variants.${idx}.extra_price`)}
                            className="h-8 font-mono text-xs rounded-sm pl-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                            +
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Remove Variant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {isDuplicate && (
                        <div className="sm:col-span-12 flex items-center gap-1.5 text-destructive text-[11px] font-mono">
                          <AlertCircle className="h-3 w-3" />
                          <span>Duplicate attribute and value: must be unique within product</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIVE PREVIEW SECTION (BR-1: unit_price = sales_price + extra_price) */}
            <div className="mt-6 p-4 rounded-sm border border-border bg-muted/30 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Unit Price Preview (BR-1)
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground">
                Effective customer price calculated per variant: <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">unit_price = sales_price + extra_price</code>
              </p>

              <div className="pt-2 divide-y divide-border/60">
                <div className="py-1.5 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Standard (Base Product)</span>
                  <MoneyText amount={baseSales} className="font-bold text-foreground" />
                </div>

                {watchedVariants &&
                  watchedVariants.map((v, i) => {
                    const extra = parseFloat(v?.extra_price) || 0;
                    const effectivePrice = baseSales + extra;
                    const label =
                      v?.attribute && v?.value
                        ? `${v.attribute}: ${v.value}`
                        : `Variant #${i + 1}`;

                    return (
                      <div key={i} className="py-1.5 flex items-center justify-between text-xs font-mono">
                        <span className="text-foreground">
                          {label}{' '}
                          <span className="text-muted-foreground text-[11px]">
                            ({formatMoney(baseSales)} + {formatMoney(extra)})
                          </span>
                        </span>
                        <MoneyText amount={effectivePrice} className="font-bold text-primary" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
            className="font-mono text-xs uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Products
          </Button>

          {!isReadOnly && (
            <Button
              type="submit"
              size="sm"
              disabled={submitting || duplicateIndices.size > 0}
              className="font-mono text-xs uppercase tracking-wider"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

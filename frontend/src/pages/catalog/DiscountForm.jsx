import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
  Tag,
  Percent,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import {
  getDiscount,
  createDiscount,
  updateDiscount,
  getProducts,
} from '@/api/catalog';
import { discountSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/format';

import { PageHeader, FormField } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DiscountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = !isAdmin;

  const [loading, setLoading] = useState(isEdit);
  const [products, setProducts] = useState([]);
  const [usedCount, setUsedCount] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'percentage',
      value: '',
      applies_to: 'subscription',
      product_ids: [],
      min_purchase: '',
      min_quantity: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      usage_limit: '',
      is_active: true,
    },
  });

  const watchAppliesTo = watch('applies_to');
  const watchType = watch('type');
  const watchProductIds = watch('product_ids') || [];

  // Load products list
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await getProducts({ all: 1 });
        const list = res?.data?.data || res?.data || [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        setProducts([]);
      }
    }
    fetchProducts();
  }, []);

  // Load discount if editing
  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    async function fetchDiscount() {
      setLoading(true);
      try {
        const res = await getDiscount(id);
        const d = res?.data?.data || res?.data || res;
        if (!isMounted) return;

        setUsedCount(d.used_count || 0);

        const prodIds = Array.isArray(d.product_ids)
          ? d.product_ids
          : Array.isArray(d.products)
          ? d.products.map((p) => p.id)
          : [];

        reset({
          name: d.name || '',
          code: d.code || '',
          type: d.type || 'percentage',
          value: d.value ?? '',
          applies_to: d.applies_to || 'subscription',
          product_ids: prodIds,
          min_purchase: d.min_purchase ?? '',
          min_quantity: d.min_quantity ?? '',
          start_date: d.start_date ? d.start_date.split('T')[0] : '',
          end_date: d.end_date ? d.end_date.split('T')[0] : '',
          usage_limit: d.usage_limit ?? '',
          is_active: d.is_active !== undefined ? Boolean(d.is_active) : true,
        });
      } catch (err) {
        toast.error('Failed to load discount details');
        navigate('/discounts');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDiscount();
    return () => {
      isMounted = false;
    };
  }, [id, isEdit, reset, navigate]);

  const toggleProduct = (productId) => {
    const current = new Set(watchProductIds);
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    setValue('product_ids', Array.from(current), { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    if (isReadOnly) {
      toast.error('You do not have permission to modify discounts.');
      return;
    }

    // Server enforces DSC-04: usage_limit cannot be lower than used_count
    if (isEdit && values.usage_limit !== null && values.usage_limit < usedCount) {
      toast.error(
        `Usage limit cannot be lower than already recorded redemptions (${usedCount}).`
      );
      return;
    }

    const payload = {
      ...values,
      code: values.code ? values.code.trim().toUpperCase() : null,
      product_ids: values.applies_to === 'products' ? values.product_ids : [],
      min_purchase: values.min_purchase ? Number(values.min_purchase) : null,
      min_quantity: values.min_quantity ? Number(values.min_quantity) : null,
      usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
    };

    try {
      if (isEdit) {
        await updateDiscount(id, payload);
        toast.success(`Discount "${values.name}" updated successfully`);
      } else {
        await createDiscount(payload);
        toast.success(`Discount "${values.name}" created successfully`);
      }
      navigate('/discounts');
    } catch (err) {
      handleApiError(err, 'Failed to save discount');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={isEdit ? `Edit Discount: #${id}` : 'Create New Discount'}
        description="Set up promotional vouchers, percentage rates, qualifying rules, and usage caps."
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Discounts', href: '/discounts' },
          { label: isEdit ? 'Edit Discount' : 'New Discount' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/discounts">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Discounts
            </Link>
          </Button>
        }
      />

      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold">Read-only mode:</span> Only administrators can create
            or modify discounts.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details (Col 1-2) */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Discount Details
                </CardTitle>
                <CardDescription>
                  Define the coupon name, optional promo code, and deduction rate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Discount Name"
                  required
                  error={errors.name?.message}
                  description="Descriptive internal title for this promotion"
                >
                  <Input
                    {...register('name')}
                    placeholder="e.g. Black Friday 20% Off"
                    disabled={isReadOnly || isSubmitting}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Promo Code (Optional)"
                    error={errors.code?.message}
                    description="Customer-facing voucher code (stored UPPERCASE)"
                  >
                    <Input
                      {...register('code')}
                      placeholder="e.g. BF2026"
                      className="font-mono uppercase"
                      disabled={isReadOnly || isSubmitting}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        register('code').onChange(e);
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Discount Type"
                    required
                    error={errors.type?.message}
                    description="Percentage off or fixed monetary amount"
                  >
                    <select
                      {...register('type')}
                      disabled={isReadOnly || isSubmitting}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ({formatMoney(0).replace(/[0-9.,]/g, '')})</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={watchType === 'percentage' ? 'Percentage Off (%)' : 'Deduction Amount'}
                    required
                    error={errors.value?.message}
                    description={
                      watchType === 'percentage'
                        ? '1 to 100 percent'
                        : 'Monetary deduction amount'
                    }
                  >
                    <Input
                      type="number"
                      step={watchType === 'percentage' ? '1' : '0.01'}
                      min="0.01"
                      max={watchType === 'percentage' ? '100' : undefined}
                      {...register('value')}
                      placeholder={watchType === 'percentage' ? '10' : '500.00'}
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormField>

                  <FormField
                    label="Applies To Scope"
                    required
                    error={errors.applies_to?.message}
                    description="Target for this discount"
                  >
                    <select
                      {...register('applies_to')}
                      disabled={isReadOnly || isSubmitting}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="subscription">Subscription / Entire Order</option>
                      <option value="products">Specific Products Only</option>
                    </select>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Product Multiselector when applies_to === 'products' */}
            {watchAppliesTo === 'products' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Eligible Products
                  </CardTitle>
                  <CardDescription>
                    Select the products that qualify for this discount (at least 1 required).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {errors.product_ids && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.product_ids.message}
                    </p>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/20">
                    {products.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No products available to select.</p>
                    ) : (
                      products.map((p) => {
                        const isSelected = watchProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => !isReadOnly && !isSubmitting && toggleProduct(p.id)}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors text-sm ${
                              isSelected
                                ? 'bg-primary/10 border-primary/40 font-medium'
                                : 'bg-card hover:bg-muted/50 border-input'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-input'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{p.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatMoney(p.sales_price)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {watchProductIds.length} product(s)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Eligibility & Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Eligibility Requirements (Optional)
                </CardTitle>
                <CardDescription>
                  Set minimum purchase or quantity thresholds to trigger this discount.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Minimum Purchase Amount"
                    error={errors.min_purchase?.message}
                    description="Order subtotal required to qualify"
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('min_purchase')}
                      placeholder="e.g. 1000.00"
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormField>

                  <FormField
                    label="Minimum Item Quantity"
                    error={errors.min_quantity?.message}
                    description="Minimum line quantity required"
                  >
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...register('min_quantity')}
                      placeholder="e.g. 5"
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validity & Usage (Col 3) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Validity & Usage Caps
                </CardTitle>
                <CardDescription>
                  Specify active date boundaries and lifetime redemption counts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Start Date"
                  required
                  error={errors.start_date?.message}
                >
                  <Input
                    type="date"
                    {...register('start_date')}
                    disabled={isReadOnly || isSubmitting}
                  />
                </FormField>

                <FormField
                  label="End Date"
                  required
                  error={errors.end_date?.message}
                >
                  <Input
                    type="date"
                    {...register('end_date')}
                    disabled={isReadOnly || isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Usage Limit"
                  error={errors.usage_limit?.message}
                  description={
                    isEdit
                      ? `Already used ${usedCount} times. Limit cannot be lower than ${usedCount}.`
                      : 'Leave blank for unlimited redemptions'
                  }
                >
                  <Input
                    type="number"
                    min={isEdit ? usedCount : 1}
                    step="1"
                    {...register('usage_limit')}
                    placeholder="Unlimited"
                    disabled={isReadOnly || isSubmitting}
                  />
                </FormField>

                <div className="pt-2 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      disabled={isReadOnly || isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Active Status</span>
                      <p className="text-xs text-muted-foreground">
                        Inactive discounts cannot be redeemed.
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isReadOnly || isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting
                    ? 'Saving...'
                    : isEdit
                    ? 'Save Discount Changes'
                    : 'Create Discount'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                  disabled={isSubmitting}
                >
                  <Link to="/discounts">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

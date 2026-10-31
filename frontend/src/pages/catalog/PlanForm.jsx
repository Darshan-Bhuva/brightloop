import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Sparkles, AlertCircle, Calendar, Layers } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { getPlan, createPlan, updatePlan, getTaxes } from '@/api/catalog';
import { planSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

import { PageHeader, FormField } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const BILLING_PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = !isAdmin;

  const [loading, setLoading] = useState(isEdit);
  const [taxes, setTaxes] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: '',
      billing_period: 'monthly',
      min_quantity: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      tax_id: '',
      auto_close: false,
      closable: true,
      pausable: false,
      renewable: true,
      is_active: true,
    },
  });

  // Load taxes for dropdown
  useEffect(() => {
    async function fetchTaxes() {
      try {
        const res = await getTaxes({ all: 1 });
        const list = res?.data?.data || res?.data || [];
        setTaxes(Array.isArray(list) ? list : []);
      } catch (err) {
        // Soft fallback
        setTaxes([]);
      }
    }
    fetchTaxes();
  }, []);

  // Load plan if editing
  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    async function fetchPlan() {
      setLoading(true);
      try {
        const res = await getPlan(id);
        const plan = res?.data?.data || res?.data || res;
        if (!isMounted) return;

        reset({
          name: plan.name || '',
          price: plan.price ?? '',
          billing_period: plan.billing_period || 'monthly',
          min_quantity: plan.min_quantity ?? 1,
          start_date: plan.start_date ? plan.start_date.split('T')[0] : '',
          end_date: plan.end_date ? plan.end_date.split('T')[0] : '',
          tax_id: plan.tax_id ? String(plan.tax_id) : '',
          auto_close: Boolean(plan.auto_close),
          closable: plan.closable !== undefined ? Boolean(plan.closable) : true,
          pausable: Boolean(plan.pausable),
          renewable: plan.renewable !== undefined ? Boolean(plan.renewable) : true,
          is_active: plan.is_active !== undefined ? Boolean(plan.is_active) : true,
        });
      } catch (err) {
        toast.error('Failed to load plan details');
        navigate('/plans');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (values) => {
    if (isReadOnly) {
      toast.error('You do not have permission to modify plans.');
      return;
    }

    const payload = {
      ...values,
      tax_id: values.tax_id ? Number(values.tax_id) : null,
      end_date: values.end_date ? values.end_date : null,
    };

    try {
      if (isEdit) {
        await updatePlan(id, payload);
        toast.success(`Plan "${values.name}" updated successfully`);
      } else {
        await createPlan(payload);
        toast.success(`Plan "${values.name}" created successfully`);
      }
      navigate('/plans');
    } catch (err) {
      handleApiError(err, 'Failed to save plan');
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
        title={isEdit ? `Edit Plan: #${id}` : 'Create New Plan'}
        description="Configure subscription billing cycles, base pricing, tax attachments, and lifecycle rules."
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Plans', href: '/plans' },
          { label: isEdit ? 'Edit Plan' : 'New Plan' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/plans">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Plans
            </Link>
          </Button>
        }
      />

      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold">Read-only mode:</span> Only administrators can create
            or modify subscription plans.
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
                  <Layers className="w-4 h-4 text-primary" />
                  Plan Configuration
                </CardTitle>
                <CardDescription>
                  Define the naming and core billing structure for this recurring plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Plan Name"
                  required
                  error={errors.name?.message}
                  description="e.g. Monthly Starter, Yearly Enterprise"
                >
                  <Input
                    {...register('name')}
                    placeholder="Enter descriptive plan name"
                    disabled={isReadOnly || isSubmitting}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Price per Cycle"
                    required
                    error={errors.price?.message}
                    description="Base price billed per recurring interval"
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price')}
                      placeholder="0.00"
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormField>

                  <FormField
                    label="Billing Period"
                    required
                    error={errors.billing_period?.message}
                    description="Interval recurrence cycle"
                  >
                    <select
                      {...register('billing_period')}
                      disabled={isReadOnly || isSubmitting}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {BILLING_PERIODS.map((bp) => (
                        <option key={bp.value} value={bp.value}>
                          {bp.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Minimum Quantity"
                    required
                    error={errors.min_quantity?.message}
                    description="Minimum seats or license units required"
                  >
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...register('min_quantity')}
                      placeholder="1"
                      disabled={isReadOnly || isSubmitting}
                    />
                  </FormField>

                  <FormField
                    label="Applied Tax"
                    error={errors.tax_id?.message}
                    description="Default tax rate applied to cycle invoices"
                  >
                    <select
                      {...register('tax_id')}
                      disabled={isReadOnly || isSubmitting}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">No Tax Applied</option>
                      {taxes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.rate}%)
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Lifecycle & Policy Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Subscription Lifecycle Rules
                </CardTitle>
                <CardDescription>
                  Configure policy permissions for subscribers enrolled in this plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      {...register('renewable')}
                      disabled={isReadOnly || isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Auto-Renewable</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permits recurring billing renewals when reaching cycle end.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      {...register('closable')}
                      disabled={isReadOnly || isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Closable by Subscriber</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Subscribers may manually terminate or cancel this plan.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      {...register('pausable')}
                      disabled={isReadOnly || isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Pausable</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Allows temporary suspension of recurring invoice generation.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      {...register('auto_close')}
                      disabled={isReadOnly || isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Auto-Close on End Date</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically close subscriptions once the validity end date is reached.
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validity & Status (Col 3) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Availability & Validity
                </CardTitle>
                <CardDescription>
                  Date range during which this plan is offered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Available From"
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
                  label="Available Until (Optional)"
                  error={errors.end_date?.message}
                  description="Leave blank for ongoing availability"
                >
                  <Input
                    type="date"
                    {...register('end_date')}
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
                        Inactive plans cannot be selected for new subscriptions.
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
                    ? 'Save Plan Changes'
                    : 'Create Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                  disabled={isSubmitting}
                >
                  <Link to="/plans">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

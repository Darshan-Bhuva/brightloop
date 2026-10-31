import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { getTaxes, createTax, updateTax, deleteTax } from '@/api/catalog';
import { taxSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import { formatRate } from '@/lib/format';
import { TAX_TYPES } from '@/lib/constants';

import {
  PageHeader,
  DataTable,
  FilterBar,
  StatusBadge,
  ConfirmDialog,
  FormField,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function TaxesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      name: '',
      type: TAX_TYPES.PERCENTAGE,
      rate: '',
      is_active: true,
    },
  });

  const selectedType = watch('type');

  const fetchTaxes = useCallback(async () => {
    try {
      const res = await getTaxes({
        search: search || undefined,
        is_active: statusFilter !== '' ? statusFilter : undefined,
        all: 1,
      });
      setTaxes(res?.data || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getTaxes({
          search: search || undefined,
          is_active: statusFilter !== '' ? statusFilter : undefined,
          all: 1,
        });
        if (!ignore) {
          setTaxes(res?.data || []);
        }
      } catch (err) {
        if (!ignore) handleApiError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTax(null);
    reset({
      name: '',
      type: TAX_TYPES.PERCENTAGE,
      rate: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    reset({
      name: tax.name,
      type: tax.type,
      rate: tax.rate,
      is_active: Boolean(tax.is_active),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      if (editingTax) {
        await updateTax(editingTax.id, values);
        toast.success(`Tax "${values.name}" updated successfully.`);
      } else {
        await createTax(values);
        toast.success(`Tax "${values.name}" created successfully.`);
      }
      setDialogOpen(false);
      fetchTaxes();
    } catch (err) {
      handleApiError(err, setError, { toastOn422: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taxToDelete) return;
    try {
      setDeleting(true);
      await deleteTax(taxToDelete.id);
      toast.success(`Tax "${taxToDelete.name}" deleted.`);
      setDeleteDialogOpen(false);
      fetchTaxes();
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tax Name',
      sortable: true,
      render: (val) => <span className="font-sans font-semibold text-foreground">{val}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          {val === TAX_TYPES.PERCENTAGE ? (
            <Percent className="h-3.5 w-3.5 text-blue-500" />
          ) : (
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          )}
          {val}
        </span>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono font-semibold text-xs text-foreground">
          {formatRate(val, row.type)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={Boolean(val)} />,
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (_, row) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(row);
                  }}
                  className="h-8 w-8 p-0"
                  title="Edit Tax"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTaxToDelete(row);
                    setDeleteDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete Tax"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Taxes"
        description="Configure percentage or flat rate tax rules applied to products and recurring plans."
        breadcrumbs={[
          { label: 'Settings', href: '/settings/taxes' },
          { label: 'Taxes' },
        ]}
        actions={
          isAdmin && (
            <Button onClick={handleOpenCreate} size="sm" className="font-mono text-xs uppercase">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Tax
            </Button>
          )
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search taxes by name..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={taxes}
        loading={loading}
        emptyTitle="No Taxes Found"
        emptyDescription="Get started by creating your first sales tax rule."
      />

      {/* Create / Edit Tax Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-bold uppercase tracking-tight text-foreground">
              {editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              {editingTax
                ? 'Update tax name, calculation method, or rate.'
                : 'Define a tax rule applied to catalog goods and subscription plans.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField label="Tax Name" required id="tax-name" error={errors.name}>
              <Input
                id="tax-name"
                placeholder="e.g. GST 18%, VAT 5%"
                {...register('name')}
                className="h-9 font-sans text-sm rounded-sm"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tax Type" required id="tax-type" error={errors.type}>
                <select
                  id="tax-type"
                  {...register('type')}
                  className="w-full h-9 px-3 font-mono text-xs rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value={TAX_TYPES.PERCENTAGE}>Percentage (%)</option>
                  <option value={TAX_TYPES.FIXED}>Fixed Amount</option>
                </select>
              </FormField>

              <FormField
                label={`Rate (${selectedType === TAX_TYPES.PERCENTAGE ? '%' : '₹'})`}
                required
                id="tax-rate"
                error={errors.rate}
              >
                <div className="relative">
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedType === TAX_TYPES.PERCENTAGE ? '100' : undefined}
                    placeholder={selectedType === TAX_TYPES.PERCENTAGE ? '18.00' : '50.00'}
                    {...register('rate')}
                    className="h-9 font-mono text-xs rounded-sm pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    {selectedType === TAX_TYPES.PERCENTAGE ? '%' : '₹'}
                  </span>
                </div>
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="tax-active"
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="tax-active" className="font-mono text-xs font-medium text-foreground cursor-pointer">
                Active for new products and subscriptions
              </label>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="font-mono text-xs uppercase">
                {saving ? 'Saving...' : editingTax ? 'Update Tax' : 'Create Tax'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Tax Rule?"
        description={
          taxToDelete
            ? `Are you sure you want to delete "${taxToDelete.name}"? If in use by products or plans, it must be deactivated instead.`
            : 'This action cannot be undone.'
        }
        confirmText="Delete Tax"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

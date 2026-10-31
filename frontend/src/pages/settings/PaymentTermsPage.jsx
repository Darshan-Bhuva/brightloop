import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import {
  getPaymentTerms,
  createPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
} from '@/api/catalog';
import { paymentTermSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

import {
  PageHeader,
  DataTable,
  FilterBar,
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

export default function PaymentTermsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPt, setEditingPt] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ptToDelete, setPtToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentTermSchema),
    defaultValues: {
      name: '',
      due_days: 0,
    },
  });

  const fetchPaymentTerms = useCallback(async () => {
    try {
      const res = await getPaymentTerms({ search: search || undefined, all: 1 });
      setPaymentTerms(res?.data || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getPaymentTerms({ search: search || undefined, all: 1 });
        if (!ignore) {
          setPaymentTerms(res?.data || []);
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
  }, [search]);

  const handleOpenCreate = () => {
    setEditingPt(null);
    reset({
      name: '',
      due_days: 0,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (pt) => {
    setEditingPt(pt);
    reset({
      name: pt.name,
      due_days: pt.due_days,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      if (editingPt) {
        await updatePaymentTerm(editingPt.id, values);
        toast.success(`Payment term "${values.name}" updated successfully.`);
      } else {
        await createPaymentTerm(values);
        toast.success(`Payment term "${values.name}" created successfully.`);
      }
      setDialogOpen(false);
      fetchPaymentTerms();
    } catch (err) {
      handleApiError(err, setError, { toastOn422: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ptToDelete) return;
    try {
      setDeleting(true);
      await deletePaymentTerm(ptToDelete.id);
      toast.success(`Payment term "${ptToDelete.name}" deleted.`);
      setDeleteDialogOpen(false);
      fetchPaymentTerms();
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Term Name',
      sortable: true,
      render: (val) => <span className="font-sans font-semibold text-foreground">{val}</span>,
    },
    {
      key: 'due_days',
      label: 'Due Interval',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {val === 0 ? 'Immediate (0 days)' : `${val} days`}
        </span>
      ),
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
                  title="Edit Payment Term"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPtToDelete(row);
                    setDeleteDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete Payment Term"
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
        title="Payment Terms"
        description="Configure standard invoice due terms and grace intervals (Immediate, Net 15, Net 30, etc.)."
        breadcrumbs={[
          { label: 'Settings', href: '/settings/payment-terms' },
          { label: 'Payment Terms' },
        ]}
        actions={
          isAdmin && (
            <Button onClick={handleOpenCreate} size="sm" className="font-mono text-xs uppercase">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Payment Term
            </Button>
          )
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment terms..."
        onReset={() => setSearch('')}
      />

      <DataTable
        columns={columns}
        data={paymentTerms}
        loading={loading}
        emptyTitle="No Payment Terms Found"
        emptyDescription="Define terms like 'Immediate' or 'Net 30' to automatically calculate invoice due dates."
      />

      {/* Create / Edit Payment Term Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-bold uppercase tracking-tight text-foreground">
              {editingPt ? 'Edit Payment Term' : 'Create Payment Term'}
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Specify the invoice payment grace period in days.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField label="Term Name" required id="pt-name" error={errors.name}>
              <Input
                id="pt-name"
                placeholder="e.g. Net 30, Immediate, Net 45"
                {...register('name')}
                className="h-9 font-sans text-sm rounded-sm"
              />
            </FormField>

            <FormField label="Due Days (0 - 365)" required id="pt-due-days" error={errors.due_days}>
              <div className="relative">
                <Input
                  id="pt-due-days"
                  type="number"
                  min="0"
                  max="365"
                  placeholder="30"
                  {...register('due_days')}
                  className="h-9 font-mono text-xs rounded-sm pr-12"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                  DAYS
                </span>
              </div>
            </FormField>

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
                {saving ? 'Saving...' : editingPt ? 'Update Term' : 'Create Term'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Payment Term?"
        description={
          ptToDelete
            ? `Are you sure you want to delete "${ptToDelete.name}"? If used by active subscriptions or invoices, it cannot be deleted.`
            : 'This action cannot be undone.'
        }
        confirmText="Delete Term"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { getDiscounts, deleteDiscount } from '@/api/catalog';
import { handleApiError } from '@/lib/errors';
import { formatMoney, formatDate } from '@/lib/format';

import {
  PageHeader,
  DataTable,
  StatusBadge,
  ConfirmDialog,
  DateText,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DISCOUNT_STATES = [
  { value: '', label: 'All States' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'inactive', label: 'Inactive' },
];

const DISCOUNT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const APPLIES_TO = [
  { value: '', label: 'All Scopes' },
  { value: 'products', label: 'Products' },
  { value: 'subscription', label: 'Subscription' },
];

export default function DiscountsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [appliesToFilter, setAppliesToFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.state = stateFilter;
      if (typeFilter) params.type = typeFilter;
      if (appliesToFilter) params.applies_to = appliesToFilter;

      const res = await getDiscounts(params);
      const items = res?.data?.data || res?.data || [];
      setDiscounts(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, typeFilter, appliesToFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscounts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDiscounts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      toast.success(`Discount "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err) {
      handleApiError(err, 'Failed to delete discount');
    } finally {
      setDeleting(false);
    }
  };

  const getDerivedState = (discount) => {
    if (discount.state) return discount.state;
    if (!discount.is_active) return 'inactive';

    const now = new Date().toISOString().split('T')[0];
    if (discount.start_date && discount.start_date > now) return 'scheduled';
    if (discount.end_date && discount.end_date < now) return 'expired';
    if (
      discount.usage_limit &&
      discount.used_count !== undefined &&
      discount.used_count >= discount.usage_limit
    ) {
      return 'exhausted';
    }
    return 'active';
  };

  const columns = [
    {
      key: 'name',
      label: 'Discount & Code',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{row.name}</span>
            {row.code && (
              <Badge variant="secondary" className="font-mono text-xs uppercase px-1.5 py-0">
                {row.code}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">ID: #{row.id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Value',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 font-medium">
          {row.type === 'percentage' ? (
            <>
              <Percent className="w-3.5 h-3.5 text-primary" />
              <span>{row.value}% off</span>
            </>
          ) : (
            <>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatMoney(row.value)} off</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'applies_to',
      label: 'Scope',
      render: (_, row) => (
        <div className="flex flex-col">
          <Badge
            variant={row.applies_to === 'subscription' ? 'outline' : 'secondary'}
            className="w-fit text-xs capitalize"
          >
            {row.applies_to}
          </Badge>
          {row.applies_to === 'products' && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {row.products?.length || row.product_ids?.length || 0} product(s)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'validity',
      label: 'Validity Period',
      render: (_, row) => (
        <div className="text-xs text-muted-foreground flex flex-col">
          <span>From: <DateText date={row.start_date} /></span>
          <span>To: <DateText date={row.end_date} /></span>
        </div>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (_, row) => {
        const used = row.used_count || 0;
        const limit = row.usage_limit;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium">
              {limit ? `${used} / ${limit} used` : `${used} used (unlimited)`}
            </span>
            {limit && (
              <span className="text-muted-foreground">
                {Math.max(0, limit - used)} remaining
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'state',
      label: 'Status',
      render: (_, row) => {
        const state = getDerivedState(row);
        const variants = {
          active: 'success',
          scheduled: 'info',
          expired: 'muted',
          exhausted: 'warning',
          inactive: 'danger',
        };
        return (
          <StatusBadge
            status={state}
            variant={variants[state] || 'default'}
            label={state.toUpperCase()}
          />
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/discounts/${row.id}/edit`} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                {isAdmin ? 'Edit Discount' : 'View Details'}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => setDeleteTarget(row)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Discount
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts & Coupons"
        description="Manage promotional codes, volume markdowns, and recurring subscription discounts."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Discounts' }]}
        actions={
          isAdmin && (
            <Button asChild>
              <Link to="/discounts/new">
                <Plus className="w-4 h-4 mr-1.5" /> New Discount
              </Link>
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DISCOUNT_STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DISCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={appliesToFilter}
            onChange={(e) => setAppliesToFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {APPLIES_TO.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          {(search || stateFilter || typeFilter || appliesToFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStateFilter('');
                setTypeFilter('');
                setAppliesToFilter('');
              }}
              className="h-9 text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        error={error}
        onRetry={fetchDiscounts}
        onRowClick={(row) => isAdmin && navigate(`/discounts/${row.id}/edit`)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="w-10 h-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-semibold">No Discounts Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              {search || stateFilter || typeFilter || appliesToFilter
                ? 'No discounts match the specified filter criteria. Try clearing some filters.'
                : 'No promotional discounts configured yet. Create one to attach to orders or subscriptions.'}
            </p>
            {isAdmin && !search && (
              <Button asChild size="sm">
                <Link to="/discounts/new">
                  <Plus className="w-4 h-4 mr-1.5" /> Create First Discount
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Discount"
        description={`Are you sure you want to delete discount "${deleteTarget?.name}"? Historical usage records on finalized invoices will be preserved, but it can no longer be applied.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Discount'}
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

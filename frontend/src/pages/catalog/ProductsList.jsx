import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Layers } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct } from '@/api/catalog';
import { handleApiError } from '@/lib/errors';
import { formatRate } from '@/lib/format';
import { PRODUCT_TYPES } from '@/lib/constants';

import {
  PageHeader,
  DataTable,
  FilterBar,
  StatusBadge,
  MoneyText,
  ConfirmDialog,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProductsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await getProducts({
        search: search || undefined,
        type: typeFilter || undefined,
        is_active: activeFilter !== '' ? activeFilter : undefined,
        sort: sortField,
        direction: sortDirection,
        page,
        per_page: perPage,
      });

      setProducts(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, activeFilter, sortField, sortDirection, page, perPage]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getProducts({
          search: search || undefined,
          type: typeFilter || undefined,
          is_active: activeFilter !== '' ? activeFilter : undefined,
          sort: sortField,
          direction: sortDirection,
          page,
          per_page: perPage,
        });

        if (!ignore) {
          setProducts(res?.data || []);
          setMeta(res?.meta || null);
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
  }, [search, typeFilter, activeFilter, sortField, sortDirection, page, perPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await deleteProduct(productToDelete.id);
      toast.success(`Product "${productToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (err) {
      // 409 if used by subscription line in draft|quotation|confirmed|active
      handleApiError(err);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-foreground text-sm">{val}</span>
            {row.variants && row.variants.length > 0 && (
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" />
                {row.variants.length} VARIANTS
              </Badge>
            )}
          </div>
          {row.notes && (
            <p className="font-sans text-xs text-muted-foreground truncate max-w-xs">{row.notes}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: false,
      render: (val) => (
        <span
          className={`font-mono text-xs uppercase px-2 py-0.5 rounded-sm border ${
            val === PRODUCT_TYPES.SERVICE
              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800'
              : 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'sales_price',
      label: 'Sales Price',
      sortable: true,
      render: (val) => <MoneyText amount={val} className="text-xs font-semibold" />,
    },
    {
      key: 'cost_price',
      label: 'Cost Price',
      sortable: false,
      render: (val) => <MoneyText amount={val} className="text-xs text-muted-foreground" />,
    },
    {
      key: 'tax',
      label: 'Tax',
      sortable: false,
      render: (_, row) =>
        row.tax ? (
          <span className="font-mono text-xs text-foreground">
            {row.tax.name} ({formatRate(row.tax.rate, row.tax.type)})
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">No Tax</span>
        ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={Boolean(val)} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {isAdmin ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/products/${row.id}/edit`);
                }}
                className="h-8 w-8 p-0"
                title="Edit Product"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductToDelete(row);
                  setDeleteDialogOpen(true);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete Product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${row.id}/edit`);
              }}
              className="h-8 w-8 p-0"
              title="View Product"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Products"
        description="Manage services and goods, base pricing, tax assignments, and attribute variants (PRD-01)."
        breadcrumbs={[
          { label: 'Catalog', href: '/products' },
          { label: 'Products' },
        ]}
        actions={
          isAdmin && (
            <Button
              onClick={() => navigate('/products/new')}
              size="sm"
              className="font-mono text-xs uppercase"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Product
            </Button>
          )
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search products by name..."
        filters={[
          {
            key: 'type',
            label: 'Type',
            placeholder: 'All Types',
            value: typeFilter,
            onChange: (val) => {
              setTypeFilter(val);
              setPage(1);
            },
            options: [
              { label: 'Service', value: PRODUCT_TYPES.SERVICE },
              { label: 'Goods', value: PRODUCT_TYPES.GOODS },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            placeholder: 'All Statuses',
            value: activeFilter,
            onChange: (val) => {
              setActiveFilter(val);
              setPage(1);
            },
            options: [
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setTypeFilter('');
          setActiveFilter('');
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        sort={sortField}
        direction={sortDirection}
        onSort={handleSort}
        meta={meta}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
        onRowClick={(row) => navigate(`/products/${row.id}/edit`)}
        emptyTitle="No Products Found"
        emptyDescription="Create your first goods or service product to start selling."
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product?"
        description={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? If used by active subscriptions or invoices, it cannot be deleted.`
            : 'This action cannot be undone.'
        }
        confirmText="Delete Product"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

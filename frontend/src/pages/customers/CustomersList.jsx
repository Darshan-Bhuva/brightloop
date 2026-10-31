import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Building,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { customerSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export default function CustomersList() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [customers, setCustomers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Sorting
  const [search, setSearch] = useState('')
  const [hasLoginFilter, setHasLoginFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        sort: sortField,
        direction: sortDir,
      }
      if (search.trim()) params.search = search.trim()
      if (hasLoginFilter !== 'all') params.has_login = hasLoginFilter === 'true'

      const response = await getCustomers(params)
      setCustomers(response.data || [])
      if (response.meta) {
        setMeta(response.meta)
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, hasLoginFilter, sortField, sortDir])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Customer Form (Create or Edit)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
      address_line: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    },
  })

  const openCreateDialog = () => {
    setEditingCustomer(null)
    reset({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      address_line: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (c) => {
    setEditingCustomer(c)
    setValue('name', c.name || '')
    setValue('email', c.email || '')
    setValue('phone', c.phone || '')
    setValue('company_name', c.company_name || '')
    setValue('address_line', c.address_line || '')
    setValue('city', c.city || '')
    setValue('state', c.state || '')
    setValue('country', c.country || '')
    setValue('postal_code', c.postal_code || '')
    setDialogOpen(true)
  }

  const onCustomerSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        company_name: data.company_name?.trim() || null,
        address_line: data.address_line?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        postal_code: data.postal_code?.trim() || null,
      }

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload)
        toast.success(`Customer "${payload.name}" updated successfully.`)
      } else {
        await createCustomer(payload)
        toast.success(`Customer "${payload.name}" created successfully.`)
      }

      setDialogOpen(false)
      fetchCustomers()
    } catch (err) {
      handleApiError(err, setError)
    }
  }

  // Delete customer (Admin only)
  const confirmDelete = (c) => {
    setCustomerToDelete(c)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!customerToDelete) return
    setIsDeleting(true)
    try {
      await deleteCustomer(customerToDelete.id)
      toast.success(`Customer "${customerToDelete.name}" deleted.`)
      setDeleteConfirmOpen(false)
      setCustomerToDelete(null)
      fetchCustomers()
    } catch (err) {
      // 409 conflict handled gracefully in toast
      handleApiError(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px]">
              CUS-01..05
            </Badge>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Subscriber Directory
            </span>
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
            Customers
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Browse accounts, corporate contacts, and subscription statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            NEW CUSTOMER
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-10 text-xs"
            />
          </div>

          <Select
            value={hasLoginFilter}
            onValueChange={(val) => {
              setHasLoginFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 text-xs font-mono">
              <SelectValue placeholder="Portal Access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL PORTAL ACCESS</SelectItem>
              <SelectItem value="true">PORTAL LOGIN ACTIVE</SelectItem>
              <SelectItem value="false">NO LOGIN REGISTERED</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortField}-${sortDir}`}
            onValueChange={(val) => {
              const [field, dir] = val.split('-')
              setSortField(field)
              setSortDir(dir)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 text-xs font-mono">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">NEWEST CREATED</SelectItem>
              <SelectItem value="created_at-asc">OLDEST CREATED</SelectItem>
              <SelectItem value="name-asc">NAME (A-Z)</SelectItem>
              <SelectItem value="name-desc">NAME (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="border-border p-2">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
                Customer Accounts
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {meta.total} PROFILES
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
              className="h-8 text-xs font-mono"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              REFRESH
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Portal Login
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Active Subs
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Created
                </TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm font-mono text-muted-foreground">
                    LOADING CUSTOMERS...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm font-mono text-muted-foreground">
                    NO CUSTOMERS RECORDED
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="border-b border-border/60 hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-sans font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {c.name}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                        {c.company_name && (
                          <span className="font-sans text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3" />
                            {c.company_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col font-mono text-xs">
                        <span className="text-foreground">{c.email}</span>
                        {c.phone && (
                          <span className="text-muted-foreground mt-0.5">{c.phone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.has_login ? (
                        <Badge variant="default" className="text-[10px]">
                          REGISTERED
                        </Badge>
                      ) : (
                        <Badge variant="subtle" className="text-[10px]">
                          NO LOGIN
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-xs">
                        {c.active_subscriptions_count ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-sm shadow-none">
                          <DropdownMenuItem asChild>
                            <Link to={`/customers/${c.id}`} className="cursor-pointer font-sans text-xs">
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(c)}
                            className="cursor-pointer font-sans text-xs"
                          >
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            Edit Details
                          </DropdownMenuItem>
                          {/* Delete customer is ADMIN ONLY per contract */}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(c)}
                                className="cursor-pointer font-sans text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Customer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground mt-4 gap-3">
              <div className="font-mono text-[11px]">
                PAGE <span className="text-foreground font-semibold">{meta.current_page}</span> OF{' '}
                <span className="text-foreground font-semibold">{meta.last_page}</span> ({meta.total} TOTAL)
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 text-xs font-mono"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  PREV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs font-mono"
                >
                  NEXT
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight">
              {editingCustomer ? 'Update Customer' : 'Register New Customer'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Customer record used for invoice generation and contract billing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust_name" className="font-mono text-xs uppercase tracking-wide">
                  Name <span className="text-primary">*</span>
                </Label>
                <Input id="cust_name" placeholder="Contact Name" {...register('name')} />
                {errors.name && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust_email" className="font-mono text-xs uppercase tracking-wide">
                  Email <span className="text-primary">*</span>
                </Label>
                <Input
                  id="cust_email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust_company" className="font-mono text-xs uppercase tracking-wide">
                  Company Name
                </Label>
                <Input
                  id="cust_company"
                  placeholder="Acme Enterprise"
                  {...register('company_name')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust_phone" className="font-mono text-xs uppercase tracking-wide">
                  Phone
                </Label>
                <Input
                  id="cust_phone"
                  placeholder="+91 9876543210"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_address" className="font-mono text-xs uppercase tracking-wide">
                Address Line
              </Label>
              <Input
                id="cust_address"
                placeholder="404 Tech Tower, Phase 2"
                {...register('address_line')}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust_city" className="font-mono text-xs uppercase tracking-wide">
                  City
                </Label>
                <Input id="cust_city" placeholder="Ahmedabad" {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust_state" className="font-mono text-xs uppercase tracking-wide">
                  State
                </Label>
                <Input id="cust_state" placeholder="Gujarat" {...register('state')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust_country" className="font-mono text-xs uppercase tracking-wide">
                  Country
                </Label>
                <Input id="cust_country" placeholder="India" {...register('country')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust_zip" className="font-mono text-xs uppercase tracking-wide">
                  Postal Code
                </Label>
                <Input id="cust_zip" placeholder="380015" {...register('postal_code')} />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                CANCEL
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'SAVING...'
                  : editingCustomer
                  ? 'UPDATE CUSTOMER'
                  : 'SAVE CUSTOMER'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Admin only) */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight text-destructive">
              Delete Customer Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete customer "{customerToDelete?.name}"?
              <br />
              <span className="font-mono text-destructive text-[11px] mt-1 block">
                Rule CUS-05: Customer cannot be deleted if active subscriptions or unsettled invoices exist.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              CANCEL
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'DELETING...' : 'DELETE RECORD'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { getSubscriptions } from '@/api/subscriptions'
import { customerSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [customer, setCustomer] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSubs, setIsLoadingSubs] = useState(true)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCustomerData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getCustomer(id)
      setCustomer(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const fetchCustomerSubscriptions = useCallback(async () => {
    setIsLoadingSubs(true)
    try {
      const res = await getSubscriptions({ customer_id: id })
      setSubscriptions(res.data || [])
    } catch {
      // Mock / fallback if subscriptions endpoint is not yet ready until M4
      setSubscriptions([])
    } finally {
      setIsLoadingSubs(false)
    }
  }, [id])

  useEffect(() => {
    fetchCustomerData()
    fetchCustomerSubscriptions()
  }, [fetchCustomerData, fetchCustomerSubscriptions])

  // Edit Customer Form
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
  })

  const openEdit = () => {
    if (!customer) return
    setValue('name', customer.name || '')
    setValue('email', customer.email || '')
    setValue('phone', customer.phone || '')
    setValue('company_name', customer.company_name || '')
    setValue('address_line', customer.address_line || '')
    setValue('city', customer.city || '')
    setValue('state', customer.state || '')
    setValue('country', customer.country || '')
    setValue('postal_code', customer.postal_code || '')
    setEditDialogOpen(true)
  }

  const onEditSubmit = async (data) => {
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

      const response = await updateCustomer(id, payload)
      setCustomer(response.data)
      toast.success('Customer profile updated successfully.')
      setEditDialogOpen(false)
    } catch (err) {
      handleApiError(err, setError)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCustomer(id)
      toast.success('Customer deleted successfully.')
      navigate('/customers', { replace: true })
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">ACTIVE</Badge>
      case 'paused':
        return <Badge variant="secondary">PAUSED</Badge>
      case 'quotation':
        return <Badge variant="outline">QUOTATION</Badge>
      case 'draft':
        return <Badge variant="subtle">DRAFT</Badge>
      case 'closed':
        return <Badge variant="destructive">CLOSED</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        LOADING CUSTOMER PROFILE...
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Button asChild variant="outline" size="sm">
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
        <div className="rounded-sm border border-border p-8 text-center font-mono text-sm text-muted-foreground">
          Customer not found or access denied.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 gap-4">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 h-8 text-xs font-mono">
            <Link to="/customers">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              BACK TO CUSTOMERS
            </Link>
          </Button>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">
              CUS-03
            </Badge>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Customer ID #{customer.id}
            </span>
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
            {customer.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={openEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            EDIT PROFILE
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              DELETE
            </Button>
          )}
        </div>
      </div>

      {/* Customer Profile Card */}
      <Card className="border-border">
        <CardHeader className="p-6 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Corporate identification and billing registration details.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {customer.has_login ? (
                <Badge variant="default" className="text-[10px]">
                  PORTAL REGISTERED (USER #{customer.user_id})
                </Badge>
              ) : (
                <Badge variant="subtle" className="text-[10px]">
                  UNREGISTERED ACCOUNT
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </span>
              <p className="font-mono text-sm text-foreground font-medium">{customer.email}</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </span>
              <p className="font-mono text-sm text-foreground font-medium">
                {customer.phone || 'Not provided'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                Company
              </span>
              <p className="font-sans text-sm text-foreground font-medium">
                {customer.company_name || 'Individual'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/60">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Billing Address
              </span>
              <p className="font-sans text-sm text-foreground">
                {customer.address_line || 'No street address set'}
              </p>
              {(customer.city || customer.state || customer.country) && (
                <p className="font-sans text-xs text-muted-foreground">
                  {[customer.city, customer.state, customer.postal_code, customer.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Active Subscriptions
              </span>
              <p className="font-sans text-sm text-foreground font-bold">
                {customer.active_subscriptions_count ?? 0} active service tier(s)
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Customer Since
              </span>
              <p className="font-mono text-xs text-foreground font-medium">
                {customer.created_at ? new Date(customer.created_at).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Linked to Customer */}
      <Card className="border-border p-2">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
                Linked Subscriptions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Subscription orders and contracts belonging to this customer profile.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-mono">
              <Link to="/subscriptions/new">
                + NEW SUBSCRIPTION
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Subscription #
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Plan Tier
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Start Date
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Expiry Date
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSubs ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs font-mono text-muted-foreground">
                    CHECKING SUBSCRIPTION CONTRACTS...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs font-mono text-muted-foreground">
                    NO SUBSCRIPTIONS FOUND FOR THIS CUSTOMER
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-b border-border/60 hover:bg-muted/50">
                    <TableCell className="font-mono font-bold text-xs text-foreground">
                      <Link
                        to={`/subscriptions/${sub.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {sub.number || `SUB-${sub.id}`}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell className="font-sans font-medium text-sm">
                      {sub.plan?.name || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sub.start_date || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sub.expiry_date || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs">
                      ₹{sub.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight">
              Edit Customer Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify contact and invoicing details for this account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust_name_edit" className="font-mono text-xs uppercase tracking-wide">
                  Name <span className="text-primary">*</span>
                </Label>
                <Input id="cust_name_edit" {...register('name')} />
                {errors.name && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust_email_edit" className="font-mono text-xs uppercase tracking-wide">
                  Email <span className="text-primary">*</span>
                </Label>
                <Input id="cust_email_edit" type="email" {...register('email')} />
                {errors.email && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust_comp_edit" className="font-mono text-xs uppercase tracking-wide">
                  Company Name
                </Label>
                <Input id="cust_comp_edit" {...register('company_name')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust_phone_edit" className="font-mono text-xs uppercase tracking-wide">
                  Phone
                </Label>
                <Input id="cust_phone_edit" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_addr_edit" className="font-mono text-xs uppercase tracking-wide">
                Address
              </Label>
              <Input id="cust_addr_edit" {...register('address_line')} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c_city" className="font-mono text-xs uppercase tracking-wide">
                  City
                </Label>
                <Input id="c_city" {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_state" className="font-mono text-xs uppercase tracking-wide">
                  State
                </Label>
                <Input id="c_state" {...register('state')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_country" className="font-mono text-xs uppercase tracking-wide">
                  Country
                </Label>
                <Input id="c_country" {...register('country')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_zip" className="font-mono text-xs uppercase tracking-wide">
                  Postal Code
                </Label>
                <Input id="c_zip" {...register('postal_code')} />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(false)}
              >
                CANCEL
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'UPDATING...' : 'UPDATE CUSTOMER'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Admin only) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Delete Customer Record
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete customer "{customer.name}"?
              <br />
              <span className="font-mono text-destructive text-[11px] mt-1.5 block">
                Rule CUS-05: Customer cannot be deleted if active subscriptions or unsettled invoices exist.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
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
              {isDeleting ? 'DELETING...' : 'DELETE PERMANENTLY'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

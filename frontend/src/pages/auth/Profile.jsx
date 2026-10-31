import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { User, Mail, Phone, Building, MapPin, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, getMe } from '@/api/auth'
import { updateProfileSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Profile() {
  const { user, customer, role, updateUser } = useAuth()
  const isCustomer = role === 'customer'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: customer?.phone || '',
      company_name: customer?.company_name || '',
      address_line: customer?.address_line || '',
      city: customer?.city || '',
      state: customer?.state || '',
      country: customer?.country || '',
      postal_code: customer?.postal_code || '',
    },
  })

  useEffect(() => {
    async function loadFreshData() {
      try {
        const res = await getMe()
        const freshUser = res.data.user
        const freshCustomer = res.data.customer
        updateUser(freshUser, freshCustomer)

        reset({
          name: freshUser?.name || '',
          phone: freshCustomer?.phone || '',
          company_name: freshCustomer?.company_name || '',
          address_line: freshCustomer?.address_line || '',
          city: freshCustomer?.city || '',
          state: freshCustomer?.state || '',
          country: freshCustomer?.country || '',
          postal_code: freshCustomer?.postal_code || '',
        })
      } catch {
        // Fallback to context
      }
    }
    loadFreshData()
  }, [reset, updateUser])

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
      }

      if (isCustomer) {
        payload.phone = data.phone?.trim() || null
        payload.company_name = data.company_name?.trim() || null
        payload.address_line = data.address_line?.trim() || null
        payload.city = data.city?.trim() || null
        payload.state = data.state?.trim() || null
        payload.country = data.country?.trim() || null
        payload.postal_code = data.postal_code?.trim() || null
      }

      const response = await updateProfile(payload)
      const updatedUser = response.data.user
      const updatedCustomer = response.data.customer

      updateUser(updatedUser, updatedCustomer)
      reset({
        name: updatedUser.name,
        phone: updatedCustomer?.phone || '',
        company_name: updatedCustomer?.company_name || '',
        address_line: updatedCustomer?.address_line || '',
        city: updatedCustomer?.city || '',
        state: updatedCustomer?.state || '',
        country: updatedCustomer?.country || '',
        postal_code: updatedCustomer?.postal_code || '',
      })
      toast.success('Profile updated successfully.')
    } catch (err) {
      handleApiError(err, setError)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="outline" className="text-[10px]">
            AUTH-07
          </Badge>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Account Management
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
              User Profile
            </h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">
              Manage your personal information, contact numbers, and corporate credentials.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={role === 'admin' ? 'destructive' : 'default'} className="text-xs uppercase">
              {role}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-border">
          <CardHeader className="p-6 pb-4 border-b border-border">
            <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isCustomer
                ? 'Your contact and organization information will be shown on generated invoices.'
                : 'Administrative accounts can update their display name.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wide">
                  Full Name <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="User Name"
                    {...register('name')}
                    className="pl-9"
                  />
                </div>
                {errors.name && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Address (Immutable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide">
                    Email Address
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    (Immutable)
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-9 bg-muted/50 cursor-not-allowed font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Customer-specific profile fields */}
            {isCustomer && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company & Invoicing Details
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="company_name" className="font-mono text-xs uppercase tracking-wide">
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company_name"
                        placeholder="Company Ltd."
                        {...register('company_name')}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wide">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        {...register('phone')}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address_line" className="font-mono text-xs uppercase tracking-wide">
                    Street Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address_line"
                      placeholder="123 Industrial Park, Phase 1"
                      {...register('address_line')}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="font-mono text-xs uppercase tracking-wide">
                      City
                    </Label>
                    <Input id="city" placeholder="Ahmedabad" {...register('city')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="font-mono text-xs uppercase tracking-wide">
                      State
                    </Label>
                    <Input id="state" placeholder="Gujarat" {...register('state')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="font-mono text-xs uppercase tracking-wide">
                      Country
                    </Label>
                    <Input id="country" placeholder="India" {...register('country')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="font-mono text-xs uppercase tracking-wide">
                      Postal Code
                    </Label>
                    <Input id="postal_code" placeholder="380015" {...register('postal_code')} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between p-6 border-t border-border">
            <span className="font-mono text-xs text-muted-foreground">
              {isDirty ? 'Unsaved changes pending' : 'All settings up to date'}
            </span>
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

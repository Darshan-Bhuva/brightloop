import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Lock, Mail, User, Phone, Building } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { register as apiRegister } from '@/api/auth'
import { registerSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'
import PasswordChecklist from '@/components/common/PasswordChecklist'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      company_name: '',
    },
    mode: 'onChange',
  })

  const passwordValue = watch('password', '')

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        password_confirmation: data.password_confirmation,
      }
      if (data.phone?.trim()) payload.phone = data.phone.trim()
      if (data.company_name?.trim()) payload.company_name = data.company_name.trim()

      const response = await apiRegister(payload)
      const { user, token } = response.data
      const customer = response.data.customer || null
      login(token, user, customer)

      navigate('/portal', { replace: true })
    } catch (err) {
      handleApiError(err, setError)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16 dark:bg-background">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" subtitle="Industrial Subscription Suite" />
        </div>

        <Card className="rounded-md border border-border p-2">
          <CardHeader className="space-y-1 p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-bold text-foreground uppercase">
                Create Account
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                AUTH-01
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Sign up as a customer to manage your subscriptions and invoices.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wide">
                  Full Name <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
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

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide">
                  Email Address <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                    className="pl-9"
                  />
                </div>
                {errors.email && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wide">
                    Phone (optional)
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
                  {errors.phone && (
                    <p className="font-mono text-xs text-destructive mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_name" className="font-mono text-xs uppercase tracking-wide">
                    Company (optional)
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      placeholder="Acme Corp"
                      {...register('company_name')}
                      className="pl-9"
                    />
                  </div>
                  {errors.company_name && (
                    <p className="font-mono text-xs text-destructive mt-1">
                      {errors.company_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wide">
                  Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="•••••••••"
                    {...register('password')}
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Live Password Checklist */}
              <PasswordChecklist password={passwordValue} />

              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation" className="font-mono text-xs uppercase tracking-wide">
                  Confirm Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="•••••••••"
                    {...register('password_confirmation')}
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
                {errors.password_confirmation && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border p-6 pt-4">
            <div className="font-sans text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

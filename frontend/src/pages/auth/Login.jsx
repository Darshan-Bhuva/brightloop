import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { login as apiLogin } from '@/api/auth'
import { loginSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'

export default function Login() {
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const response = await apiLogin({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      })

      const { user, token } = response.data
      const customer = response.data.customer || null
      login(token, user, customer)

      const fromPath = location.state?.from?.pathname
      const destination =
        fromPath && fromPath !== '/login'
          ? fromPath
          : user.role === 'customer'
          ? '/portal'
          : '/dashboard'

      navigate(destination, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message

      if (status === 401) {
        setServerError(msg || 'Invalid email or password.')
      } else if (status === 403) {
        setServerError(msg || 'Account is deactivated.')
      } else if (status === 422) {
        handleApiError(err, setError)
      } else {
        setServerError(msg || 'Login failed. Please check your credentials.')
      }
    }
  }

  const fillDemo = (email, password) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', password, { shouldValidate: true })
    setServerError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16 dark:bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex justify-center">
          <Logo size="lg" subtitle="Industrial Subscription Suite" />
        </div>

        <Card className="rounded-md border border-border p-2">
          <CardHeader className="space-y-1 p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-bold text-foreground uppercase">
                Sign In
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                AUTH-02
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Provide credentials to enter your management console.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {serverError && (
              <div className="flex items-center gap-2.5 rounded-sm border border-primary bg-primary/10 p-3 text-xs text-primary font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@brightloop.test"
                    {...register('email')}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wide">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="•••••••••"
                    {...register('password')}
                    className="pl-9"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'AUTHENTICATING...' : 'SIGN IN'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border p-6 pt-4">
            <div className="text-center font-sans text-xs text-muted-foreground">
              New customer?{' '}
              <Link to="/register" className="font-semibold text-foreground hover:text-primary transition-colors">
                Register account
              </Link>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="w-full pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Seeded Logins
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-8"
                  onClick={() => fillDemo('admin@brightloop.test', 'Admin@12345')}
                >
                  ADMIN
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-8"
                  onClick={() => fillDemo('staff@brightloop.test', 'Staff@12345')}
                >
                  STAFF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-8"
                  onClick={() => fillDemo('customer@brightloop.test', 'Customer@12345')}
                >
                  CUSTOMER
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

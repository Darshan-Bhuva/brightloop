import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { resetPassword as apiResetPassword } from '@/api/auth'
import { resetPasswordSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'
import PasswordChecklist from '@/components/common/PasswordChecklist'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [resetSuccess, setResetSuccess] = useState(false)

  const queryParams = new URLSearchParams(location.search)
  const initialToken = queryParams.get('token') || ''
  const initialEmail = queryParams.get('email') || ''

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: initialToken,
      email: initialEmail,
      password: '',
      password_confirmation: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (initialToken) setValue('token', initialToken)
    if (initialEmail) setValue('email', initialEmail)
  }, [initialToken, initialEmail, setValue])

  const passwordValue = watch('password', '')

  const onSubmit = async (data) => {
    try {
      await apiResetPassword({
        token: data.token,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        password_confirmation: data.password_confirmation,
      })

      setResetSuccess(true)
      toast.success('Password updated successfully. Please sign in with your new password.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    } catch (err) {
      handleApiError(err, setError)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16 dark:bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" subtitle="Industrial Subscription Suite" />
        </div>

        <Card className="rounded-md border border-border p-2">
          <CardHeader className="space-y-1 p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-bold text-foreground uppercase">
                New Password
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                AUTH-06
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Define a compliant new password for your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {resetSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-sm border border-emerald-500/30 bg-emerald-50/50 p-4 text-xs font-mono text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Password Reset Successful</p>
                    <p className="font-sans text-muted-foreground mt-1">
                      Redirecting to sign in screen...
                    </p>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link to="/login">Sign In Now</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register('token')} />

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
                    />
                  </div>
                  {errors.email && (
                    <p className="font-mono text-xs text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wide">
                    New Password
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

                {/* Password Criteria Checklist */}
                <PasswordChecklist password={passwordValue} />

                <div className="space-y-1.5">
                  <Label htmlFor="password_confirmation" className="font-mono text-xs uppercase tracking-wide">
                    Confirm Password
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

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? 'UPDATING PASSWORD...' : 'RESET PASSWORD'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border p-6 pt-4">
            <Link
              to="/login"
              className="flex items-center text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              BACK TO SIGN IN
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

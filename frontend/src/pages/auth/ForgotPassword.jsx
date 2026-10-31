import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { forgotPassword as apiForgotPassword } from '@/api/auth'
import { forgotPasswordSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'

export default function ForgotPassword() {
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await apiForgotPassword({
        email: data.email.toLowerCase().trim(),
      })
      setSuccessMessage(
        response.message || 'If the email exists, a reset link has been sent.'
      )
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
                Reset Password
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                AUTH-05
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your work email address to receive password recovery instructions.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {successMessage ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-sm border border-emerald-500/30 bg-emerald-50/50 p-4 text-xs font-mono text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{successMessage}</p>
                    <p className="font-sans text-muted-foreground mt-1">
                      Check your email inbox or local server logs for the password reset link.
                    </p>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            ) : (
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

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? 'SENDING LINK...' : 'SEND RESET LINK'}
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

import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'
import apiClient from '@/api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token, user } = response.data
      login(token, user)

      const destination =
        location.state?.from?.pathname ||
        (user.role === 'customer' ? '/portal' : '/dashboard')
      navigate(destination, { replace: true })
    } catch (err) {
      // In M0 mock mode or before backend auth is running
      const seededUsers = {
        'admin@brightloop.test': { id: 1, name: 'Admin User', email: 'admin@brightloop.test', role: 'admin', is_active: true, customer_id: null },
        'staff@brightloop.test': { id: 2, name: 'Staff User', email: 'staff@brightloop.test', role: 'staff', is_active: true, customer_id: null },
        'customer@brightloop.test': { id: 3, name: 'Customer User', email: 'customer@brightloop.test', role: 'customer', is_active: true, customer_id: 1 },
      }

      const mockUser = seededUsers[email.toLowerCase()]
      if (mockUser && password.length >= 6) {
        const dummyToken = 'demo_mock_token_' + mockUser.role
        login(dummyToken, mockUser)
        const destination =
          location.state?.from?.pathname ||
          (mockUser.role === 'customer' ? '/portal' : '/dashboard')
        navigate(destination, { replace: true })
      } else {
        setError(
          err?.response?.data?.message ||
            'Invalid credentials. Please click a demo profile below to test.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
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
              <CardTitle className="font-sans text-xl font-bold text-foreground">
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
            {error && (
              <div className="flex items-center gap-2.5 rounded-sm border border-primary bg-primary/10 p-3 text-xs text-primary font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@brightloop.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'AUTHENTICATING...' : 'SIGN IN'}
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
                  Seed Accounts
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

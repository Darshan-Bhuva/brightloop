import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The page you are looking for does not exist or you might not have access to it.
      </p>
      <Button asChild className="mt-6" variant="default">
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  )
}


import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Registration form with live password checklist arrives in Module M1.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground text-center">
            Password requirements: 9+ chars, 1 uppercase, 1 lowercase, 1 special character.
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


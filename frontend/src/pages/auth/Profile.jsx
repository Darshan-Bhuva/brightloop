import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Profile() {
  const { user, role } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
          Account Profile
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Identity, role authorization, and personal profile metadata.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans text-base font-semibold">Profile Identity</CardTitle>
            <Badge variant="default" className="text-xs uppercase">
              {role || 'GUEST'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Full profile update contract (AUTH-07) arrives in Module M1.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="border-b border-border/60 pb-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Full Name</span>
            <p className="font-sans text-sm font-semibold text-foreground mt-1">{user?.name || 'Unauthenticated'}</p>
          </div>
          <div className="pb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email Address</span>
            <p className="font-mono text-sm text-foreground mt-1">{user?.email || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

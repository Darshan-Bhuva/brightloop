import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function SubscriptionDetail() {
  const { id } = useParams()
  return (
    <PlaceholderPage
      title={`Subscription #${id}`}
      module="M4"
      description="Lifecycle stepper, allowed actions (quotation, confirm, activate, pause, resume, close, renew), and line totals (SUB-03)."
    />
  )
}


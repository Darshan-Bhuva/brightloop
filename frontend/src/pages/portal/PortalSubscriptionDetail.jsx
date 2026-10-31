import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function PortalSubscriptionDetail() {
  const { id } = useParams()
  return (
    <PlaceholderPage
      title={`My Subscription #${id}`}
      module="M7"
      description="Subscription status, plan details, and allowed customer self-serve actions (pause, resume, close, renew)."
    />
  )
}


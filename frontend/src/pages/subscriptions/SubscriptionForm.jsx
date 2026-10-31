import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function SubscriptionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      title={isEdit ? `Edit Subscription #${id}` : 'Create Subscription'}
      module="M4"
      description="Template prefill, customer and plan picker, lines repeater, and live price estimation (SUB-02, SUB-04)."
    />
  )
}


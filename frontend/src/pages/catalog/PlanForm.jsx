import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function PlanForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      title={isEdit ? `Edit Plan #${id}` : 'Create New Plan'}
      module="M3"
      description="Plan settings including auto-close, closable, pausable, and renewable rules (PLN-02, PLN-04)."
    />
  )
}


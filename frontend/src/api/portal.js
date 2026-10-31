import apiClient from './client'
import { mockable } from './mockable'
import { mockGetPortalSummary } from '@/mocks/reports'

/**
 * PORTAL-01 Customer Summary (Customer)
 * Returns { active_subscriptions, next_billing_date, outstanding_amount, overdue_count, recent_invoices }
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getPortalSummary() {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/portal/summary')
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetPortalSummary()
        }
        throw err
      }
    },
    () => mockGetPortalSummary()
  )
}


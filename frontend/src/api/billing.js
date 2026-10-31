import apiClient from './client'
import { mockable } from './mockable'
import { mockGetDueSubscriptions, mockRunBilling } from '@/mocks/billing'

/**
 * BIL-01 Due list (Admin, Staff)
 * Query: as_of_date, page, per_page
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getDueSubscriptions(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/billing/due', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetDueSubscriptions(params)
        }
        throw err
      }
    },
    () => mockGetDueSubscriptions(params)
  )
}

/**
 * BIL-02 Run billing (Admin, Staff)
 * Body: as_of_date, subscription_ids
 * @param {{ as_of_date?: string, subscription_ids?: number[] }} [data]
 * @returns {Promise<{ success: boolean, message: string, data: { as_of_date: string, processed: number, invoices_created: number, skipped: number, failed: number, auto_closed: number, failures: object[] } }>}
 */
export async function runBilling(data = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.post('/billing/run', data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockRunBilling(data)
        }
        throw err
      }
    },
    () => mockRunBilling(data)
  )
}


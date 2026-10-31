import apiClient from './client'
import { mockable } from './mockable'
import { mockGetPayments } from '@/mocks/payments'

/**
 * PAY-01 List Payments (Admin, Staff all; Customer own)
 * Filters: customer_id, invoice_id, method, search
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getPayments(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/payments', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetPayments(params)
        }
        throw err
      }
    },
    () => mockGetPayments(params)
  )
}

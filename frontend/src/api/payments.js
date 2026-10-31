import apiClient from './client'
import { mockable } from './mockable'
import {
  mockGetPayments,
  mockRecordPayment,
  mockDeletePayment,
} from '@/mocks/payments'

/**
 * PAY-01 List Payments (Admin, Staff all; Customer own)
 * Filters: customer_id, invoice_id, method, date_from, date_to, search
 * Sort: payment_date|amount|created_at (default payment_date desc)
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

/**
 * PAY-02 Record Payment (Admin, Staff)
 * Body: invoice_id, method, amount, payment_date, reference?, note?
 * @param {{ invoice_id: number, method: string, amount: number|string, payment_date: string, reference?: string, note?: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: { payment: object, invoice: object } }>}
 */
export async function recordPayment(data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post('/payments', data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockRecordPayment(data)
        }
        throw err
      }
    },
    () => mockRecordPayment(data)
  )
}

/**
 * PAY-03 Delete Payment (Admin only - P2)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function deletePayment(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.delete(`/payments/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockDeletePayment(id)
        }
        throw err
      }
    },
    () => mockDeletePayment(id)
  )
}

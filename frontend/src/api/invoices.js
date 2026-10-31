import apiClient from './client'
import { mockable } from './mockable'
import { mockGetInvoices, mockGetInvoice } from '@/mocks/invoices'

/**
 * INV-01 List Invoices (Admin, Staff all; Customer own, never draft)
 * Filters: status, customer_id, subscription_id, overdue (true), invoice_from, invoice_to, due_from, due_to, search
 * Sort: number|invoice_date|due_date|total|amount_due
 * @param {object} [params]
 * @param {string} [role='admin']
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getInvoices(params = {}, role = 'admin') {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/invoices', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetInvoices(params, role)
        }
        throw err
      }
    },
    () => mockGetInvoices(params, role)
  )
}

/**
 * INV-02 Show Invoice (Admin, Staff; Customer own)
 * @param {number|string} id
 * @param {string} [role='admin']
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getInvoice(id, role = 'admin') {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/invoices/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetInvoice(id, role)
        }
        throw err
      }
    },
    () => mockGetInvoice(id, role)
  )
}


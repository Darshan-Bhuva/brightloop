import apiClient from './client'
import { mockable } from './mockable'
import {
  mockGetInvoices,
  mockGetInvoice,
  mockUpdateInvoice,
  mockConfirmInvoice,
  mockCancelInvoice,
  mockSendInvoice,
  mockBulkConfirmInvoices,
} from '@/mocks/invoices'

/**
 * INV-01 List invoices (Admin, Staff all; Customer own, never draft)
 * Filters: status, customer_id, subscription_id, overdue, invoice_from, invoice_to, due_from, due_to, search
 * Sort: number|invoice_date|due_date|total|amount_due (default invoice_date desc)
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
 * INV-02 Show invoice (with lines, payments, and allowed_actions)
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

/**
 * INV-03 Update invoice (only draft)
 * @param {number|string} id
 * @param {{ due_date?: string, notes?: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateInvoice(id, data) {
  return mockable(
    async () => {
      try {
        return await apiClient.put(`/invoices/${id}`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockUpdateInvoice(id, data)
        }
        throw err
      }
    },
    () => mockUpdateInvoice(id, data)
  )
}

/**
 * INV-04 Confirm invoice (draft -> confirmed)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function confirmInvoice(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/invoices/${id}/confirm`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockConfirmInvoice(id)
        }
        throw err
      }
    },
    () => mockConfirmInvoice(id)
  )
}

/**
 * INV-05 Cancel invoice (draft/confirmed -> cancelled)
 * @param {number|string} id
 * @param {{ reason?: string }} [data]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function cancelInvoice(id, data = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/invoices/${id}/cancel`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockCancelInvoice(id, data)
        }
        throw err
      }
    },
    () => mockCancelInvoice(id, data)
  )
}

/**
 * INV-06 Send invoice (confirmed/paid)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function sendInvoice(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/invoices/${id}/send`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSendInvoice(id)
        }
        throw err
      }
    },
    () => mockSendInvoice(id)
  )
}

/**
 * INV-07 Bulk confirm invoices (Admin, Staff)
 * @param {{ ids: number[] }} data
 * @returns {Promise<{ success: boolean, message: string, data: { confirmed: number, skipped: object[] } }>}
 */
export async function bulkConfirmInvoices(data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post('/invoices/bulk-confirm', data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockBulkConfirmInvoices(data)
        }
        throw err
      }
    },
    () => mockBulkConfirmInvoices(data)
  )
}

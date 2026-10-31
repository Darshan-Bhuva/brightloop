import apiClient from './client'
import { mockable } from './mockable'
import {
  mockGetQuotationTemplates,
  mockGetQuotationTemplate,
  mockCreateQuotationTemplate,
  mockUpdateQuotationTemplate,
  mockDeleteQuotationTemplate,
} from '@/mocks/quotations'

/**
 * TPL-01 List quotation templates (Admin, Staff)
 * Supports search, all=1
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getQuotationTemplates(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/quotation-templates', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetQuotationTemplates(params)
        }
        throw err
      }
    },
    () => mockGetQuotationTemplates(params)
  )
}

/**
 * TPL-02 Create quotation template (Admin, Staff)
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createQuotationTemplate(data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post('/quotation-templates', data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockCreateQuotationTemplate(data)
        }
        throw err
      }
    },
    () => mockCreateQuotationTemplate(data)
  )
}

/**
 * TPL-03 Show quotation template (Admin, Staff)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getQuotationTemplate(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/quotation-templates/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetQuotationTemplate(id)
        }
        throw err
      }
    },
    () => mockGetQuotationTemplate(id)
  )
}

/**
 * TPL-04 Update quotation template (Admin, Staff)
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateQuotationTemplate(id, data) {
  return mockable(
    async () => {
      try {
        return await apiClient.put(`/quotation-templates/${id}`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockUpdateQuotationTemplate(id, data)
        }
        throw err
      }
    },
    () => mockUpdateQuotationTemplate(id, data)
  )
}

/**
 * TPL-05 Delete quotation template (Admin, Staff)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function deleteQuotationTemplate(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.delete(`/quotation-templates/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockDeleteQuotationTemplate(id)
        }
        throw err
      }
    },
    () => mockDeleteQuotationTemplate(id)
  )
}

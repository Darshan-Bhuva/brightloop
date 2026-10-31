import apiClient from './client'
import { mockable } from './mockable'
import {
  mockGetSubscriptions,
  mockGetSubscription,
  mockCreateSubscription,
  mockUpdateSubscription,
  mockDeleteSubscription,
  mockSendQuotation,
  mockConfirmSubscription,
  mockActivateSubscription,
  mockPauseSubscription,
  mockResumeSubscription,
  mockCloseSubscription,
  mockRenewSubscription,
  mockAttachDiscount,
  mockDetachDiscount,
} from '@/mocks/subscriptions'

/**
 * SUB-01 List subscriptions (Admin, Staff all; Customer own)
 * Filters: status, customer_id, plan_id, is_paused, start_from, start_to, expiry_from, expiry_to, search
 * Sort: number|start_date|expiry_date|total|created_at
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getSubscriptions(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/subscriptions', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetSubscriptions(params)
        }
        throw err
      }
    },
    () => mockGetSubscriptions(params)
  )
}

/**
 * SUB-02 Create subscription (Admin, Staff)
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createSubscription(data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post('/subscriptions', data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockCreateSubscription(data)
        }
        throw err
      }
    },
    () => mockCreateSubscription(data)
  )
}

/**
 * SUB-03 Show subscription (Admin, Staff; Customer own)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/subscriptions/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetSubscription(id)
        }
        throw err
      }
    },
    () => mockGetSubscription(id)
  )
}

/**
 * SUB-04 Update subscription (Admin, Staff) - only draft or quotation
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateSubscription(id, data) {
  return mockable(
    async () => {
      try {
        return await apiClient.put(`/subscriptions/${id}`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockUpdateSubscription(id, data)
        }
        throw err
      }
    },
    () => mockUpdateSubscription(id, data)
  )
}

/**
 * SUB-05 Delete subscription (Admin, Staff) - only draft
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function deleteSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.delete(`/subscriptions/${id}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockDeleteSubscription(id)
        }
        throw err
      }
    },
    () => mockDeleteSubscription(id)
  )
}

/**
 * SUB-06 Send quotation (Admin, Staff) - draft -> quotation
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function sendQuotation(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/send-quotation`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSendQuotation(id)
        }
        throw err
      }
    },
    () => mockSendQuotation(id)
  )
}

/**
 * SUB-07 Confirm subscription (Admin, Staff) - quotation -> confirmed
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function confirmSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/confirm`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockConfirmSubscription(id)
        }
        throw err
      }
    },
    () => mockConfirmSubscription(id)
  )
}

/**
 * SUB-08 Activate subscription (Admin, Staff) - confirmed -> active
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function activateSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/activate`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockActivateSubscription(id)
        }
        throw err
      }
    },
    () => mockActivateSubscription(id)
  )
}

/**
 * SUB-09 Pause subscription (Admin, Staff, Customer own) - active -> paused
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function pauseSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/pause`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockPauseSubscription(id)
        }
        throw err
      }
    },
    () => mockPauseSubscription(id)
  )
}

/**
 * SUB-10 Resume subscription (Admin, Staff, Customer own) - active+paused -> resumed
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function resumeSubscription(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/resume`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockResumeSubscription(id)
        }
        throw err
      }
    },
    () => mockResumeSubscription(id)
  )
}

/**
 * SUB-11 Close subscription (Admin, Staff, Customer own) - confirmed/active -> closed
 * @param {number|string} id
 * @param {{ reason?: string }} [data]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function closeSubscription(id, data = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/close`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockCloseSubscription(id, data)
        }
        throw err
      }
    },
    () => mockCloseSubscription(id, data)
  )
}

/**
 * SUB-12 Renew subscription (Admin, Staff, Customer own)
 * @param {number|string} id
 * @param {{ new_expiry_date: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function renewSubscription(id, data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/renew`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockRenewSubscription(id, data)
        }
        throw err
      }
    },
    () => mockRenewSubscription(id, data)
  )
}

/**
 * SUB-13 Attach discount (Admin, Staff)
 * @param {number|string} id
 * @param {{ discount_id: number|string }} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function attachDiscount(id, data) {
  return mockable(
    async () => {
      try {
        return await apiClient.post(`/subscriptions/${id}/discounts`, data)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockAttachDiscount(id, data)
        }
        throw err
      }
    },
    () => mockAttachDiscount(id, data)
  )
}

/**
 * SUB-14 Detach discount (Admin, Staff)
 * @param {number|string} id
 * @param {number|string} discountId
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function detachDiscount(id, discountId) {
  return mockable(
    async () => {
      try {
        return await apiClient.delete(`/subscriptions/${id}/discounts/${discountId}`)
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockDetachDiscount(id, discountId)
        }
        throw err
      }
    },
    () => mockDetachDiscount(id, discountId)
  )
}

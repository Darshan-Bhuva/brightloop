import apiClient from './client'

/**
 * SUB-01 List subscriptions
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object }>}
 */
export async function getSubscriptions(params = {}) {
  return apiClient.get('/subscriptions', { params })
}


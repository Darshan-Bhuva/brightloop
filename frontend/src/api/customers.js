import apiClient from './client'

/**
 * CUS-01 List customers (Admin, Staff)
 * Filters: search, has_login. Sort: name|created_at. Supports all=1.
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object|null }>}
 */
export async function getCustomers(params = {}) {
  return apiClient.get('/customers', { params })
}

/**
 * CUS-02 Create customer (Admin, Staff)
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createCustomer(data) {
  return apiClient.post('/customers', data)
}

/**
 * CUS-03 Show customer (Admin, Staff)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getCustomer(id) {
  return apiClient.get(`/customers/${id}`)
}

/**
 * CUS-04 Update customer (Admin, Staff)
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateCustomer(id, data) {
  return apiClient.put(`/customers/${id}`, data)
}

/**
 * CUS-05 Delete customer (Admin only)
 * 409 if customer has subscriptions in confirmed|active or invoices with amount_due > 0.
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function deleteCustomer(id) {
  return apiClient.delete(`/customers/${id}`)
}


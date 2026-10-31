import apiClient from './client'

/**
 * USR-01 List users (Admin only)
 * Filters: role, is_active, search. Sort: name|email|created_at. Direction: asc|desc. Paginated.
 * @param {object} [params]
 * @returns {Promise<{ success: boolean, message: string, data: object[], meta: object }>}
 */
export async function getUsers(params = {}) {
  return apiClient.get('/users', { params })
}

/**
 * USR-02 Create staff (Admin only)
 * @param {{ name: string, email: string, password: string, password_confirmation: string, role: 'staff' }} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createStaff(data) {
  return apiClient.post('/users', data)
}

/**
 * USR-03 Show user (Admin only)
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getUser(id) {
  return apiClient.get(`/users/${id}`)
}

/**
 * USR-04 Update user (Admin only)
 * Body: name?, is_active?, password?. Email immutable. Cannot deactivate yourself.
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateUser(id, data) {
  return apiClient.put(`/users/${id}`, data)
}


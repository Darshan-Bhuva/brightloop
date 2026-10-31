import apiClient from './client'

/**
 * AUTH-01 Register customer account (public)
 * @param {{ name: string, email: string, password: string, password_confirmation: string, phone?: string, company_name?: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: { user: object, token: string, token_type: string } }>}
 */
export async function register(data) {
  return apiClient.post('/auth/register', data)
}

/**
 * AUTH-02 Login (public)
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ success: boolean, message: string, data: { user: object, token: string, token_type: string } }>}
 */
export async function login(credentials) {
  return apiClient.post('/auth/login', credentials)
}

/**
 * AUTH-03 Logout (authenticated)
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function logout() {
  return apiClient.post('/auth/logout')
}

/**
 * AUTH-04 Current authenticated user & customer profile
 * @returns {Promise<{ success: boolean, message: string, data: { user: object, customer: object|null } }>}
 */
export async function getMe() {
  return apiClient.get('/auth/me')
}

/**
 * AUTH-05 Forgot password
 * @param {{ email: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function forgotPassword(data) {
  return apiClient.post('/auth/forgot-password', data)
}

/**
 * AUTH-06 Reset password
 * @param {{ token: string, email: string, password: string, password_confirmation: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: null }>}
 */
export async function resetPassword(data) {
  return apiClient.post('/auth/reset-password', data)
}

/**
 * AUTH-07 Update profile
 * @param {object} data
 * @returns {Promise<{ success: boolean, message: string, data: { user: object, customer: object|null } }>}
 */
export async function updateProfile(data) {
  return apiClient.put('/auth/me', data)
}

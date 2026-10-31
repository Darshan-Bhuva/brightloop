import apiClient from './client'

/**
 * SYS-01 Ping (public)
 * Returns { success: true, message: "OK", data: { app: "Brightloop", time: ts }, meta: null }
 */
export async function ping() {
  return apiClient.get('/ping')
}

/**
 * SYS-02 Ping auth (any logged in user)
 * Returns { success: true, message: "OK", data: { user: User }, meta: null }
 */
export async function pingAuth() {
  return apiClient.get('/ping/auth')
}


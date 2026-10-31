import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const TOKEN_KEY = 'bl_token'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 and errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:logout'))
      
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
      if (!publicPaths.some((path) => window.location.pathname.startsWith(path))) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient


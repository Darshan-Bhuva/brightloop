import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TOKEN_KEY } from '@/api/client'
import { pingAuth } from '@/api/system'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setRole(null)
  }, [])

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
    setRole(newUser?.role || null)
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData }
      if (merged.role) {
        setRole(merged.role)
      }
      return merged
    })
  }, [])

  // Verify token on mount or token change
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await pingAuth()
        if (isMounted) {
          const authUser = response?.data?.user || response?.data
          if (authUser) {
            setUser(authUser)
            setRole(authUser.role)
            setToken(storedToken)
          } else {
            logout()
          }
        }
      } catch {
        // If 401 or network error on pingAuth
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    const handleAuthLogout = () => {
      if (isMounted) {
        logout()
      }
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => {
      isMounted = false
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [logout])

  const value = {
    user,
    role,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

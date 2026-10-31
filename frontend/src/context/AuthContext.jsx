import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TOKEN_KEY } from '@/api/client'
import { getMe, logout as apiLogout } from '@/api/auth'
import { pingAuth } from '@/api/system'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(async (callApi = false) => {
    if (callApi && localStorage.getItem(TOKEN_KEY)) {
      try {
        await apiLogout()
      } catch {
        // Ignore API failures on logout
      }
    }
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setCustomer(null)
    setRole(null)
  }, [])

  const login = useCallback((newToken, newUser, newCustomer = null) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
    setCustomer(newCustomer)
    setRole(newUser?.role || null)
  }, [])

  const updateUser = useCallback((updatedUserData, updatedCustomerData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData }
      if (merged.role) {
        setRole(merged.role)
      }
      return merged
    })
    if (updatedCustomerData !== undefined) {
      setCustomer(updatedCustomerData)
    }
  }, [])

  // Verify token and hydrate user on boot
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
        // Try getMe (AUTH-04) first, fallback to pingAuth (SYS-02)
        let authUser = null
        let authCustomer = null
        try {
          const res = await getMe()
          authUser = res?.data?.user
          authCustomer = res?.data?.customer
        } catch {
          const pingRes = await pingAuth()
          authUser = pingRes?.data?.user || pingRes?.data
        }

        if (isMounted) {
          if (authUser) {
            setUser(authUser)
            setCustomer(authCustomer)
            setRole(authUser.role)
            setToken(storedToken)
          } else {
            logout(false)
          }
        }
      } catch {
        if (isMounted) {
          logout(false)
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
        logout(false)
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
    customer,
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

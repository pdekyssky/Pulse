/**
 * Provides authenticated session state and login/logout actions.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { fetchCurrentUser, loginRequest, logoutRequest } from '../lib/api/auth.ts'
import { ApiError } from '../lib/api/client.ts'
import type { AuthUser, LoginFormInput } from '../types/auth.ts'
import { AuthContext } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const restoreSession = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
      if (error instanceof ApiError && error.status !== 401) {
        console.error('Failed to restore session', error)
      }
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  const login = useCallback(async (input: LoginFormInput) => {
    const response = await loginRequest(input)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        console.error('Failed to log out', error)
      }
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
    }),
    [user, isInitializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

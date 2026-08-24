/**
 * React context type for authenticated session state.
 */

import { createContext } from 'react'

import type { AuthUser, LoginFormInput } from '../types/auth.ts'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (input: LoginFormInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

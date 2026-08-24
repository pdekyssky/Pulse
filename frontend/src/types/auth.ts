/**
 * Authentication types aligned with the Express auth API.
 */

export type AuthRole = 'admin' | 'manager' | 'user'

export const authRoleLabels: Record<AuthRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  user: 'User',
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AuthRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: AuthUser
}

export interface LoginFormInput {
  email: string
  password: string
}

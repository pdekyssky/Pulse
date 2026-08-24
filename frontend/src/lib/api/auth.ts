import type { AuthUser, LoginRequest, LoginResponse } from '../../types/auth.ts'
import { apiRequest } from './client.ts'

export function loginRequest(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}

export function logoutRequest(): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
  })
}

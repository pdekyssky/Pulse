/**
 * TypeScript types for team members, roles, and form inputs.
 */

export type UserRole = 'admin' | 'engineer' | 'responder' | 'viewer'

export type UserStatus = 'active' | 'inactive' | 'invited'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joinedAt: string
  avatar: string | null
}

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  engineer: 'Engineer',
  responder: 'Responder',
  viewer: 'Viewer',
}

export const userStatusLabels: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  invited: 'Invited',
}

export interface UserFormInput {
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

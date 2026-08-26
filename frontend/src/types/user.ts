/**
 * TypeScript types for team members, roles, and form inputs.
 * Roles match the Express User model: admin, manager, user.
 */

export type UserRole = 'admin' | 'manager' | 'user'

export const manageableUserRoles = ['admin', 'manager', 'user'] as const

export type ManageableUserRole = (typeof manageableUserRoles)[number]

export function isManageableUserRole(role: string): role is ManageableUserRole {
  return (manageableUserRoles as readonly string[]).includes(role)
}

export type UserStatus = 'active' | 'inactive'

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
  manager: 'Manager',
  user: 'User',
}

export const userStatusLabels: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export interface UserFormInput {
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: UserRole
}

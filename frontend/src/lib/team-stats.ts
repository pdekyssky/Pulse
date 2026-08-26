/**
 * User filtering, sorting, and roster summary stats.
 */

import type { UserListParams } from '../types/api/user.ts'
import type { User, UserRole, UserStatus } from '../types/user.ts'

export interface TeamStatsSummary {
  total: number
  active: number
  managers: number
  admins: number
}

export function computeTeamStats(members: User[]): TeamStatsSummary {
  return {
    total: members.length,
    active: members.filter((member) => member.status === 'active').length,
    managers: members.filter((member) => member.role === 'manager').length,
    admins: members.filter((member) => member.role === 'admin').length,
  }
}

export type TeamFilterRole = UserRole | 'all'

export type TeamFilterStatus = UserStatus | 'all'

export interface TeamFilters {
  search: string
  role: TeamFilterRole
  status: TeamFilterStatus
}

export const defaultTeamFilters: TeamFilters = {
  search: '',
  role: 'all',
  status: 'all',
}

export function filterTeamMembers(members: User[], filters: TeamFilters): User[] {
  const search = filters.search.trim().toLowerCase()

  return members.filter((member) => {
    const matchesSearch =
      search.length === 0 ||
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search)

    const matchesRole = filters.role === 'all' || member.role === filters.role
    const matchesStatus = filters.status === 'all' || member.status === filters.status

    return matchesSearch && matchesRole && matchesStatus
  })
}

export function sortTeamMembers(members: User[]): User[] {
  const statusOrder: Record<UserStatus, number> = {
    active: 0,
    inactive: 1,
  }

  return [...members].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    return a.name.localeCompare(b.name)
  })
}

export function buildUserListParams(
  filters: TeamFilters,
  page: number,
  pageSize: number,
): UserListParams {
  const params: UserListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.role !== 'all') {
    params.role = filters.role
  }
  if (filters.status === 'active') {
    params.is_active = true
  }
  if (filters.status === 'inactive') {
    params.is_active = false
  }

  return params
}

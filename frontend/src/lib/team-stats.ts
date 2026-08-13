/**
 * Team member filtering, sorting, and roster summary stats.
 */

import type { User, UserRole, UserStatus } from '../types/user.ts'

export interface TeamStatsSummary {
  total: number
  active: number
  engineers: number
  admins: number
}

export function computeTeamStats(members: User[]): TeamStatsSummary {
  return {
    total: members.length,
    active: members.filter((member) => member.status === 'active').length,
    engineers: members.filter((member) => member.role === 'engineer').length,
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
    invited: 1,
    inactive: 2,
  }

  return [...members].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    return a.name.localeCompare(b.name)
  })
}

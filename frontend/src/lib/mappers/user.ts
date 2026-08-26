import type { ApiUser } from '../../types/api/user.ts'
import type { User, UserRole, UserStatus } from '../../types/user.ts'

const USER_ROLES = new Set<UserRole>(['admin', 'manager', 'user'])

function mapApiUserRole(role: string): UserRole {
  if (USER_ROLES.has(role as UserRole)) {
    return role as UserRole
  }
  return 'user'
}

/** Map backend user record to the existing UI member shape. */
export function mapApiUserToTeamUser(api: ApiUser): User {
  const status: UserStatus = api.is_active ? 'active' : 'inactive'

  return {
    id: String(api.id),
    name: api.name,
    email: api.email,
    role: mapApiUserRole(api.role),
    status,
    joinedAt: api.created_at,
    avatar: null,
  }
}

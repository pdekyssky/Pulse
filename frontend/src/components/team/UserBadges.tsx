/**
 * Role and status badge components for team members.
 */

import type { UserRole, UserStatus } from '../../types/user.ts'
import { userRoleLabels, userStatusLabels } from '../../types/user.ts'
import { cn } from '../../lib/utils.ts'

interface UserRoleBadgeProps {
  role: UserRole
  className?: string
}

const roleStyles: Record<UserRole, string> = {
  admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  manager: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  user: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

export default function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        roleStyles[role],
        className,
      )}
    >
      {userRoleLabels[role]}
    </span>
  )
}

interface UserStatusBadgeProps {
  status: UserStatus
  className?: string
}

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status],
        className,
      )}
    >
      {userStatusLabels[status]}
    </span>
  )
}

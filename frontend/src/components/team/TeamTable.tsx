/**
 * Table of team members with view, edit, and deactivate actions.
 */

import { Inbox, SearchX } from 'lucide-react'

import type { User } from '../../types/user.ts'
import Card from '../ui/Card.tsx'
import TeamRow, { TeamMobileCard } from './TeamRow.tsx'

interface TeamTableProps {
  members: User[]
  totalCount: number
  readOnly?: boolean
  isAdmin?: boolean
  currentUserId?: string | null
  adminCount?: number
  activeAdminCount?: number
  onView: (member: User) => void
  onEdit?: (member: User) => void
  onToggleActive?: (member: User) => void
  onChangeRole?: (member: User) => void
  onDelete?: (member: User) => void
  onCopyEmail?: (member: User) => void
}

export default function TeamTable({
  members,
  totalCount,
  readOnly = false,
  isAdmin = false,
  currentUserId = null,
  adminCount = 0,
  activeAdminCount = 0,
  onView,
  onEdit,
  onToggleActive,
  onChangeRole,
  onDelete,
  onCopyEmail,
}: TeamTableProps) {
  const hasNoMembers = totalCount === 0
  const hasNoMatches = !hasNoMembers && members.length === 0

  const rowProps = (member: User) => ({
    member,
    readOnly,
    isAdmin,
    isSelf: currentUserId !== null && member.id === currentUserId,
    isLastAdmin: member.role === 'admin' && adminCount <= 1,
    isLastActiveAdmin:
      member.role === 'admin' && member.status === 'active' && activeAdminCount <= 1,
    onView,
    onEdit,
    onToggleActive,
    onChangeRole,
    onDelete,
    onCopyEmail,
  })

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          Users
          <span className="ml-2 text-sm font-normal text-gray-500">({totalCount})</span>
        </h3>
      </div>

      {members.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Created</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <TeamRow
                    key={member.id}
                    {...rowProps(member)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:hidden">
            {members.map((member) => (
              <TeamMobileCard
                key={member.id}
                {...rowProps(member)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState hasNoMembers={hasNoMembers} hasNoMatches={hasNoMatches} />
      )}
    </Card>
  )
}

function EmptyState({
  hasNoMembers,
  hasNoMatches,
}: {
  hasNoMembers: boolean
  hasNoMatches: boolean
}) {
  if (hasNoMembers) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Inbox className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No users yet</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Users appear here after they are created through Add User or registration.
        </p>
      </div>
    )
  }

  if (hasNoMatches) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <SearchX className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No matching users</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Try adjusting your search or filters to find who you are looking for.
        </p>
      </div>
    )
  }

  return null
}

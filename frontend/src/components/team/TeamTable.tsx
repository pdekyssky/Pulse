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
  onView: (member: User) => void
  onEdit: (member: User) => void
  onDeactivate: (member: User) => void
}

export default function TeamTable({
  members,
  totalCount,
  onView,
  onEdit,
  onDeactivate,
}: TeamTableProps) {
  const hasNoMembers = totalCount === 0
  const hasNoMatches = !hasNoMembers && members.length === 0

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          Team Members
          <span className="ml-2 text-sm font-normal text-gray-500">({members.length})</span>
        </h3>
      </div>

      {members.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Joined</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <TeamRow
                    key={member.id}
                    member={member}
                    onView={onView}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:hidden">
            {members.map((member) => (
              <TeamMobileCard
                key={member.id}
                member={member}
                onView={onView}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
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
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No team members yet</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Add your first team member to start managing roles and access.
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
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No matching members</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Try adjusting your search or filters to find who you are looking for.
        </p>
      </div>
    )
  }

  return null
}

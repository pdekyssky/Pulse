/**
 * Slide-over panel showing member profile details.
 */

import { X } from 'lucide-react'

import type { User } from '../../types/user.ts'
import { formatJoinDate, getInitials } from '../../lib/format.ts'
import { userRoleLabels } from '../../types/user.ts'
import UserRoleBadge, { UserStatusBadge } from './UserBadges.tsx'

interface MemberDetailsProps {
  member: User | null
  readOnly?: boolean
  onClose: () => void
  onEdit?: (member: User) => void
}

export default function MemberDetails({
  member,
  readOnly = false,
  onClose,
  onEdit,
}: MemberDetailsProps) {
  if (!member) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close member details"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-pulse-100 text-sm font-semibold text-pulse-700">
              {getInitials(member.name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="mt-0.5 text-sm text-gray-500">{member.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <UserRoleBadge role={member.role} />
                <UserStatusBadge status={member.status} />
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <DetailStat label="Role" value={userRoleLabels[member.role]} />
            <DetailStat label="Status" value={member.status} />
            <DetailStat label="Joined" value={formatJoinDate(member.joinedAt)} />
            <DetailStat label="Member ID" value={member.id} />
          </div>
        </div>

        {!readOnly && onEdit && (
          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                onEdit(member)
                onClose()
              }}
              className="inline-flex w-full items-center justify-center rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700"
            >
              Edit Member
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  )
}

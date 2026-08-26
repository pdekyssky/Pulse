/**
 * Dialog for changing a team member's role.
 */

import { useEffect, useState } from 'react'
import { Shield, X } from 'lucide-react'

import type { User } from '../../types/user.ts'
import {
  isManageableUserRole,
  manageableUserRoles,
  userRoleLabels,
  type ManageableUserRole,
} from '../../types/user.ts'

interface ChangeUserRoleDialogProps {
  member: User | null
  onClose: () => void
  onConfirm: (role: ManageableUserRole) => void | Promise<void>
  isPending?: boolean
  error?: string | null
}

export default function ChangeUserRoleDialog({
  member,
  onClose,
  onConfirm,
  isPending = false,
  error = null,
}: ChangeUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<ManageableUserRole>('user')

  useEffect(() => {
    if (!member) {
      return
    }

    setSelectedRole(isManageableUserRole(member.role) ? member.role : 'user')
  }, [member])

  if (!member) {
    return null
  }

  const currentRoleLabel = userRoleLabels[member.role]
  const canSave = selectedRole.length > 0 && selectedRole !== member.role

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        disabled={isPending}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-role-title"
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-pulse-100 text-pulse-700">
                <Shield className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="change-role-title" className="text-lg font-semibold text-gray-900">
                  Change role
                </h3>
                <p className="text-sm text-gray-500">{member.name}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-gray-600">
              Current role:{' '}
              <span className="font-medium text-gray-900">{currentRoleLabel}</span>
            </p>

            <label htmlFor="user-role" className="mt-4 block text-sm font-medium text-gray-700">
              New role
            </label>
            <select
              id="user-role"
              value={selectedRole}
              disabled={isPending}
              onChange={(event) => setSelectedRole(event.target.value as ManageableUserRole)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none disabled:opacity-50"
            >
              {manageableUserRoles.map((role) => (
                <option key={role} value={role}>
                  {userRoleLabels[role]}
                </option>
              ))}
            </select>

            {member.role === 'admin' && selectedRole !== 'admin' && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This will remove admin access for {member.name}.
              </p>
            )}

            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirm(selectedRole)}
              disabled={isPending || !canSave}
              className="rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save role'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

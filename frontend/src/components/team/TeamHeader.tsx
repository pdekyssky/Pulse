/**
 * Team page header with add-member action.
 */

import { Plus } from 'lucide-react'

interface TeamHeaderProps {
  onAddClick: () => void
}

export default function TeamHeader({ onAddClick }: TeamHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Team</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage team members, roles, and access across your organization.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pulse-700"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add Member
      </button>
    </div>
  )
}

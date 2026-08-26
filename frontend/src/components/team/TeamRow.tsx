/**
 * Single team member row with role and status badges.
 */

import { useEffect, useRef, useState } from 'react'
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
} from 'lucide-react'

import type { User } from '../../types/user.ts'
import { formatJoinDate, getInitials } from '../../lib/format.ts'
import UserRoleBadge, { UserStatusBadge } from './UserBadges.tsx'

interface TeamRowProps {
  member: User
  readOnly?: boolean
  isAdmin?: boolean
  isSelf?: boolean
  isLastAdmin?: boolean
  isLastActiveAdmin?: boolean
  onView: (member: User) => void
  onEdit?: (member: User) => void
  onToggleActive?: (member: User) => void
  onChangeRole?: (member: User) => void
  onDelete?: (member: User) => void
  onCopyEmail?: (member: User) => void
}

export default function TeamRow({
  member,
  readOnly = false,
  isAdmin = false,
  isSelf = false,
  isLastAdmin = false,
  isLastActiveAdmin = false,
  onView,
  onEdit,
  onToggleActive,
  onChangeRole,
  onDelete,
  onCopyEmail,
}: TeamRowProps) {
  return (
    <tr className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700">
            {getInitials(member.name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="truncate text-xs text-gray-500 sm:hidden">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 md:table-cell">
        <span className="truncate">{member.email}</span>
      </td>
      <td className="py-4 pr-4">
        <UserRoleBadge role={member.role} />
      </td>
      <td className="py-4 pr-4">
        <UserStatusBadge status={member.status} />
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 lg:table-cell">
        {formatJoinDate(member.joinedAt)}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`View ${member.name}`}
            onClick={() => onView(member)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          {!readOnly && onEdit && (
            <button
              type="button"
              aria-label={`Edit ${member.name}`}
              onClick={() => onEdit(member)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          )}
          <MemberActionMenu
            member={member}
            isAdmin={isAdmin}
            isSelf={isSelf}
            isLastAdmin={isLastAdmin}
            isLastActiveAdmin={isLastActiveAdmin}
            onToggleActive={onToggleActive}
            onChangeRole={onChangeRole}
            onDelete={onDelete}
            onCopyEmail={onCopyEmail}
          />
        </div>
      </td>
    </tr>
  )
}

export function TeamMobileCard({
  member,
  readOnly = false,
  isAdmin = false,
  isSelf = false,
  isLastAdmin = false,
  isLastActiveAdmin = false,
  onView,
  onEdit,
  onToggleActive,
  onChangeRole,
  onDelete,
  onCopyEmail,
}: TeamRowProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700">
            {getInitials(member.name)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-500">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <UserStatusBadge status={member.status} />
          <MemberActionMenu
            member={member}
            isAdmin={isAdmin}
            isSelf={isSelf}
            isLastAdmin={isLastAdmin}
            isLastActiveAdmin={isLastActiveAdmin}
            onToggleActive={onToggleActive}
            onChangeRole={onChangeRole}
            onDelete={onDelete}
            onCopyEmail={onCopyEmail}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <UserRoleBadge role={member.role} />
        <span className="text-xs text-gray-500">Created {formatJoinDate(member.joinedAt)}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onView(member)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </button>
        {!readOnly && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

function MemberActionMenu({
  member,
  isAdmin,
  isSelf,
  isLastAdmin,
  isLastActiveAdmin,
  onToggleActive,
  onChangeRole,
  onDelete,
  onCopyEmail,
}: {
  member: User
  isAdmin: boolean
  isSelf: boolean
  isLastAdmin: boolean
  isLastActiveAdmin: boolean
  onToggleActive?: (member: User) => void
  onChangeRole?: (member: User) => void
  onDelete?: (member: User) => void
  onCopyEmail?: (member: User) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isActive = member.status === 'active'
  const cannotChangeStatus = (isSelf && isActive) || (isLastActiveAdmin && isActive)
  const cannotChangeRole = isSelf || isLastAdmin
  const cannotDelete = isSelf || isLastAdmin

  const statusDisabledReason = isSelf
    ? 'You cannot deactivate your own account'
    : isLastActiveAdmin
      ? 'At least one active admin is required'
      : undefined
  const roleDisabledReason = isSelf
    ? 'You cannot change your own admin role'
    : isLastAdmin
      ? 'At least one admin is required'
      : undefined
  const deleteDisabledReason = isSelf
    ? 'You cannot delete your own account'
    : isLastAdmin
      ? 'At least one admin is required'
      : undefined

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const copyEmail = async () => {
    await navigator.clipboard.writeText(member.email)
    onCopyEmail?.(member)
    setMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={`More actions for ${member.name}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <MenuButton icon={Copy} label="Copy email" onClick={copyEmail} />
          {isAdmin && (
            <>
              <MenuButton
                icon={isActive ? UserMinus : UserCheck}
                label={isActive ? 'Deactivate user' : 'Activate user'}
                disabled={cannotChangeStatus}
                title={cannotChangeStatus ? statusDisabledReason : undefined}
                onClick={() => {
                  onToggleActive?.(member)
                  setMenuOpen(false)
                }}
              />
              <MenuButton
                icon={Shield}
                label="Change role"
                disabled={cannotChangeRole}
                title={cannotChangeRole ? roleDisabledReason : undefined}
                onClick={() => {
                  onChangeRole?.(member)
                  setMenuOpen(false)
                }}
              />
              <MenuButton
                icon={Trash2}
                label="Delete user"
                destructive
                disabled={cannotDelete}
                title={cannotDelete ? deleteDisabledReason : undefined}
                onClick={() => {
                  onDelete?.(member)
                  setMenuOpen(false)
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
  title,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={
        destructive
          ? 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40'
          : 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

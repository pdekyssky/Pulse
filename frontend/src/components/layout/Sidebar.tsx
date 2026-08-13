/**
 * Dark navigation sidebar with active route highlighting.
 */

import { Activity, ChevronUp, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navItems } from '../../lib/navigation.ts'
import { cn } from '../../lib/utils.ts'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-white transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-pulse-600">
            <Activity className="size-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Pulse</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-pulse-600 text-white shadow-sm'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white',
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-hover"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-active">
              <User className="size-4 text-sidebar-muted" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Peter</p>
              <p className="truncate text-xs text-sidebar-muted">Engineer</p>
            </div>
            <ChevronUp className="size-4 shrink-0 text-sidebar-muted" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  )
}

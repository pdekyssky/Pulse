/**
 * Dark navigation sidebar with active route highlighting.
 */

import { Activity, LogOut, User } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.ts'
import { useUnreadNotificationCount } from '../../hooks/useNotificationsQuery.ts'
import { navItems } from '../../lib/navigation.ts'
import { cn } from '../../lib/utils.ts'
import { authRoleLabels } from '../../types/auth.ts'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { count: unreadCount } = useUnreadNotificationCount()

  const handleLogout = async () => {
    await logout()
    onClose()
    navigate('/login', { replace: true })
  }

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
              {({ isActive }) => (
                <>
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {path === '/notifications' && unreadCount > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                        isActive ? 'bg-white/20 text-white' : 'bg-pulse-600 text-white',
                      )}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-active">
              <User className="size-4 text-sidebar-muted" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name ?? 'User'}</p>
              <p className="truncate text-xs text-sidebar-muted">
                {user ? authRoleLabels[user.role] : 'Signed in'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

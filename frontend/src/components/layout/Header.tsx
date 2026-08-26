/**
 * Top header bar with mobile menu toggle, page title, and notification unread count.
 */

import { Bell, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useUnreadNotificationCount } from '../../hooks/useNotificationsQuery.ts'
import { getNavItemByPath } from '../../lib/navigation'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const currentPage = getNavItemByPath(pathname)
  const { count: unreadCount } = useUnreadNotificationCount()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
          {currentPage?.label ?? 'Pulse'}
        </h1>
      </div>

      <Link
        to="/notifications"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pulse-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  )
}

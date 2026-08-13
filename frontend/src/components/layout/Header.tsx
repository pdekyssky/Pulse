/**
 * Top header bar with mobile menu toggle and page title.
 */

import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { getNavItemByPath } from '../../lib/navigation'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const currentPage = getNavItemByPath(pathname)

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
    </header>
  )
}

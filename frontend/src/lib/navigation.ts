/**
 * Sidebar navigation items and route metadata.
 */

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  Server,
  Settings,
  Users,
} from 'lucide-react'

import type { NavItem } from '../types/navigation'

export const navItems: NavItem[] = [
  { label: 'Overview', path: '/overview', icon: LayoutDashboard },
  { label: 'Services', path: '/services', icon: Server },
  { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'Timeline', path: '/timeline', icon: Clock },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Team', path: '/team', icon: Users },
  { label: 'Notifications', path: '/notifications', icon: Inbox },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return navItems.find((item) => item.path === pathname)
}

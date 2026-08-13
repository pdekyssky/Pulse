/**
 * TypeScript types for sidebar navigation configuration.
 */

import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

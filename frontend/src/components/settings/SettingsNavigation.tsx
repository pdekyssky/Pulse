/**
 * Vertical nav for switching between settings sections.
 */

import {
  Bell,
  Link2,
  Settings2,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { SettingsSection } from '../../types/settings.ts'
import { settingsSectionLabels } from '../../types/settings.ts'
import { cn } from '../../lib/utils.ts'

interface SettingsNavigationProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

const sections: Array<{ id: SettingsSection; icon: LucideIcon }> = [
  { id: 'general', icon: Settings2 },
  { id: 'notifications', icon: Bell },
  { id: 'incidents', icon: ShieldAlert },
  { id: 'integrations', icon: Link2 },
]

export default function SettingsNavigation({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) {
  return (
    <nav aria-label="Settings sections" className="shrink-0 lg:w-56">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {sections.map(({ id, icon: Icon }) => {
          const isActive = activeSection === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-pulse-50 text-pulse-700 ring-1 ring-pulse-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {settingsSectionLabels[id]}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

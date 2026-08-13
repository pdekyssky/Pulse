/**
 * Third-party integration connection toggles.
 */

import { Mail, MessageSquare, Webhook } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { IntegrationId, IntegrationSetting } from '../../types/settings.ts'
import { integrationMeta } from '../../types/settings.ts'
import { cn } from '../../lib/utils.ts'
import SettingsPanel from './SettingsPanel.tsx'

interface IntegrationSettingsProps {
  integrations: IntegrationSetting[]
  onToggle: (id: IntegrationId) => void
}

const integrationIcons: Record<IntegrationId, LucideIcon> = {
  slack: MessageSquare,
  discord: MessageSquare,
  email: Mail,
  webhooks: Webhook,
}

export default function IntegrationSettingsPanel({
  integrations,
  onToggle,
}: IntegrationSettingsProps) {
  return (
    <SettingsPanel
      title="Integrations"
      description="Connect external services to send alerts and updates."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrations.map((integration) => {
          const meta = integrationMeta[integration.id]
          const Icon = integrationIcons[integration.id]

          return (
            <div
              key={integration.id}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{meta.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
                  </div>
                </div>
                <ConnectionBadge connected={integration.connected} />
              </div>
              <button
                type="button"
                onClick={() => onToggle(integration.id)}
                className={cn(
                  'mt-4 w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  integration.connected
                    ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    : 'border-pulse-200 bg-pulse-50 text-pulse-700 hover:bg-pulse-100',
                )}
              >
                {integration.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>
    </SettingsPanel>
  )
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        connected
          ? 'bg-green-50 text-green-700 ring-green-600/20'
          : 'bg-gray-100 text-gray-600 ring-gray-500/20',
      )}
    >
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  )
}

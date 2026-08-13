/**
 * Application settings hub with section navigation and toast feedback.
 */

import { useCallback, useState } from 'react'

import GeneralSettingsPanel from '../components/settings/GeneralSettings.tsx'
import IncidentSettingsPanel from '../components/settings/IncidentSettings.tsx'
import IntegrationSettingsPanel from '../components/settings/IntegrationSettings.tsx'
import NotificationSettingsPanel from '../components/settings/NotificationSettings.tsx'
import SettingsNavigation from '../components/settings/SettingsNavigation.tsx'
import Toast from '../components/ui/Toast.tsx'
import {
  defaultAppSettings,
  type AppSettings,
  type IntegrationId,
  type SettingsSection,
  settingsSectionLabels,
} from '../types/settings.ts'

export default function SettingsPage() {
  // Deep-clone defaults so nested edits don't mutate the shared template
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...defaultAppSettings,
    general: { ...defaultAppSettings.general },
    notifications: { ...defaultAppSettings.notifications },
    incidentManagement: { ...defaultAppSettings.incidentManagement },
    integrations: defaultAppSettings.integrations.map((item) => ({ ...item })),
  }))
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
  }, [])

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const handleIntegrationToggle = (id: IntegrationId) => {
    setSettings((current) => ({
      ...current,
      integrations: current.integrations.map((integration) =>
        integration.id === id
          ? { ...integration, connected: !integration.connected }
          : integration,
      ),
    }))
  }

  const renderSection = () => {
    // Swap the active settings panel based on sidebar selection
    switch (activeSection) {
      case 'general':
        return (
          <GeneralSettingsPanel
            settings={settings.general}
            onChange={(general) => setSettings((current) => ({ ...current, general }))}
            onSave={() => showToast('General settings have been updated.')}
          />
        )
      case 'notifications':
        return (
          <NotificationSettingsPanel
            settings={settings.notifications}
            onChange={(notifications) =>
              setSettings((current) => ({ ...current, notifications }))
            }
            onSave={() => showToast('Notification preferences have been updated.')}
          />
        )
      case 'incidents':
        return (
          <IncidentSettingsPanel
            settings={settings.incidentManagement}
            onChange={(incidentManagement) =>
              setSettings((current) => ({ ...current, incidentManagement }))
            }
            onSave={() => showToast('Incident management settings have been updated.')}
          />
        )
      case 'integrations':
        return (
          <IntegrationSettingsPanel
            integrations={settings.integrations}
            onToggle={handleIntegrationToggle}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage your organization and application preferences.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="min-w-0 flex-1">
          <h3 className="mb-4 text-sm font-medium text-gray-500 lg:hidden">
            {settingsSectionLabels[activeSection]}
          </h3>
          {renderSection()}
        </div>
      </div>

      <Toast message={toastMessage} onClose={dismissToast} />
    </div>
  )
}

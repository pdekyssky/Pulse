/**
 * Notification channel and alert preference settings.
 */

import type { NotificationSettings } from '../../types/settings.ts'
import { SettingsSaveButton } from './SettingsFormControls.tsx'
import Switch from '../ui/Switch.tsx'
import SettingsPanel from './SettingsPanel.tsx'

interface NotificationSettingsProps {
  settings: NotificationSettings
  onChange: (settings: NotificationSettings) => void
  onSave: () => void
}

export default function NotificationSettingsPanel({
  settings,
  onChange,
  onSave,
}: NotificationSettingsProps) {
  const update = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose which events trigger notifications for your team."
      footer={<SettingsSaveButton onClick={onSave} />}
    >
      <div className="divide-y divide-gray-100">
        <Switch
          label="Incident created"
          description="Notify when a new incident is opened."
          checked={settings.incidentCreated}
          onChange={(checked) => update('incidentCreated', checked)}
        />
        <Switch
          label="Incident assigned"
          description="Notify when an incident is assigned to a team member."
          checked={settings.incidentAssigned}
          onChange={(checked) => update('incidentAssigned', checked)}
        />
        <Switch
          label="Incident resolved"
          description="Notify when an incident is marked as resolved."
          checked={settings.incidentResolved}
          onChange={(checked) => update('incidentResolved', checked)}
        />
        <Switch
          label="Critical alerts"
          description="Send immediate notifications for critical-severity alerts."
          checked={settings.criticalAlerts}
          onChange={(checked) => update('criticalAlerts', checked)}
        />
        <Switch
          label="Service degradation"
          description="Notify when a monitored service enters degraded status."
          checked={settings.serviceDegradation}
          onChange={(checked) => update('serviceDegradation', checked)}
        />
      </div>
    </SettingsPanel>
  )
}

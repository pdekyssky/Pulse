/**
 * Incident management policy and escalation settings.
 */

import type { IncidentManagementSettings } from '../../types/settings.ts'
import { incidentPriorityLabels } from '../../types/incident.ts'
import type { IncidentPriority } from '../../types/incident.ts'
import {
  SettingsFormField,
  SettingsSaveButton,
} from './SettingsFormControls.tsx'
import { selectClassName } from '../../lib/settings-form.ts'
import Switch from '../ui/Switch.tsx'
import SettingsPanel from './SettingsPanel.tsx'

interface IncidentSettingsProps {
  settings: IncidentManagementSettings
  onChange: (settings: IncidentManagementSettings) => void
  onSave: () => void
}

export default function IncidentSettingsPanel({
  settings,
  onChange,
  onSave,
}: IncidentSettingsProps) {
  const update = <K extends keyof IncidentManagementSettings>(
    key: K,
    value: IncidentManagementSettings[K],
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <SettingsPanel
      title="Incident Management"
      description="Configure how incidents are created, assigned, and tracked."
      footer={<SettingsSaveButton onClick={onSave} />}
    >
      <div className="divide-y divide-gray-100">
        <Switch
          label="Automatically create incidents from critical alerts"
          description="Open a new incident when a critical alert is triggered."
          checked={settings.autoCreateFromCriticalAlerts}
          onChange={(checked) => update('autoCreateFromCriticalAlerts', checked)}
        />
        <Switch
          label="Require incident assignee"
          description="Prevent incidents from being saved without an assigned owner."
          checked={settings.requireAssignee}
          onChange={(checked) => update('requireAssignee', checked)}
        />
        <Switch
          label="Enable incident timeline"
          description="Track status changes, assignments, and comments on a timeline."
          checked={settings.enableTimeline}
          onChange={(checked) => update('enableTimeline', checked)}
        />
      </div>

      <div className="mt-4">
        <SettingsFormField label="Default Incident Priority">
          <select
            value={settings.defaultPriority}
            onChange={(event) =>
              update('defaultPriority', event.target.value as IncidentPriority)
            }
            className={selectClassName()}
          >
            {(Object.entries(incidentPriorityLabels) as Array<[IncidentPriority, string]>).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </SettingsFormField>
      </div>
    </SettingsPanel>
  )
}

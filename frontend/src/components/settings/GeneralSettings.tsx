/**
 * General organization and locale settings form.
 */

import type { GeneralSettings } from '../../types/settings.ts'
import { timezoneOptions } from '../../types/settings.ts'
import { incidentPriorityLabels } from '../../types/incident.ts'
import type { IncidentPriority } from '../../types/incident.ts'
import {
  SettingsFormField,
  SettingsSaveButton,
} from './SettingsFormControls.tsx'
import {
  inputClassName,
  selectClassName,
} from '../../lib/settings-form.ts'
import SettingsPanel from './SettingsPanel.tsx'

interface GeneralSettingsProps {
  settings: GeneralSettings
  onChange: (settings: GeneralSettings) => void
  onSave: () => void
}

export default function GeneralSettingsPanel({
  settings,
  onChange,
  onSave,
}: GeneralSettingsProps) {
  const update = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <SettingsPanel
      title="General"
      description="Configure your organization profile and default preferences."
      footer={<SettingsSaveButton onClick={onSave} />}
    >
      <div className="space-y-4">
        <SettingsFormField label="Organization Name">
          <input
            type="text"
            value={settings.organizationName}
            onChange={(event) => update('organizationName', event.target.value)}
            className={inputClassName()}
          />
        </SettingsFormField>

        <SettingsFormField label="Organization URL">
          <input
            type="url"
            value={settings.organizationUrl}
            onChange={(event) => update('organizationUrl', event.target.value)}
            className={inputClassName()}
            placeholder="https://example.com"
          />
        </SettingsFormField>

        <SettingsFormField label="Default Timezone">
          <select
            value={settings.timezone}
            onChange={(event) => update('timezone', event.target.value)}
            className={selectClassName()}
          >
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsFormField>

        <SettingsFormField label="Default Incident Priority">
          <select
            value={settings.defaultIncidentPriority}
            onChange={(event) =>
              update('defaultIncidentPriority', event.target.value as IncidentPriority)
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

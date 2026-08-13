/**
 * TypeScript types and defaults for application settings sections.
 */

export type SettingsSection = 'general' | 'notifications' | 'incidents' | 'integrations'

export type IntegrationId = 'slack' | 'discord' | 'email' | 'webhooks'

export interface GeneralSettings {
  organizationName: string
  organizationUrl: string
  timezone: string
  defaultIncidentPriority: 'critical' | 'high' | 'medium' | 'low'
}

export interface NotificationSettings {
  incidentCreated: boolean
  incidentAssigned: boolean
  incidentResolved: boolean
  criticalAlerts: boolean
  serviceDegradation: boolean
}

export interface IncidentManagementSettings {
  autoCreateFromCriticalAlerts: boolean
  requireAssignee: boolean
  enableTimeline: boolean
  defaultPriority: 'critical' | 'high' | 'medium' | 'low'
}

export interface IntegrationSetting {
  id: IntegrationId
  connected: boolean
}

export interface AppSettings {
  general: GeneralSettings
  notifications: NotificationSettings
  incidentManagement: IncidentManagementSettings
  integrations: IntegrationSetting[]
}

export const defaultAppSettings: AppSettings = {
  general: {
    organizationName: 'Pulse Operations',
    organizationUrl: 'https://pulse.example.com',
    timezone: 'UTC',
    defaultIncidentPriority: 'medium',
  },
  notifications: {
    incidentCreated: true,
    incidentAssigned: true,
    incidentResolved: true,
    criticalAlerts: true,
    serviceDegradation: false,
  },
  incidentManagement: {
    autoCreateFromCriticalAlerts: true,
    requireAssignee: true,
    enableTimeline: true,
    defaultPriority: 'medium',
  },
  integrations: [
    { id: 'slack', connected: true },
    { id: 'discord', connected: false },
    { id: 'email', connected: true },
    { id: 'webhooks', connected: false },
  ],
}

export const timezoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

export const integrationMeta: Record<
  IntegrationId,
  { name: string; description: string }
> = {
  slack: {
    name: 'Slack',
    description: 'Send incident and alert notifications to Slack channels.',
  },
  discord: {
    name: 'Discord',
    description: 'Post alerts and status updates to Discord servers.',
  },
  email: {
    name: 'Email',
    description: 'Deliver incident notifications via email to team members.',
  },
  webhooks: {
    name: 'Webhooks',
    description: 'Trigger custom HTTP endpoints when events occur.',
  },
}

export const settingsSectionLabels: Record<SettingsSection, string> = {
  general: 'General',
  notifications: 'Notifications',
  incidents: 'Incident Management',
  integrations: 'Integrations',
}

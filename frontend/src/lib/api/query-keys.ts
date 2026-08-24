export const queryKeys = {
  services: ['services'] as const,
  dashboardOverview: ['dashboard', 'overview'] as const,
  users: ['users'] as const,
  alerts: ['alerts'] as const,
  timeline: ['timeline'] as const,
  analytics: ['analytics'] as const,
  reports: ['reports'] as const,
  notifications: ['notifications'] as const,
  incidents: ['incidents'] as const,
  incident: (id: number) => ['incidents', id] as const,
  incidentEvents: (id: number) => ['incidents', id, 'events'] as const,
  incidentComments: (id: number) => ['incidents', id, 'comments'] as const,
}

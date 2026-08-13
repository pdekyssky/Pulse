/**
 * Provider that holds incident list state and mock CRUD operations.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { mockIncidents as initialIncidents } from '../data/incidents.ts'
import { mockUsers } from '../data/users.ts'
import {
  appendStatusChange,
  createIncidentFromInput,
} from '../lib/incident-utils.ts'
import type { CreateIncidentInput, Incident, IncidentStatus } from '../types/incident.ts'
import { IncidentsContext } from './incidents-context.ts'

export function IncidentsProvider({ children }: { children: ReactNode }) {
  // Local mock store — replaces API calls until backend is wired up
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)

  const addIncident = useCallback((input: CreateIncidentInput) => {
    const assignee = mockUsers.find((user) => user.id === input.assigneeId)
    const incident = createIncidentFromInput(
      input,
      incidents,
      assignee?.name ?? 'Unassigned',
    )

    setIncidents((current) => [incident, ...current])
    return incident
  }, [incidents])

  const updateIncident = useCallback((id: string, updates: Partial<Incident>) => {
    setIncidents((current) =>
      current.map((incident) => (incident.id === id ? { ...incident, ...updates } : incident)),
    )
  }, [])

  const changeIncidentStatus = useCallback((id: string, status: IncidentStatus) => {
    setIncidents((current) =>
      current.map((incident) => {
        if (incident.id !== id) {
          return incident
        }

        // appendStatusChange also appends timeline events and log entries
        return appendStatusChange(
          incident,
          status,
          `Status changed to ${status}.`,
          incident.assigneeId,
        )
      }),
    )
  }, [])

  const resolveIncident = useCallback((id: string) => {
    setIncidents((current) =>
      current.map((incident) => {
        if (incident.id !== id) {
          return incident
        }

        return appendStatusChange(
          incident,
          'resolved',
          'Incident resolved.',
          incident.assigneeId,
        )
      }),
    )
  }, [])

  // Stabilize context value to avoid unnecessary re-renders of consumers
  const value = useMemo(
    () => ({
      incidents,
      addIncident,
      updateIncident,
      changeIncidentStatus,
      resolveIncident,
    }),
    [incidents, addIncident, updateIncident, changeIncidentStatus, resolveIncident],
  )

  return <IncidentsContext.Provider value={value}>{children}</IncidentsContext.Provider>
}

/**
 * React context type and instance for shared incident state.
 */

import { createContext } from 'react'

import type {
  CreateIncidentInput,
  Incident,
  IncidentStatus,
} from '../types/incident.ts'

export interface IncidentsContextValue {
  incidents: Incident[]
  addIncident: (input: CreateIncidentInput) => Incident
  updateIncident: (id: string, updates: Partial<Incident>) => void
  changeIncidentStatus: (id: string, status: IncidentStatus) => void
  resolveIncident: (id: string) => void
}

export const IncidentsContext = createContext<IncidentsContextValue | null>(null)

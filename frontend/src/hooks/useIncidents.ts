/**
 * Hook to consume incident context; throws if used outside the provider.
 */

import { useContext } from 'react'

import { IncidentsContext } from '../context/incidents-context.ts'

export function useIncidents() {
  const context = useContext(IncidentsContext)
  if (!context) {
    throw new Error('useIncidents must be used within IncidentsProvider')
  }
  return context
}

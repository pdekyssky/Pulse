/**
 * Incident management page with filtering, detail panel, and create dialog.
 */

import { useMemo, useState } from 'react'

import { mockServices } from '../data/services.ts'
import { mockUsers } from '../data/users.ts'
import { useIncidents } from '../hooks/useIncidents.ts'
import CreateIncidentDialog from '../components/incidents/CreateIncidentDialog.tsx'
import IncidentDetailPanel from '../components/incidents/IncidentDetailPanel.tsx'
import IncidentFilters from '../components/incidents/IncidentFilters.tsx'
import IncidentsHeader from '../components/incidents/IncidentsHeader.tsx'
import IncidentSummaryCards from '../components/incidents/IncidentSummaryCards.tsx'
import IncidentTable from '../components/incidents/IncidentTable.tsx'
import type { IncidentFilters as IncidentFiltersState } from '../lib/incident-stats.ts'
import { filterIncidents, sortIncidents } from '../lib/incident-stats.ts'
import type { Incident } from '../types/incident.ts'

const initialFilters: IncidentFiltersState = {
  search: '',
  status: 'all',
  priority: 'all',
  serviceId: 'all',
  dateRange: 'all',
}

export default function IncidentsPage() {
  const { incidents, addIncident, changeIncidentStatus, resolveIncident } = useIncidents()
  const [filters, setFilters] = useState<IncidentFiltersState>(initialFilters)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filteredIncidents = useMemo(
    () => sortIncidents(filterIncidents(incidents, filters)),
    [incidents, filters],
  )

  // Look up selected incident from live state so detail panel stays in sync
  const selectedIncident = selectedIncidentId
    ? incidents.find((incident) => incident.id === selectedIncidentId) ?? null
    : null

  const handleCreate = (input: Parameters<typeof addIncident>[0]) => {
    const created = addIncident(input)
    setSelectedIncidentId(created.id) // Open detail panel for the new incident
  }

  const handleSelect = (incident: Incident) => {
    setSelectedIncidentId(incident.id)
  }

  const handleResolve = (incident: Incident) => {
    resolveIncident(incident.id)
  }

  return (
    <div className="space-y-6">
      <IncidentsHeader onCreateClick={() => setCreateOpen(true)} />
      <IncidentSummaryCards incidents={incidents} />
      <IncidentFilters filters={filters} services={mockServices} onChange={setFilters} />
      <IncidentTable
        incidents={filteredIncidents}
        services={mockServices}
        users={mockUsers}
        onSelectIncident={handleSelect}
        onResolveIncident={handleResolve}
      />

      <IncidentDetailPanel
        incident={selectedIncident}
        services={mockServices}
        users={mockUsers}
        onClose={() => setSelectedIncidentId(null)}
        onChangeStatus={changeIncidentStatus}
        onResolve={resolveIncident}
      />

      <CreateIncidentDialog
        open={createOpen}
        services={mockServices}
        users={mockUsers}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}

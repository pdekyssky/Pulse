/**
 * Incident management page with API-backed read-only list, filters, and detail panel.
 */

import { useMemo, useState } from 'react'

import QueryState from '../components/common/QueryState.tsx'
import IncidentDetailPanel from '../components/incidents/IncidentDetailPanel.tsx'
import IncidentFilters from '../components/incidents/IncidentFilters.tsx'
import IncidentPagination from '../components/incidents/IncidentPagination.tsx'
import IncidentsHeader from '../components/incidents/IncidentsHeader.tsx'
import IncidentSummaryCards from '../components/incidents/IncidentSummaryCards.tsx'
import IncidentTable from '../components/incidents/IncidentTable.tsx'
import { useTeamUsers } from '../hooks/useDashboardOverview.ts'
import { useIncidentDetail, useIncidentsList } from '../hooks/useIncidentsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { parseIncidentNumericId } from '../lib/incident-utils.ts'
import type { IncidentFilters as IncidentFiltersState } from '../lib/incident-stats.ts'
import { filterIncidents, sortIncidents } from '../lib/incident-stats.ts'
import type { IncidentListParams } from '../types/api/incident.ts'
import type { Incident } from '../types/incident.ts'

const initialFilters: IncidentFiltersState = {
  search: '',
  status: 'all',
  priority: 'all',
  serviceId: 'all',
  dateRange: 'all',
}

const dateOnlyFilters: IncidentFiltersState = {
  search: '',
  status: 'all',
  priority: 'all',
  serviceId: 'all',
  dateRange: 'all',
}

function buildIncidentListParams(
  filters: IncidentFiltersState,
  page: number,
  pageSize: number,
): IncidentListParams {
  const params: IncidentListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.status !== 'all') {
    params.status = filters.status
  }
  if (filters.priority !== 'all') {
    params.severity = filters.priority
  }
  if (filters.serviceId !== 'all') {
    params.service_id = Number(filters.serviceId)
  }

  return params
}

export default function IncidentsPage() {
  const [filters, setFilters] = useState<IncidentFiltersState>(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)

  const listParams = useMemo(
    () => buildIncidentListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )
  const {
    data: incidentData,
    isLoading: isIncidentsLoading,
    error: incidentsError,
  } = useIncidentsList(listParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()
  const { data: users = [] } = useTeamUsers()

  const incidents = incidentData?.items ?? []

  const displayedIncidents = useMemo(() => {
    const dateFiltered = filterIncidents(incidents, {
      ...dateOnlyFilters,
      dateRange: filters.dateRange,
    })

    return sortIncidents(dateFiltered)
  }, [incidents, filters.dateRange])

  const selectedNumericId = useMemo(
    () => (selectedIncidentId ? parseIncidentNumericId(selectedIncidentId) : null),
    [selectedIncidentId],
  )

  const {
    incident: detailIncident,
    events,
    comments,
    isLoading: isDetailLoading,
    error: detailError,
  } = useIncidentDetail(selectedNumericId)

  const selectedIncident = selectedIncidentId
    ? displayedIncidents.find((incident) => incident.id === selectedIncidentId) ??
      detailIncident ??
      null
    : null

  const panelIncident = detailIncident ?? selectedIncident

  const handleFiltersChange = (nextFilters: IncidentFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const handleSelect = (incident: Incident) => {
    setSelectedIncidentId(incident.id)
  }

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isIncidentsLoading && incidentData === undefined)
  const error = incidentsError ?? servicesError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading incidents...">
      <div className="space-y-6">
        <IncidentsHeader />
        <IncidentSummaryCards incidents={displayedIncidents} />
        <IncidentFilters filters={filters} services={services} onChange={handleFiltersChange} />
        <IncidentTable
          incidents={displayedIncidents}
          services={services}
          users={users}
          onSelectIncident={handleSelect}
        />
        <IncidentPagination
          page={incidentData?.page ?? page}
          totalPages={incidentData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              incidentData?.total_pages ? Math.min(incidentData.total_pages, current + 1) : current,
            )
          }
        />

        <IncidentDetailPanel
          incident={panelIncident}
          events={events}
          comments={comments}
          isDetailLoading={isDetailLoading}
          detailError={detailError}
          services={services}
          users={users}
          onClose={() => setSelectedIncidentId(null)}
        />
      </div>
    </QueryState>
  )
}

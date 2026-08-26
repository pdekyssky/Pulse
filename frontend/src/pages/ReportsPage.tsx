/**
 * Incident report page backed by GET /reports/incidents.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import QueryState from '../components/common/QueryState.tsx'
import ReportFilters from '../components/reports/ReportFilters.tsx'
import ReportPagination from '../components/reports/ReportPagination.tsx'
import ReportsHeader from '../components/reports/ReportsHeader.tsx'
import ReportStats from '../components/reports/ReportStats.tsx'
import ReportsTable from '../components/reports/ReportsTable.tsx'
import { useIncidentReportsList } from '../hooks/useReportsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { buildIncidentReportListParams } from '../lib/mappers/report.ts'
import {
  defaultIncidentReportFilters,
  type IncidentReportFilters,
  type IncidentReportStats,
} from '../lib/report-stats.ts'
import { downloadIncidentReportCsv, downloadIncidentReportJson } from '../lib/report-utils.ts'

const emptyStats: IncidentReportStats = {
  total: 0,
  open: 0,
  resolved: 0,
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<IncidentReportFilters>(defaultIncidentReportFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)

  const listParams = useMemo(
    () => buildIncidentReportListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const {
    data: reportsData,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useIncidentReportsList(listParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()

  const reports = reportsData?.items ?? []
  const stats = reportsData?.stats ?? emptyStats

  const handleFiltersChange = (nextFilters: IncidentReportFilters) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const isLoading =
    (isReportsLoading && reportsData === undefined) ||
    (isServicesLoading && services.length === 0)
  const error = reportsError ?? servicesError

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading reports..."
      errorTitle="Unable to load reports"
    >
      <div className="space-y-6">
        <ReportsHeader
          onExportJson={() => downloadIncidentReportJson(reports)}
          onExportCsv={() => downloadIncidentReportCsv(reports)}
          disableExport={reports.length === 0}
        />
        <ReportStats stats={stats} />
        <ReportFilters filters={filters} services={services} onChange={handleFiltersChange} />
        <ReportsTable
          reports={reports}
          totalCount={reportsData?.total ?? 0}
          onView={(report) => navigate(`/incidents/${report.id}`)}
        />
        <ReportPagination
          page={reportsData?.page ?? page}
          totalPages={reportsData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              reportsData?.total_pages
                ? Math.min(reportsData.total_pages, current + 1)
                : current,
            )
          }
        />
      </div>
    </QueryState>
  )
}

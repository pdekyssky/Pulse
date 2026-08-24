/**
 * Operational reports page with API-backed read-only list and filters.
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import QueryState from '../components/common/QueryState.tsx'
import ReportDetails from '../components/reports/ReportDetails.tsx'
import ReportFilters from '../components/reports/ReportFilters.tsx'
import ReportPagination from '../components/reports/ReportPagination.tsx'
import ReportsHeader from '../components/reports/ReportsHeader.tsx'
import ReportStats from '../components/reports/ReportStats.tsx'
import ReportsTable from '../components/reports/ReportsTable.tsx'
import { useReportsList } from '../hooks/useReportsQuery.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { fetchUsers } from '../lib/api/users.ts'
import { mapApiUserToTeamUser } from '../lib/mappers/service.ts'
import { buildReportListParams } from '../lib/mappers/report.ts'
import { downloadReportJson } from '../lib/report-utils.ts'
import {
  defaultReportFilters,
  type ReportFilters as ReportFiltersState,
  type ReportStatsSummary,
} from '../lib/report-stats.ts'

const emptyStats: ReportStatsSummary = {
  total: 0,
  incidentReports: 0,
  serviceReports: 0,
  scheduled: 0,
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersState>(defaultReportFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)

  const listParams = useMemo(
    () => buildReportListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const {
    data: reportsData,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useReportsList(listParams)
  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await fetchUsers()
      return response.map(mapApiUserToTeamUser)
    },
  })

  const reports = reportsData?.items ?? []
  const stats = reportsData?.stats ?? emptyStats

  const viewingReport = useMemo(
    () => reports.find((report) => report.id === viewingReportId) ?? null,
    [reports, viewingReportId],
  )

  const viewingAuthor = users.find((user) => user.id === viewingReport?.generatedById)

  const handleFiltersChange = (nextFilters: ReportFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const isLoading =
    (isReportsLoading && reportsData === undefined) ||
    (isUsersLoading && users.length === 0)
  const error = reportsError ?? usersError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading reports...">
      <div className="space-y-6">
        <ReportsHeader readOnly />
        <ReportStats stats={stats} />
        <ReportFilters filters={filters} onChange={handleFiltersChange} />
        <ReportsTable
          reports={reports}
          totalCount={reportsData?.total ?? 0}
          users={users}
          readOnly
          onView={(report) => setViewingReportId(report.id)}
          onDownload={downloadReportJson}
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

        <ReportDetails
          report={viewingReport}
          author={viewingAuthor}
          onClose={() => setViewingReportId(null)}
          onDownload={downloadReportJson}
        />
      </div>
    </QueryState>
  )
}

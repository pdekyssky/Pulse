/**
 * Table of incident report rows.
 */

import { Inbox, SearchX } from 'lucide-react'

import type { IncidentReportRow } from '../../lib/mappers/report.ts'
import Card from '../ui/Card.tsx'
import ReportRow, { ReportMobileCard } from './ReportRow.tsx'

interface ReportsTableProps {
  reports: IncidentReportRow[]
  totalCount: number
  onView: (report: IncidentReportRow) => void
}

export default function ReportsTable({ reports, totalCount, onView }: ReportsTableProps) {
  const hasNoReports = totalCount === 0
  const hasNoMatches = !hasNoReports && reports.length === 0

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          Incident Report
          <span className="ml-2 text-sm font-normal text-gray-500">({totalCount})</span>
        </h3>
      </div>

      {reports.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Incident</th>
                  <th className="py-3 pr-4 font-medium">Severity</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Service</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Created</th>
                  <th className="hidden py-3 pr-4 font-medium xl:table-cell">Resolved</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Assignee</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <ReportRow key={report.id} report={report} onView={onView} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 md:hidden">
            {reports.map((report) => (
              <ReportMobileCard key={report.id} report={report} onView={onView} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState hasNoReports={hasNoReports} hasNoMatches={hasNoMatches} />
      )}
    </Card>
  )
}

function EmptyState({
  hasNoReports,
  hasNoMatches,
}: {
  hasNoReports: boolean
  hasNoMatches: boolean
}) {
  if (hasNoReports) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Inbox className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No incidents to report</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          There are no incidents in MongoDB for the selected filters.
        </p>
      </div>
    )
  }

  if (hasNoMatches) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <SearchX className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No matching incidents</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return null
}

/**
 * Report generation and management with mock CRUD and JSON export.
 */

import { useMemo, useState } from 'react'

import { mockReports } from '../data/reports.ts'
import { mockServices } from '../data/services.ts'
import { mockUsers } from '../data/users.ts'
import DeleteReportDialog from '../components/reports/DeleteReportDialog.tsx'
import ReportDetails from '../components/reports/ReportDetails.tsx'
import ReportFilters from '../components/reports/ReportFilters.tsx'
import ReportFormDialog from '../components/reports/ReportForm.tsx'
import ReportsHeader from '../components/reports/ReportsHeader.tsx'
import ReportStats from '../components/reports/ReportStats.tsx'
import ReportsTable from '../components/reports/ReportsTable.tsx'
import {
  defaultReportFilters,
  filterReports,
  sortReports,
  type ReportFilters as ReportFiltersState,
} from '../lib/report-stats.ts'
import { createReportFromInput, downloadReportJson } from '../lib/report-utils.ts'
import type { Report, ReportFormInput } from '../types/report.ts'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(() => [...mockReports])
  const [filters, setFilters] = useState<ReportFiltersState>(defaultReportFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)
  const [deletingReport, setDeletingReport] = useState<Report | null>(null)

  const filteredReports = useMemo(
    () => sortReports(filterReports(reports, filters)),
    [reports, filters],
  )

  const viewingReport = useMemo(
    () => reports.find((report) => report.id === viewingReportId) ?? null,
    [reports, viewingReportId],
  )

  const viewingAuthor = mockUsers.find((user) => user.id === viewingReport?.generatedById)

  const handleGenerateSubmit = (input: ReportFormInput) => {
    setReports((current) => [
      createReportFromInput(input, current, 'user-1'),
      ...current,
    ])
  }

  const handleDeleteConfirm = (report: Report) => {
    setReports((current) => current.filter((item) => item.id !== report.id))
    // Close detail panel if the deleted report was being viewed
    if (viewingReportId === report.id) {
      setViewingReportId(null)
    }
  }

  return (
    <div className="space-y-6">
      <ReportsHeader onGenerateClick={() => setFormOpen(true)} />
      <ReportStats reports={reports} />
      <ReportFilters filters={filters} onChange={setFilters} />
      <ReportsTable
        reports={filteredReports}
        totalCount={reports.length}
        users={mockUsers}
        onView={(report) => setViewingReportId(report.id)}
        onDownload={downloadReportJson}
        onDelete={setDeletingReport}
      />

      <ReportDetails
        report={viewingReport}
        author={viewingAuthor}
        onClose={() => setViewingReportId(null)}
        onDownload={downloadReportJson}
      />

      <ReportFormDialog
        open={formOpen}
        services={mockServices}
        onClose={() => setFormOpen(false)}
        onSubmit={handleGenerateSubmit}
      />

      <DeleteReportDialog
        report={deletingReport}
        onClose={() => setDeletingReport(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

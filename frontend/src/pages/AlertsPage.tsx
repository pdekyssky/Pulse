/**
 * Alert monitoring page with filterable alert table and summary stats.
 */

import { useMemo, useState } from 'react'

import { mockAlerts } from '../data/alerts.ts'
import { mockServices } from '../data/services.ts'
import AlertFilters from '../components/alerts/AlertFilters.tsx'
import AlertsHeader from '../components/alerts/AlertsHeader.tsx'
import AlertStats from '../components/alerts/AlertStats.tsx'
import AlertTable from '../components/alerts/AlertTable.tsx'
import {
  defaultAlertFilters,
  filterAlerts,
  sortAlerts,
  type AlertFilters as AlertFiltersState,
} from '../lib/alert-stats.ts'

export default function AlertsPage() {
  const [filters, setFilters] = useState<AlertFiltersState>(defaultAlertFilters)

  const filteredAlerts = useMemo(
    () => sortAlerts(filterAlerts(mockAlerts, filters)),
    [filters],
  )

  return (
    <div className="space-y-6">
      <AlertsHeader />
      <AlertStats alerts={mockAlerts} />
      <AlertFilters filters={filters} services={mockServices} onChange={setFilters} />
      <AlertTable alerts={filteredAlerts} services={mockServices} />
    </div>
  )
}

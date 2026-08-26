/**
 * Sortable table of incidents with row actions.
 */

import type { Incident } from '../../types/incident.ts'
import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import Card from '../ui/Card.tsx'
import IncidentRow, { IncidentMobileCard } from './IncidentRow.tsx'

interface IncidentTableProps {
  incidents: Incident[]
  totalCount: number
  services: Service[]
  users: User[]
  onSelectIncident: (incident: Incident) => void
  onResolveIncident?: (incident: Incident) => void
}

export default function IncidentTable({
  incidents,
  totalCount,
  services,
  users,
  onSelectIncident,
  onResolveIncident,
}: IncidentTableProps) {
  const getServiceById = (id: string) => services.find((service) => service.id === id)
  const getUserById = (id: string) => users.find((user) => user.id === id)

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          All Incidents
          <span className="ml-2 text-sm font-normal text-gray-500">({totalCount})</span>
        </h3>
      </div>

      {incidents.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="py-3 pr-4 font-medium">Title</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Severity</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Service</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Assignee</th>
                  <th className="hidden py-3 pr-4 font-medium sm:table-cell">Started</th>
                  <th className="hidden py-3 pr-4 font-medium xl:table-cell">Duration</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    primaryService={getServiceById(incident.affectedServiceIds[0] ?? '')}
                    assignee={getUserById(incident.assigneeId)}
                    onSelect={onSelectIncident}
                    onResolve={onResolveIncident}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 md:hidden">
            {incidents.map((incident) => (
              <IncidentMobileCard
                key={incident.id}
                incident={incident}
                primaryService={getServiceById(incident.affectedServiceIds[0] ?? '')}
                assignee={getUserById(incident.assigneeId)}
                onSelect={onSelectIncident}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="px-5 py-12 text-center text-sm text-gray-500">
          No incidents match your filters.
        </p>
      )}
    </Card>
  )
}

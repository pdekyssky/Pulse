/**
 * Sidebar list of active incidents on the overview page.
 */

import { Link } from 'react-router-dom'

import type { Incident } from '../../types/incident.ts'
import type { User } from '../../types/user.ts'
import Card from '../ui/Card.tsx'
import IncidentCard from './IncidentCard.tsx'

interface IncidentListProps {
  incidents: Incident[]
  users: User[]
}

export default function IncidentList({ incidents, users }: IncidentListProps) {
  const getUserById = (id: string) => users.find((user) => user.id === id)

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Incidents</h3>
        <Link
          to="/incidents"
          className="text-sm font-medium text-pulse-600 transition-colors hover:text-pulse-700"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              assignee={getUserById(incident.assigneeId)}
            />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">No active incidents</p>
        )}
      </div>
    </Card>
  )
}

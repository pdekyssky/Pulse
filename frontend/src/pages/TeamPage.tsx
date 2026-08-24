/**
 * Team member directory with API-backed read-only list and filters.
 */

import { useMemo, useState } from 'react'

import QueryState from '../components/common/QueryState.tsx'
import MemberDetails from '../components/team/MemberDetails.tsx'
import TeamFilters from '../components/team/TeamFilters.tsx'
import TeamHeader from '../components/team/TeamHeader.tsx'
import TeamStats from '../components/team/TeamStats.tsx'
import TeamTable from '../components/team/TeamTable.tsx'
import IncidentPagination from '../components/incidents/IncidentPagination.tsx'
import { useTeamUsers } from '../hooks/useTeamQuery.ts'
import {
  getTotalPages,
  paginateItems,
} from '../lib/pagination.ts'
import {
  defaultTeamFilters,
  filterTeamMembers,
  sortTeamMembers,
  type TeamFilters as TeamFiltersState,
} from '../lib/team-stats.ts'

export default function TeamPage() {
  const [filters, setFilters] = useState<TeamFiltersState>(defaultTeamFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)

  const { data: members, isLoading, error } = useTeamUsers()

  const memberList = members ?? []

  const filteredMembers = useMemo(
    () => sortTeamMembers(filterTeamMembers(memberList, filters)),
    [memberList, filters],
  )

  const totalPages = getTotalPages(filteredMembers.length, pageSize)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paginatedMembers = useMemo(
    () => paginateItems(filteredMembers, currentPage, pageSize),
    [filteredMembers, currentPage, pageSize],
  )

  const viewingMember = useMemo(
    () => memberList.find((member) => member.id === viewingMemberId) ?? null,
    [memberList, viewingMemberId],
  )

  const handleFiltersChange = (nextFilters: TeamFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  return (
    <QueryState
      isLoading={isLoading && members === undefined}
      error={error}
      loadingMessage="Loading team..."
    >
      <div className="space-y-6">
        <TeamHeader readOnly />
        <TeamStats members={memberList} />
        <TeamFilters filters={filters} onChange={handleFiltersChange} />
        <TeamTable
          members={paginatedMembers}
          totalCount={memberList.length}
          readOnly
          onView={(member) => setViewingMemberId(member.id)}
        />
        <IncidentPagination
          page={currentPage}
          totalPages={totalPages}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        />

        <MemberDetails
          member={viewingMember}
          readOnly
          onClose={() => setViewingMemberId(null)}
        />
      </div>
    </QueryState>
  )
}

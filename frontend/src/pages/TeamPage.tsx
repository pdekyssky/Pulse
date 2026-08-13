/**
 * Team member management with mock CRUD, filters, and member details.
 */

import { useMemo, useState } from 'react'

import { mockUsers } from '../data/users.ts'
import MemberDetails from '../components/team/MemberDetails.tsx'
import MemberFormDialog from '../components/team/MemberForm.tsx'
import TeamFilters from '../components/team/TeamFilters.tsx'
import TeamHeader from '../components/team/TeamHeader.tsx'
import TeamStats from '../components/team/TeamStats.tsx'
import TeamTable from '../components/team/TeamTable.tsx'
import {
  createUserFromInput,
  updateUserFromInput,
  userToFormInput,
} from '../lib/team-utils.ts'
import {
  defaultTeamFilters,
  filterTeamMembers,
  sortTeamMembers,
  type TeamFilters as TeamFiltersState,
} from '../lib/team-stats.ts'
import type { User, UserFormInput } from '../types/user.ts'

type FormMode = 'create' | 'edit' | null

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>(() => [...mockUsers])
  const [filters, setFilters] = useState<TeamFiltersState>(defaultTeamFilters)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)

  const filteredMembers = useMemo(
    () => sortTeamMembers(filterTeamMembers(members, filters)),
    [members, filters],
  )

  const viewingMember = useMemo(
    () => members.find((member) => member.id === viewingMemberId) ?? null,
    [members, viewingMemberId],
  )

  const handleAddClick = () => {
    setEditingMember(null)
    setFormMode('create')
  }

  const handleView = (member: User) => {
    setViewingMemberId(member.id)
  }

  const handleEdit = (member: User) => {
    setEditingMember(member)
    setFormMode('edit')
  }

  const handleFormClose = () => {
    setFormMode(null)
    setEditingMember(null)
  }

  const handleFormSubmit = (input: UserFormInput) => {
    if (formMode === 'create') {
      setMembers((current) => [...current, createUserFromInput(input, current)])
      return
    }

    if (formMode === 'edit' && editingMember) {
      setMembers((current) =>
        current.map((member) =>
          member.id === editingMember.id ? updateUserFromInput(member, input) : member,
        ),
      )
    }
  }

  const handleDeactivate = (member: User) => {
    // Soft-delete: mark inactive rather than removing from the list
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id ? { ...item, status: 'inactive' } : item,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <TeamHeader onAddClick={handleAddClick} />
      <TeamStats members={members} />
      <TeamFilters filters={filters} onChange={setFilters} />
      <TeamTable
        members={filteredMembers}
        totalCount={members.length}
        onView={handleView}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
      />

      <MemberDetails
        member={viewingMember}
        onClose={() => setViewingMemberId(null)}
        onEdit={handleEdit}
      />

      <MemberFormDialog
        key={formMode === 'edit' && editingMember ? editingMember.id : 'create'}
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initialValues={editingMember ? userToFormInput(editingMember) : undefined}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

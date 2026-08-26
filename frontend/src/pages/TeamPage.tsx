/**
 * User directory with API-backed list, filters, and admin management.
 */

import { useCallback, useMemo, useState } from 'react'

import QueryState from '../components/common/QueryState.tsx'
import ChangeUserRoleDialog from '../components/team/ChangeUserRoleDialog.tsx'
import ConfirmUserStatusDialog from '../components/team/ConfirmUserStatusDialog.tsx'
import DeleteUserDialog from '../components/team/DeleteUserDialog.tsx'
import MemberDetails from '../components/team/MemberDetails.tsx'
import MemberFormDialog from '../components/team/MemberForm.tsx'
import TeamFilters from '../components/team/TeamFilters.tsx'
import TeamHeader from '../components/team/TeamHeader.tsx'
import TeamStats from '../components/team/TeamStats.tsx'
import TeamTable from '../components/team/TeamTable.tsx'
import IncidentPagination from '../components/incidents/IncidentPagination.tsx'
import Toast from '../components/ui/Toast.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import {
  useCreateUser,
  useDeleteUser,
  useTeamUsers,
  useUpdateUser,
  useUsersList,
} from '../hooks/useTeamQuery.ts'
import { ApiError } from '../lib/api/client.ts'
import {
  buildUserListParams,
  defaultTeamFilters,
  type TeamFilters as TeamFiltersState,
} from '../lib/team-stats.ts'
import type { CreateUserInput, ManageableUserRole, User } from '../types/user.ts'

function parseUserId(id: string): number {
  const userId = Number.parseInt(id, 10)
  if (Number.isNaN(userId)) {
    throw new Error('Invalid user ID')
  }
  return userId
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed'
}

export default function TeamPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const currentUserId = user ? String(user.id) : null

  const [filters, setFilters] = useState<TeamFiltersState>(defaultTeamFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)
  const [statusMember, setStatusMember] = useState<User | null>(null)
  const [roleMember, setRoleMember] = useState<User | null>(null)
  const [deletingMember, setDeletingMember] = useState<User | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const listParams = useMemo(
    () => buildUserListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const { data: allMembers } = useTeamUsers()
  const {
    data: userData,
    isLoading,
    error,
  } = useUsersList(listParams)
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const memberList = allMembers ?? []
  const pagedMembers = userData?.items ?? []
  const adminCount = memberList.filter((member) => member.role === 'admin').length
  const activeAdminCount = memberList.filter(
    (member) => member.role === 'admin' && member.status === 'active',
  ).length

  const viewingMember = useMemo(
    () =>
      pagedMembers.find((member) => member.id === viewingMemberId) ??
      memberList.find((member) => member.id === viewingMemberId) ??
      null,
    [memberList, pagedMembers, viewingMemberId],
  )

  const handleFiltersChange = (nextFilters: TeamFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const closeCreateDialog = useCallback(() => {
    setIsCreateOpen(false)
    setCreateError(null)
    createUserMutation.reset()
  }, [createUserMutation])

  const closeStatusDialog = useCallback(() => {
    setStatusMember(null)
    setStatusError(null)
    updateUserMutation.reset()
  }, [updateUserMutation])

  const closeRoleDialog = useCallback(() => {
    setRoleMember(null)
    setRoleError(null)
    updateUserMutation.reset()
  }, [updateUserMutation])

  const closeDeleteDialog = useCallback(() => {
    setDeletingMember(null)
    setDeleteError(null)
    deleteUserMutation.reset()
  }, [deleteUserMutation])

  const handleCreateUser = useCallback(
    async (input: CreateUserInput) => {
      setCreateError(null)

      try {
        await createUserMutation.mutateAsync({
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
        })
        setToastMessage(`${input.name} was created.`)
        closeCreateDialog()
      } catch (mutationError) {
        setCreateError(getErrorMessage(mutationError))
      }
    },
    [closeCreateDialog, createUserMutation],
  )

  const handleToggleActive = useCallback(async () => {
    if (!statusMember) {
      return
    }

    setStatusError(null)

    try {
      const nextActive = statusMember.status !== 'active'
      await updateUserMutation.mutateAsync({
        id: parseUserId(statusMember.id),
        data: { is_active: nextActive },
      })
      setToastMessage(
        nextActive
          ? `${statusMember.name} has been activated.`
          : `${statusMember.name} has been deactivated.`,
      )
      closeStatusDialog()
    } catch (mutationError) {
      setStatusError(getErrorMessage(mutationError))
    }
  }, [closeStatusDialog, statusMember, updateUserMutation])

  const handleChangeRole = useCallback(
    async (role: ManageableUserRole) => {
      if (!roleMember) {
        return
      }

      setRoleError(null)

      try {
        await updateUserMutation.mutateAsync({
          id: parseUserId(roleMember.id),
          data: { role },
        })
        setToastMessage(`${roleMember.name}'s role was updated to ${role}.`)
        closeRoleDialog()
      } catch (mutationError) {
        setRoleError(getErrorMessage(mutationError))
      }
    },
    [closeRoleDialog, roleMember, updateUserMutation],
  )

  const handleDelete = useCallback(async () => {
    if (!deletingMember) {
      return
    }

    setDeleteError(null)

    try {
      const isLastOnPage = pagedMembers.length === 1 && page > 1
      await deleteUserMutation.mutateAsync(parseUserId(deletingMember.id))

      if (viewingMemberId === deletingMember.id) {
        setViewingMemberId(null)
      }

      if (isLastOnPage) {
        setPage(page - 1)
      }

      setToastMessage(`${deletingMember.name} has been deleted.`)
      closeDeleteDialog()
    } catch (mutationError) {
      if (mutationError instanceof ApiError && mutationError.status === 404) {
        setToastMessage(`${deletingMember.name} was already removed.`)
        closeDeleteDialog()
        return
      }

      setDeleteError(getErrorMessage(mutationError))
    }
  }, [
    closeDeleteDialog,
    deleteUserMutation,
    deletingMember,
    page,
    pagedMembers.length,
    viewingMemberId,
  ])

  return (
    <QueryState
      isLoading={isLoading && userData === undefined}
      error={error}
      loadingMessage="Loading users..."
    >
      <div className="space-y-6">
        <TeamHeader
          readOnly={!isAdmin}
          onCreateClick={isAdmin ? () => setIsCreateOpen(true) : undefined}
        />
        <TeamStats members={memberList} />
        <TeamFilters filters={filters} onChange={handleFiltersChange} />
        <TeamTable
          members={pagedMembers}
          totalCount={userData?.total ?? 0}
          readOnly
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          adminCount={adminCount}
          activeAdminCount={activeAdminCount}
          onView={(member) => setViewingMemberId(member.id)}
          onToggleActive={
            isAdmin
              ? (member) => {
                  setStatusError(null)
                  setStatusMember(member)
                }
              : undefined
          }
          onChangeRole={
            isAdmin
              ? (member) => {
                  setRoleError(null)
                  setRoleMember(member)
                }
              : undefined
          }
          onDelete={
            isAdmin
              ? (member) => {
                  setDeleteError(null)
                  setDeletingMember(member)
                }
              : undefined
          }
          onCopyEmail={() => setToastMessage('Email copied.')}
        />
        <IncidentPagination
          page={userData?.page ?? page}
          totalPages={userData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              userData?.total_pages ? Math.min(userData.total_pages, current + 1) : current,
            )
          }
        />

        <MemberDetails
          member={viewingMember}
          readOnly
          onClose={() => setViewingMemberId(null)}
        />

        {isAdmin && (
          <>
            <MemberFormDialog
              open={isCreateOpen}
              onClose={closeCreateDialog}
              onSubmit={handleCreateUser}
              isPending={createUserMutation.isPending}
              submitError={createError}
            />
            <ConfirmUserStatusDialog
              member={statusMember}
              onClose={closeStatusDialog}
              onConfirm={handleToggleActive}
              isPending={updateUserMutation.isPending}
              error={statusError}
            />
            <ChangeUserRoleDialog
              member={roleMember}
              onClose={closeRoleDialog}
              onConfirm={handleChangeRole}
              isPending={updateUserMutation.isPending}
              error={roleError}
            />
            <DeleteUserDialog
              member={deletingMember}
              onClose={closeDeleteDialog}
              onConfirm={handleDelete}
              isPending={deleteUserMutation.isPending}
              error={deleteError}
            />
          </>
        )}

        <Toast message={toastMessage} onClose={dismissToast} />
      </div>
    </QueryState>
  )
}

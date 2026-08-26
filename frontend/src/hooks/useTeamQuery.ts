import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createUser, deleteUser, fetchUsers, fetchUsersPage, updateUser } from '../lib/api/users.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiUserToTeamUser } from '../lib/mappers/user.ts'
import type { ApiUserCreate, ApiUserUpdate, UserListParams } from '../types/api/user.ts'
import type { User } from '../types/user.ts'

export interface PaginatedUserList {
  items: User[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export function useTeamUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async (): Promise<User[]> => {
      const users = await fetchUsers()
      return users.map(mapApiUserToTeamUser)
    },
  })
}

export function useUsersList(params: UserListParams) {
  return useQuery({
    queryKey: [...queryKeys.users, 'page', params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedUserList> => {
      const response = await fetchUsersPage(params)

      return {
        items: response.items.map(mapApiUserToTeamUser),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
      }
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApiUserCreate): Promise<User> => {
      const user = await createUser(data)
      return mapApiUserToTeamUser(user)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export interface UpdateUserVariables {
  id: number
  data: ApiUserUpdate
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateUserVariables): Promise<User> => {
      const user = await updateUser(id, data)
      return mapApiUserToTeamUser(user)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

import type {
  ApiUser,
  ApiUserCreate,
  ApiUserDeleteResponse,
  ApiUserList,
  ApiUserUpdate,
  PaginatedUsers,
  UserListParams,
} from '../../types/api/user.ts'
import { apiRequest } from './client.ts'

function buildUsersQuery(params: UserListParams = {}): string {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.page_size !== undefined) {
    searchParams.set('page_size', String(params.page_size))
  }
  if (params.search !== undefined && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }
  if (params.role !== undefined) {
    searchParams.set('role', params.role)
  }
  if (params.is_active !== undefined) {
    searchParams.set('is_active', String(params.is_active))
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchUsers(): Promise<ApiUserList> {
  return apiRequest<ApiUserList>('/users/')
}

export function fetchUsersPage(params: UserListParams): Promise<PaginatedUsers> {
  return apiRequest<PaginatedUsers>(`/users/${buildUsersQuery(params)}`)
}

export function createUser(data: ApiUserCreate): Promise<ApiUser> {
  return apiRequest<ApiUser>('/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUser(id: number, data: ApiUserUpdate): Promise<ApiUser> {
  return apiRequest<ApiUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteUser(id: number): Promise<ApiUserDeleteResponse> {
  return apiRequest<ApiUserDeleteResponse>(`/users/${id}`, {
    method: 'DELETE',
  })
}

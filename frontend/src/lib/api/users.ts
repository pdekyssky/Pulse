import type { ApiUserList } from '../../types/api/user.ts'
import { apiRequest } from './client.ts'

export function fetchUsers(): Promise<ApiUserList> {
  return apiRequest<ApiUserList>('/users/')
}

import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from '../lib/api/users.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiUserToTeamUser } from '../lib/mappers/user.ts'
import type { User } from '../types/user.ts'

export function useTeamUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async (): Promise<User[]> => {
      const users = await fetchUsers()
      return users.map(mapApiUserToTeamUser)
    },
  })
}

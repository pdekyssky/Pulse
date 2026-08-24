/** Backend user role values (`UserRole` enum). */
export type ApiUserRole = 'admin' | 'engineer' | 'responder' | 'viewer'

/** User record returned by GET /users/ and GET /users/{user_id}. */
export interface ApiUser {
  id: number
  name: string
  email: string
  role: ApiUserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Response shape for GET /users/ (plain array, not paginated). */
export type ApiUserList = ApiUser[]

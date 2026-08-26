/** Backend user role values from the Express User model. */
export type ApiUserRole = 'admin' | 'manager' | 'user'

/** User record returned by GET /users/ and PATCH /users/:id. */
export interface ApiUser {
  id: number
  name: string
  email: string
  role: ApiUserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Admin-only fields accepted by POST /users. */
export interface ApiUserCreate {
  name: string
  email: string
  password: string
  role?: ApiUserRole
}

/** Admin-only fields accepted by PATCH /users/:id. */
export interface ApiUserUpdate {
  is_active?: boolean
  role?: ApiUserRole
}

/** Response shape for DELETE /users/:id. */
export interface ApiUserDeleteResponse {
  message: string
  user: ApiUser
}

/** Query params for paginated GET /users/. */
export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  role?: ApiUserRole
  is_active?: boolean
}

/** Paginated GET /users/?page=&page_size= envelope. */
export interface PaginatedUsers {
  items: ApiUser[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

/** Unpaginated GET /users/ response. */
export type ApiUserList = ApiUser[]

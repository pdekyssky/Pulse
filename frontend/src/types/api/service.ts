export interface ApiService {
  id: number
  name: string
  description: string | null
  status: string
  owner_id: number
  uptime: number | string
  created_at: string
  updated_at: string
}

/** POST /api/v1/services — all fields required except description. */
export interface ApiServiceCreate {
  name: string
  description?: string | null
  owner_id: number
  uptime: number | string
}

/** PATCH /api/v1/services/{id} — partial update; all fields optional. */
export interface ApiServiceUpdate {
  name?: string | null
  description?: string | null
  owner_id?: number | null
  uptime?: number | string | null
}

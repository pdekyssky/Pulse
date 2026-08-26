export type ApiServiceStatus = 'operational' | 'degraded' | 'down'

export interface ApiService {
  id: number
  name: string
  description: string | null
  status: string
  owner_id: number | null
  uptime: number | string | null
  created_at: string
  updated_at: string
}

/** POST /api/v1/services */
export interface ApiServiceCreate {
  name: string
  description?: string | null
  status?: ApiServiceStatus
  owner_id: number
  uptime: number | string
}

/** PATCH /api/v1/services/{id} */
export interface ApiServiceUpdate {
  name?: string | null
  description?: string | null
  status?: ApiServiceStatus
  owner_id?: number | null
  uptime?: number | string | null
}

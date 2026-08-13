/**
 * Mock team member records.
 */

import type { User } from '../types/user.ts'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Peter Novak',
    email: 'peter.novak@pulse.io',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-15T09:00:00Z',
    avatar: null,
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@pulse.io',
    role: 'engineer',
    status: 'active',
    joinedAt: '2024-03-20T09:00:00Z',
    avatar: null,
  },
  {
    id: 'user-3',
    name: 'Marcus Webb',
    email: 'marcus.webb@pulse.io',
    role: 'responder',
    status: 'active',
    joinedAt: '2024-05-10T09:00:00Z',
    avatar: null,
  },
  {
    id: 'user-4',
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@pulse.io',
    role: 'engineer',
    status: 'active',
    joinedAt: '2024-06-01T09:00:00Z',
    avatar: null,
  },
  {
    id: 'user-5',
    name: 'James Liu',
    email: 'james.liu@pulse.io',
    role: 'viewer',
    status: 'inactive',
    joinedAt: '2024-02-14T09:00:00Z',
    avatar: null,
  },
  {
    id: 'user-6',
    name: 'Amira Hassan',
    email: 'amira.hassan@pulse.io',
    role: 'responder',
    status: 'invited',
    joinedAt: '2026-08-01T09:00:00Z',
    avatar: null,
  },
]

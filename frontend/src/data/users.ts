/**
 * Mock user records used only by leftover local incident helpers.
 * Roles match the Express User model.
 */

import type { User } from '../types/user.ts'

export const mockUsers: User[] = [
  {
    id: '20',
    name: 'Admin',
    email: 'admin789@test.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-15T09:00:00Z',
    avatar: null,
  },
  {
    id: '11',
    name: 'Normal User',
    email: 'phase9.analytics.1115384270@example.com',
    role: 'user',
    status: 'active',
    joinedAt: '2024-03-20T09:00:00Z',
    avatar: null,
  },
  {
    id: '6',
    name: 'Assignee',
    email: 'assignee@pulse.io',
    role: 'manager',
    status: 'active',
    joinedAt: '2024-05-10T09:00:00Z',
    avatar: null,
  },
]

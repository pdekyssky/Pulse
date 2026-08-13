/**
 * Team member ID generation and mock create/update/form mapping.
 */

import type { User, UserFormInput } from '../types/user.ts'

export function createUserId(existing: User[]): string {
  const numbers = existing
    .map((user) => Number.parseInt(user.id.replace(/^user-/i, ''), 10))
    .filter((value) => !Number.isNaN(value))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `user-${next}`
}

export function createUserFromInput(input: UserFormInput, existing: User[]): User {
  return {
    id: createUserId(existing),
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status,
    joinedAt: new Date().toISOString(),
    avatar: null,
  }
}

export function updateUserFromInput(user: User, input: UserFormInput): User {
  return {
    ...user,
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status,
  }
}

export function userToFormInput(user: User): UserFormInput {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

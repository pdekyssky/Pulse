/**
 * Reusable card container with optional title and padding variants.
 */

import type { ReactNode } from 'react'

import { cn } from '../../lib/utils.ts'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

/**
 * Standard page width and spacing wrapper.
 */

import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  description?: string
  children?: ReactNode
}

export default function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

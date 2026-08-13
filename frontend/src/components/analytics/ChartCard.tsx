/**
 * Reusable card wrapper for analytics charts.
 */

import type { ReactNode } from 'react'

import Card from '../ui/Card.tsx'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

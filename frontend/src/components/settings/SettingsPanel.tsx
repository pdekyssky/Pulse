/**
 * Generic wrapper card for a settings section panel.
 */

import type { ReactNode } from 'react'

import Card from '../ui/Card.tsx'

interface SettingsPanelProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export default function SettingsPanel({ title, description, children, footer }: SettingsPanelProps) {
  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end border-t border-gray-100 px-5 py-4">{footer}</div>
      )}
    </Card>
  )
}

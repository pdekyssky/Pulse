/**
 * Toggle switch input for boolean settings.
 */

import { cn } from '../../lib/utils.ts'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  id?: string
}

export default function Switch({ checked, onChange, label, description, id }: SwitchProps) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={switchId} className="text-sm font-medium text-gray-900">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:ring-2 focus:ring-pulse-500/20 focus:outline-none',
          checked ? 'bg-pulse-600' : 'bg-gray-200',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

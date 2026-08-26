/**
 * Horizontal bar list for categorical counts.
 */

import ChartCard from './ChartCard.tsx'

interface DistributionItem {
  key: string
  label: string
  count: number
}

interface DistributionListProps {
  title: string
  description?: string
  items: DistributionItem[]
  emptyMessage: string
}

export default function DistributionList({
  title,
  description,
  items,
  emptyMessage,
}: DistributionListProps) {
  const max = Math.max(1, ...items.map((item) => item.count))
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <ChartCard title={title} description={description}>
      {total === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="text-gray-500">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-pulse-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}

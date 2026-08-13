/**
 * Line chart showing average response time trends.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ResponseTimeDataPoint } from '../../types/analytics.ts'
import { chartColors, chartTooltipStyle } from '../../lib/chart-config.ts'
import ChartCard from './ChartCard.tsx'

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[]
}

export default function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  return (
    <ChartCard
      title="Response Time"
      description="Average platform response time over the selected period."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value: number) => `${value} ms`}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`${Number(value ?? 0)} ms`, 'Response Time']}
            />
            <Line
              type="monotone"
              dataKey="responseTime"
              name="Response Time"
              stroke={chartColors.orange}
              strokeWidth={2}
              dot={{ r: 3, fill: chartColors.orange }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

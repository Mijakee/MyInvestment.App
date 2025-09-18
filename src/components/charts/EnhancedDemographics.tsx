'use client'

import { useState } from 'react'

interface AncestryData {
  australia: number
  england: number
  china: number
  india: number
  italy: number
  ireland: number
  scotland: number
  germany: number
  philippines: number
  vietnam: number
  other: number
}

interface CrimeTrendData {
  period: string
  totalCrime: number
  violentCrime: number
  propertyCrime: number
  drugCrime: number
  trafficCrime: number
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  percentage: number
  confidence: number
  reason: string
}

interface EnhancedDemographicsProps {
  ancestryData?: AncestryData
  crimeTrends?: CrimeTrendData[]
  trendAnalysis?: TrendAnalysis
  suburbName: string
}

export function AncestryChart({ data, title }: { data: AncestryData, title: string }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  const ancestryEntries = Object.entries(data)
    .map(([country, count]) => ({
      country: formatCountryName(country),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) // Top 8 ancestries

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      {/* Donut Chart Representation */}
      <div className="mb-6">
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {ancestryEntries.reduce((acc, entry, index) => {
              const startAngle = acc.currentAngle
              const angleSize = (entry.percentage / 100) * 360
              const endAngle = startAngle + angleSize

              const x1 = 100 + 70 * Math.cos((startAngle * Math.PI) / 180)
              const y1 = 100 + 70 * Math.sin((startAngle * Math.PI) / 180)
              const x2 = 100 + 70 * Math.cos((endAngle * Math.PI) / 180)
              const y2 = 100 + 70 * Math.sin((endAngle * Math.PI) / 180)

              const largeArc = angleSize > 180 ? 1 : 0

              const pathData = [
                'M 100 100',
                `L ${x1} ${y1}`,
                `A 70 70 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              acc.paths.push(
                <path
                  key={entry.country}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              )

              acc.currentAngle = endAngle
              return acc
            }, { paths: [] as JSX.Element[], currentAngle: 0 }).paths}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {ancestryEntries.map((entry, index) => (
          <div key={entry.country} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-foreground">
              {entry.country}: {entry.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CrimeTrendChart({ data, analysis, suburbName }: {
  data: CrimeTrendData[],
  analysis?: TrendAnalysis,
  suburbName: string
}) {
  const [selectedCrimeType, setSelectedCrimeType] = useState<keyof CrimeTrendData>('totalCrime')

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-foreground mb-4">Crime Trends</h3>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Crime trend data not available</div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d[selectedCrimeType] as number))
  const minValue = Math.min(...data.map(d => d[selectedCrimeType] as number))

  const crimeTypeOptions = [
    { key: 'totalCrime', label: 'Total Crime', color: '#3B82F6' },
    { key: 'violentCrime', label: 'Violent Crime', color: '#EF4444' },
    { key: 'propertyCrime', label: 'Property Crime', color: '#F59E0B' },
    { key: 'drugCrime', label: 'Drug Crime', color: '#8B5CF6' },
    { key: 'trafficCrime', label: 'Traffic Crime', color: '#06B6D4' }
  ]

  const selectedOption = crimeTypeOptions.find(opt => opt.key === selectedCrimeType)

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Crime Trends - {suburbName}</h3>
        <select
          value={selectedCrimeType}
          onChange={(e) => setSelectedCrimeType(e.target.value as keyof CrimeTrendData)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          {crimeTypeOptions.map(option => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Line Chart */}
      <div className="mb-6" style={{ height: '200px' }}>
        <svg viewBox="0 0 400 200" className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="40"
              y1={160 - (percent * 1.2)}
              x2="380"
              y2={160 - (percent * 1.2)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(percent => {
            const value = Math.round(minValue + (maxValue - minValue) * (percent / 100))
            return (
              <text
                key={percent}
                x="35"
                y={165 - (percent * 1.2)}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {value}
              </text>
            )
          })}

          {/* Data line */}
          {data.length > 1 && (
            <polyline
              points={data.map((d, i) => {
                const x = 40 + (i * (340 / (data.length - 1)))
                const normalizedValue = maxValue > minValue ?
                  ((d[selectedCrimeType] as number) - minValue) / (maxValue - minValue) : 0
                const y = 160 - (normalizedValue * 120)
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke={selectedOption?.color}
              strokeWidth="3"
              className="drop-shadow-sm"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => {
            const x = 40 + (i * (340 / Math.max(data.length - 1, 1)))
            const normalizedValue = maxValue > minValue ?
              ((d[selectedCrimeType] as number) - minValue) / (maxValue - minValue) : 0
            const y = 160 - (normalizedValue * 120)

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={selectedOption?.color}
                className="hover:r-6 transition-all cursor-pointer"
              />
            )
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = 40 + (i * (340 / Math.max(data.length - 1, 1)))
            return (
              <text
                key={i}
                x={x}
                y="185"
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {d.period}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Trend Analysis */}
      {analysis && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">Trend Analysis</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              analysis.direction === 'decreasing' ? 'bg-green-100 text-green-700' :
              analysis.direction === 'increasing' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {analysis.direction === 'decreasing' ? '↓ Decreasing' :
               analysis.direction === 'increasing' ? '↑ Increasing' : '→ Stable'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {analysis.reason} ({Math.abs(analysis.percentage).toFixed(1)}% change, {(analysis.confidence * 100).toFixed(0)}% confidence)
          </div>
        </div>
      )}
    </div>
  )
}

export function TrendScoreExplanation({ score, analysis }: {
  score: number,
  analysis?: TrendAnalysis
}) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreDescription = (score: number) => {
    if (score >= 8) return 'Improving Safety Trend'
    if (score >= 6) return 'Stable Safety Trend'
    if (score >= 4) return 'Slowly Declining Trend'
    return 'Concerning Safety Trend'
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-foreground mb-4">What the Trend Score Means</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Trend Score:</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(1)}/10
          </span>
        </div>

        <div className={`p-3 rounded-lg ${
          score >= 8 ? 'bg-green-50 border border-green-200' :
          score >= 6 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-medium ${getScoreColor(score)} mb-2`}>
            {getScoreDescription(score)}
          </div>

          {analysis && (
            <div className="text-sm text-muted-foreground">
              {analysis.reason}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-600 mb-2">🟢 Positive Trends (8-10)</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Crime rates decreasing consistently</li>
              <li>• Community safety improving</li>
              <li>• Lower incident frequency</li>
            </ul>
          </div>

          <div>
            <div className="font-medium text-yellow-600 mb-2">🟡 Stable Trends (6-7.9)</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Crime rates relatively stable</li>
              <li>• Minor fluctuations only</li>
              <li>• No significant changes</li>
            </ul>
          </div>

          <div>
            <div className="font-medium text-orange-600 mb-2">🟠 Watch Trends (4-5.9)</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Gradual increase in incidents</li>
              <li>• Requires monitoring</li>
              <li>• Mixed trend signals</li>
            </ul>
          </div>

          <div>
            <div className="font-medium text-red-600 mb-2">🔴 Concerning Trends (0-3.9)</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Significant crime increase</li>
              <li>• Safety deteriorating</li>
              <li>• Immediate attention needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCountryName(country: string): string {
  const nameMap: Record<string, string> = {
    australia: 'Australia',
    england: 'England',
    china: 'China',
    india: 'India',
    italy: 'Italy',
    ireland: 'Ireland',
    scotland: 'Scotland',
    germany: 'Germany',
    philippines: 'Philippines',
    vietnam: 'Vietnam',
    other: 'Other'
  }

  return nameMap[country] || country.charAt(0).toUpperCase() + country.slice(1)
}
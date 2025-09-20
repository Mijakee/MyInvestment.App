'use client'

import Link from 'next/link'

interface DemographicData {
  education: {
    bachelor: number
    postgraduate: number
    trade: number
    highSchool: number
    other: number
  }
  age: {
    young: number      // 0-24
    working: number    // 25-54
    mature: number     // 55-64
    retired: number    // 65+
  }
  employment: {
    employed: number
    unemployed: number
    notInLabourForce: number
  }
  household: {
    couples: number
    families: number
    singles: number
    group: number
  }
}

interface DemographicChartProps {
  title: string
  data: number[]
  labels: string[]
  color?: string
  type?: 'horizontal' | 'vertical'
  showValues?: boolean
  maxValue?: number
  categoryType?: 'education' | 'dwelling' | 'default'
}

export function DemographicChart({
  title,
  data,
  labels,
  color = 'blue',
  type = 'horizontal',
  showValues = true,
  maxValue,
  categoryType = 'default'
}: DemographicChartProps) {
  const max = maxValue || Math.max(...data)

  const getIcon = (label: string, categoryType: string) => {
    if (categoryType === 'education') {
      if (label.includes('Bachelor') || label.includes('Postgraduate')) {
        return (
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        )
      } else if (label.includes('Trade')) {
        return (
          <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      } else if (label.includes('High School')) {
        return (
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      } else {
        return (
          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      }
    } else if (categoryType === 'dwelling') {
      if (label.includes('Houses')) {
        return (
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      } else if (label.includes('Apartments')) {
        return (
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m0 0h3" />
          </svg>
        )
      } else if (label.includes('Townhouses')) {
        return (
          <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        )
      } else {
        return (
          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m0 0h3" />
          </svg>
        )
      }
    }
    return null
  }

  if (type === 'vertical') {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
        <div className="flex items-end justify-between space-x-2 h-40">
          {data.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex flex-col justify-end h-32 w-full">
                <div
                  className={`w-full bg-${color}-400 rounded-t transition-all duration-700 hover:bg-${color}-500`}
                  style={{ height: `${(value / max) * 100}%` }}
                  title={`${labels[index]}: ${value}${typeof value === 'number' && value <= 1 ? '%' : ''}`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center leading-tight">
                {labels[index]}
              </div>
              {showValues && (
                <div className="text-xs font-medium text-gray-800 mt-1">
                  {typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(1)}%` :
                   typeof value === 'number' && value > 100 ? value.toLocaleString() :
                   `${typeof value === 'number' ? value.toFixed(1) : value}%`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
      <div className="space-y-3">
        {data.map((value, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-700 truncate flex items-center" title={labels[index]}>
              {getIcon(labels[index], categoryType)}
              <span>{labels[index]}</span>
            </div>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className={`bg-${color}-500 h-4 rounded-full transition-all duration-500 hover:bg-${color}-600 relative`}
                  style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                >
                  {showValues && (
                    <span className="absolute right-2 top-0 text-xs text-white font-medium leading-4">
                      {typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(1)}%` :
                       typeof value === 'number' && value > 100 ? value.toLocaleString() :
                       `${typeof value === 'number' ? value.toFixed(1) : value}%`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-800 text-right">
              {typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(1)}%` :
               typeof value === 'number' && value > 100 ? value.toLocaleString() :
               `${typeof value === 'number' ? value.toFixed(1) : value}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface EconomicTileProps {
  title: string
  value: number | string
  subtitle?: string
  color?: string
  icon?: React.ReactNode
  format?: 'currency' | 'percentage' | 'number' | 'text'
}

export function EconomicTile({
  title,
  value,
  subtitle,
  color = 'blue',
  icon,
  format = 'number'
}: EconomicTileProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'percentage':
        return `${typeof val === 'number' ? val.toFixed(1) : val}%`
      case 'number':
        return val.toLocaleString()
      default:
        return val
    }
  }

  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 bg-${color}-500 rounded-xl flex items-center justify-center`}>
          {icon || (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
      </div>
      <div className={`text-3xl font-bold text-${color}-700 mb-1`}>
        {formatValue(value)}
      </div>
      <div className={`text-${color}-600 font-medium mb-1`}>{title}</div>
      {subtitle && (
        <div className={`text-sm text-${color}-500`}>{subtitle}</div>
      )}
    </div>
  )
}

interface SafetyBreakdownProps {
  safetyRating: {
    overallRating: number
    components: {
      crimeRating: number
      demographicRating: number
      neighborhoodRating: number
      trendRating: number
    }
    confidence: number
  }
}

export function SafetyBreakdown({ safetyRating }: SafetyBreakdownProps) {
  const components = [
    {
      name: 'Crime Safety',
      value: safetyRating.components.crimeRating,
      weight: 70,
      color: 'red',
      description: 'Based on local crime rates and severity'
    },
    {
      name: 'Neighborhood Crime',
      value: safetyRating.components.neighborhoodRating,
      weight: 30,
      color: 'green',
      description: 'Crime influence from surrounding areas'
    },
    {
      name: 'Demographics',
      value: safetyRating.components.demographicRating,
      weight: 0,
      color: 'blue',
      description: 'Moved to separate livability score',
      hidden: true
    },
    {
      name: 'Trends',
      value: safetyRating.components.trendRating,
      weight: 0,
      color: 'purple',
      description: 'Moved to separate trend analysis',
      hidden: true
    }
  ]

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-gray-800">Safety Rating Breakdown</h4>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-gray-800">
            {safetyRating.overallRating.toFixed(1)}/10
          </div>
          <div className="text-sm text-gray-500">
            {(safetyRating.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {components.filter(c => !c.hidden).map((component, index) => (
          <div key={index} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${component.color}-500 rounded-full`} />
                <span className="font-medium text-gray-800">{component.name}</span>
                <span className="text-sm text-gray-500">({component.weight}%)</span>
              </div>
              <span className="font-bold text-gray-800">
                {component.value.toFixed(1)}/10
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
              <div
                className={`bg-${component.color}-500 h-3 rounded-full transition-all duration-500`}
                style={{ width: `${(component.value / 10) * 100}%` }}
              />
            </div>

            <p className="text-sm text-gray-600">{component.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-gray-800">Safety Rating Methodology</h5>
          <Link
            href="/how-it-works"
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            How it works →
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Learn about our comprehensive safety rating calculation methodology and data sources.
        </p>
      </div>
    </div>
  )
}
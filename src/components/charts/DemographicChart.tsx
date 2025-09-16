'use client'

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
}

export function DemographicChart({
  title,
  data,
  labels,
  color = 'blue',
  type = 'horizontal',
  showValues = true,
  maxValue
}: DemographicChartProps) {
  const max = maxValue || Math.max(...data)

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
                   `${value}%`}
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
            <div className="w-28 text-sm text-gray-700 truncate" title={labels[index]}>
              {labels[index]}
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
                       `${value}%`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-800 text-right">
              {typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(1)}%` :
               typeof value === 'number' && value > 100 ? value.toLocaleString() :
               `${value}%`}
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
        return `${val}%`
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
      weight: 50,
      color: 'red',
      description: 'Based on local crime rates and severity'
    },
    {
      name: 'Demographics',
      value: safetyRating.components.demographicRating,
      weight: 25,
      color: 'blue',
      description: 'Income, education, and stability factors'
    },
    {
      name: 'Neighborhood',
      value: safetyRating.components.neighborhoodRating,
      weight: 15,
      color: 'green',
      description: 'Influence from surrounding areas'
    },
    {
      name: 'Trends',
      value: safetyRating.components.trendRating,
      weight: 10,
      color: 'purple',
      description: 'Historical improvement or decline'
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
        {components.map((component, index) => (
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
        <h5 className="font-medium text-gray-800 mb-2">Calculation Formula</h5>
        <p className="text-sm text-gray-600 font-mono">
          Overall = (Crime × 0.50) + (Demographics × 0.25) + (Neighborhood × 0.15) + (Trends × 0.10)
        </p>
      </div>
    </div>
  )
}
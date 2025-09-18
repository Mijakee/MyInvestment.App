'use client'

import { useState } from 'react'

interface TransportAccessibilityRating {
  overall_score: number
  nearest_stop_distance: number
  stop_density: number
  service_frequency: number
  accessibility_features: number
  transport_types: number
  coverage_score: number
  explanation: string
  confidence: number
}

interface SafetyRating {
  suburbCode: string
  suburbName: string
  overallRating: number
  components: {
    crimeRating: number
    demographicRating: number
    neighborhoodRating: number
    transportRating: number
    trendRating: number
  }
  confidence: number
  lastUpdated: Date
  dataAvailability: {
    hasCensusData: boolean
    hasCrimeData: boolean
    hasNeighborData: boolean
    hasTransportData: boolean
  }
  transportAccessibility?: TransportAccessibilityRating
}

interface EnhancedSafetyRatingProps {
  safetyRating: SafetyRating
  showDetails?: boolean
}

export function EnhancedSafetyRating({ safetyRating, showDetails = false }: EnhancedSafetyRatingProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(showDetails)

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    if (rating >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRatingBg = (rating: number): string => {
    if (rating >= 8) return 'bg-green-50 border-green-200'
    if (rating >= 6) return 'bg-yellow-50 border-yellow-200'
    if (rating >= 4) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getTransportLevel = (score: number): { level: string, color: string } => {
    if (score >= 8) return { level: 'Excellent', color: 'text-green-600' }
    if (score >= 6) return { level: 'Good', color: 'text-blue-600' }
    if (score >= 4) return { level: 'Fair', color: 'text-yellow-600' }
    if (score >= 2) return { level: 'Poor', color: 'text-orange-600' }
    return { level: 'Very Poor', color: 'text-red-600' }
  }

  const componentWeights = {
    crimeRating: { weight: 45, label: 'Crime Safety' },
    demographicRating: { weight: 25, label: 'Demographics' },
    neighborhoodRating: { weight: 15, label: 'Neighborhood' },
    transportRating: { weight: 10, label: 'Transport Access' },
    trendRating: { weight: 5, label: 'Safety Trends' }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{safetyRating.suburbName}</h3>
          <p className="text-sm text-muted-foreground">Safety Rating Analysis</p>
        </div>
        <div className={`text-right p-3 rounded-lg border ${getRatingBg(safetyRating.overallRating)}`}>
          <div className={`text-3xl font-bold ${getRatingColor(safetyRating.overallRating)}`}>
            {safetyRating.overallRating.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">out of 10</div>
        </div>
      </div>

      {/* Overall Rating Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Safety Score</span>
          <span className="text-sm text-muted-foreground">
            {(safetyRating.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              safetyRating.overallRating >= 8 ? 'bg-green-500' :
              safetyRating.overallRating >= 6 ? 'bg-yellow-500' :
              safetyRating.overallRating >= 4 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${(safetyRating.overallRating / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-foreground">Rating Components</h4>
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {detailsExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(safetyRating.components).map(([key, value]) => {
            const config = componentWeights[key as keyof typeof componentWeights]
            const isTransport = key === 'transportRating'

            return (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{config.label}</span>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getRatingColor(value)}`}>
                      {value.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({config.weight}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 8 ? 'bg-green-400' :
                      value >= 6 ? 'bg-yellow-400' :
                      value >= 4 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>

                {/* Transport accessibility details */}
                {isTransport && detailsExpanded && safetyRating.transportAccessibility && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-muted-foreground mb-2">
                      Transport Accessibility Details:
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Nearest Stop:</span>
                        <span>{Math.round(safetyRating.transportAccessibility.nearest_stop_distance)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stop Density:</span>
                        <span>{safetyRating.transportAccessibility.stop_density.toFixed(1)}/km²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Frequency:</span>
                        <span>{safetyRating.transportAccessibility.service_frequency.toFixed(1)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accessibility Level:</span>
                        <span className={getTransportLevel(safetyRating.transportAccessibility.overall_score).color}>
                          {getTransportLevel(safetyRating.transportAccessibility.overall_score).level}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground italic">
                      {safetyRating.transportAccessibility.explanation}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Data Availability */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="text-sm font-medium text-foreground mb-3">Data Sources</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className={`flex items-center ${safetyRating.dataAvailability.hasCensusData ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${safetyRating.dataAvailability.hasCensusData ? 'bg-green-500' : 'bg-gray-300'}`} />
            Census Data
          </div>
          <div className={`flex items-center ${safetyRating.dataAvailability.hasCrimeData ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${safetyRating.dataAvailability.hasCrimeData ? 'bg-green-500' : 'bg-gray-300'}`} />
            Crime Data
          </div>
          <div className={`flex items-center ${safetyRating.dataAvailability.hasNeighborData ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${safetyRating.dataAvailability.hasNeighborData ? 'bg-green-500' : 'bg-gray-300'}`} />
            Geographic Data
          </div>
          <div className={`flex items-center ${safetyRating.dataAvailability.hasTransportData ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${safetyRating.dataAvailability.hasTransportData ? 'bg-green-500' : 'bg-gray-300'}`} />
            Transport Data
          </div>
        </div>
      </div>

      {/* Algorithm Info */}
      {detailsExpanded && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Enhanced Algorithm (v2.0)</h5>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Crime Safety: 45% weight (reduced from 50% to accommodate transport)</div>
            <div>• Demographics: 25% weight (socioeconomic factors)</div>
            <div>• Neighborhood: 15% weight (geographic influence from nearby areas)</div>
            <div>• Transport Access: 10% weight (NEW - public transport accessibility)</div>
            <div>• Safety Trends: 5% weight (historical crime trend analysis)</div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Last updated: {safetyRating.lastUpdated.toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}
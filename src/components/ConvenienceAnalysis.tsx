'use client'

import { useState, useEffect } from 'react'

interface ConvenienceAnalysisProps {
  suburbCode: string
  latitude: number
  longitude: number
}

interface ConvenienceScore {
  overallScore: number
  confidence: number
  components: {
    transportScore: number
    shoppingScore: number
    healthScore: number
    recreationScore: number
  }
  details: {
    transport: {
      nearbyStops: number
      accessibilityScore: number
    }
    shopping: {
      nearbyCentres: number
      groceryAccess: number
    }
    health: {
      nearbyFacilities: number
      pharmacyAccess: number
    }
    recreation: {
      nearbyParks: number
      leisureFacilities: number
    }
  }
}

export function ConvenienceAnalysis({ suburbCode, latitude, longitude }: ConvenienceAnalysisProps) {
  const [convenienceData, setConvenienceData] = useState<ConvenienceScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConvenienceData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/convenience-enhanced?sal_code=${suburbCode}&lat=${latitude}&lng=${longitude}`)

        if (!response.ok) {
          throw new Error('Failed to fetch convenience data')
        }

        const data = await response.json()
        if (data.success && data.data) {
          setConvenienceData(data.data)
        } else {
          throw new Error(data.error || 'No convenience data available')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load convenience data')
        console.error('Error fetching convenience data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConvenienceData()
  }, [suburbCode, latitude, longitude])

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-emerald-600'
    if (score >= 7.5) return 'text-emerald-500'
    if (score >= 6.5) return 'text-blue-600'
    if (score >= 5.5) return 'text-blue-500'
    if (score >= 4.5) return 'text-amber-600'
    return 'text-orange-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 8.5) return 'bg-emerald-500/20 border-emerald-200'
    if (score >= 7.5) return 'bg-emerald-400/20 border-emerald-200'
    if (score >= 6.5) return 'bg-blue-500/20 border-blue-200'
    if (score >= 5.5) return 'bg-blue-400/20 border-blue-200'
    if (score >= 4.5) return 'bg-amber-500/20 border-amber-200'
    return 'bg-orange-500/20 border-orange-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8.5) return 'Excellent'
    if (score >= 7.5) return 'Very Good'
    if (score >= 6.5) return 'Good'
    if (score >= 5.5) return 'Fair'
    if (score >= 4.5) return 'Limited'
    return 'Poor'
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Convenience Analysis</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !convenienceData) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Convenience Analysis</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-amber-800 text-sm">{error || 'Convenience data not available'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Convenience Analysis</h2>

      {/* Overall Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Overall Convenience Score</h3>
            <p className="text-sm text-muted-foreground">
              Based on transport, shopping, health, and recreation access
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(convenienceData.overallScore)}`}>
              {convenienceData.overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">
              {getScoreLabel(convenienceData.overallScore)}
            </div>
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(convenienceData.overallScore / 10) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`text-center p-4 rounded-xl border ${getScoreBg(convenienceData.components.transportScore)}`}>
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm font-medium text-foreground">Transport</span>
          </div>
          <div className={`text-xl font-bold mb-1 ${getScoreColor(convenienceData.components.transportScore)}`}>
            {convenienceData.components.transportScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {convenienceData.details?.transport?.nearbyStops || 0} nearby stops
          </div>
        </div>

        <div className={`text-center p-4 rounded-xl border ${getScoreBg(convenienceData.components.shoppingScore)}`}>
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Shopping</span>
          </div>
          <div className={`text-xl font-bold mb-1 ${getScoreColor(convenienceData.components.shoppingScore)}`}>
            {convenienceData.components.shoppingScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {convenienceData.details?.shopping?.nearbyCentres || 0} centres nearby
          </div>
        </div>

        <div className={`text-center p-4 rounded-xl border ${getScoreBg(convenienceData.components.healthScore)}`}>
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Health</span>
          </div>
          <div className={`text-xl font-bold mb-1 ${getScoreColor(convenienceData.components.healthScore)}`}>
            {convenienceData.components.healthScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {convenienceData.details?.health?.nearbyFacilities || 0} facilities
          </div>
        </div>

        <div className={`text-center p-4 rounded-xl border ${getScoreBg(convenienceData.components.recreationScore)}`}>
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Recreation</span>
          </div>
          <div className={`text-xl font-bold mb-1 ${getScoreColor(convenienceData.components.recreationScore)}`}>
            {convenienceData.components.recreationScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {convenienceData.details?.recreation?.nearbyParks || 0} parks nearby
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Analysis confidence: <span className="font-medium">{(convenienceData.confidence * 100).toFixed(0)}%</span>
        </span>
        <span className="text-muted-foreground">
          Based on 38,862 facility database
        </span>
      </div>
    </div>
  )
}
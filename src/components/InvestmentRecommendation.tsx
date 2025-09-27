'use client'

import { useState, useEffect } from 'react'

interface InvestmentRecommendationProps {
  suburbCode: string
  suburbName: string
  safetyRating?: number
  convenienceScore?: number
}

interface CombinedAnalysis {
  investmentIndex: number
  recommendation: string
  explanation: string
  safetyWeight: number
  convenienceWeight: number
  safetyRating: number
  convenienceScore: number
  riskLevel: string
  keyStrengths: string[]
  potentialConcerns: string[]
  investmentAdvice: string
}

export function InvestmentRecommendation({
  suburbCode,
  suburbName,
  safetyRating,
  convenienceScore
}: InvestmentRecommendationProps) {
  const [investmentData, setInvestmentData] = useState<CombinedAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvestmentData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/convenience?sal_code=${suburbCode}&action=combined`)

        if (!response.ok) {
          throw new Error('Failed to fetch investment analysis')
        }

        const data = await response.json()
        if (data.success && data.data) {
          setInvestmentData(data.data)
        } else {
          throw new Error(data.error || 'No investment analysis available')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load investment analysis')
        console.error('Error fetching investment data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvestmentData()
  }, [suburbCode])

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('excellent')) return 'text-green-600'
    if (recommendation.toLowerCase().includes('good')) return 'text-blue-600'
    if (recommendation.toLowerCase().includes('fair')) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRecommendationBg = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('excellent')) return 'bg-green-500/10 border-green-200'
    if (recommendation.toLowerCase().includes('good')) return 'bg-blue-500/10 border-blue-200'
    if (recommendation.toLowerCase().includes('fair')) return 'bg-amber-500/10 border-amber-200'
    return 'bg-red-500/10 border-red-200'
  }

  const getRiskColor = (risk: string) => {
    if (risk.toLowerCase().includes('low')) return 'text-green-600 bg-green-50'
    if (risk.toLowerCase().includes('medium')) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Investment Recommendation</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !investmentData) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Investment Recommendation</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-amber-800 text-sm">{error || 'Investment analysis not available'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Investment Recommendation</h2>

      {/* Main Recommendation */}
      <div className={`p-6 rounded-xl border mb-6 ${getRecommendationBg(investmentData.recommendation)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">{suburbName}</h3>
            <div className={`text-2xl font-bold ${getRecommendationColor(investmentData.recommendation)}`}>
              {investmentData.recommendation}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary mb-1">
              {investmentData.investmentIndex.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Investment Index</div>
          </div>
        </div>

        <p className="text-foreground">{investmentData.explanation}</p>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">Safety Rating</span>
            <span className="text-lg font-bold text-green-600">
              {investmentData.safetyRating.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Weight: {(investmentData.safetyWeight * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(investmentData.safetyRating / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">Convenience Score</span>
            <span className="text-lg font-bold text-emerald-600">
              {investmentData.convenienceScore.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Weight: {(investmentData.convenienceWeight * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${(investmentData.convenienceScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">Risk Assessment</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(investmentData.riskLevel)}`}>
            {investmentData.riskLevel} Risk
          </span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Key Strengths
          </h4>
          <ul className="space-y-2">
            {investmentData.keyStrengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Considerations
          </h4>
          <ul className="space-y-2">
            {investmentData.potentialConcerns.map((concern, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-foreground">{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Investment Advice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Investment Advice
        </h4>
        <p className="text-blue-900 text-sm">{investmentData.investmentAdvice}</p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not be considered as financial advice.
          Always consult with qualified investment professionals and conduct your own due diligence before making property investment decisions.
        </p>
      </div>
    </div>
  )
}
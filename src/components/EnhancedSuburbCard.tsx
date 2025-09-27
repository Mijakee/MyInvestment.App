'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { SafetyRatingBadge } from './SafetyRatingBadge'
import { ConvenienceBadge } from './ConvenienceBadge'

interface EnhancedSuburbCardProps {
  suburb: {
    sal_code: string
    sal_name: string
    state: string
    latitude: number
    longitude: number
    classification_type: string
    economic_base: string[]
    sa2_mappings: any[]
  }
}

interface SafetyRating {
  overallRating: number
  confidence: number
  components: {
    crimeRating: number
    demographicRating: number
    neighborhoodRating: number
    trendRating: number
  }
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
}

interface CombinedScore {
  investmentIndex: number
  recommendation: string
  safetyWeight: number
  convenienceWeight: number
}

export function EnhancedSuburbCard({ suburb }: EnhancedSuburbCardProps) {
  const [safetyRating, setSafetyRating] = useState<SafetyRating | null>(null)
  const [convenienceScore, setConvenienceScore] = useState<ConvenienceScore | null>(null)
  const [combinedScore, setCombinedScore] = useState<CombinedScore | null>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  const fetchRatings = async () => {
    if (loadingState !== 'idle') return

    setLoadingState('loading')

    try {
      // Fetch safety rating and convenience score in parallel
      const [safetyResponse, convenienceResponse, combinedResponse] = await Promise.all([
        fetch(`/api/safety?sal_code=${suburb.sal_code}`).catch(() => null),
        fetch(`/api/convenience-enhanced?sal_code=${suburb.sal_code}`).catch(() => null),
        fetch(`/api/convenience?sal_code=${suburb.sal_code}&action=combined`).catch(() => null)
      ])

      // Process safety rating
      if (safetyResponse?.ok) {
        const safetyData = await safetyResponse.json()
        if (safetyData.success && safetyData.data) {
          setSafetyRating({
            overallRating: safetyData.data.overallRating,
            confidence: safetyData.data.confidence || 0.8,
            components: safetyData.data.components || {
              crimeRating: 0,
              demographicRating: 0,
              neighborhoodRating: 0,
              trendRating: 0
            }
          })
        }
      }

      // Process convenience score
      if (convenienceResponse?.ok) {
        const convenienceData = await convenienceResponse.json()
        if (convenienceData.success && convenienceData.data) {
          setConvenienceScore({
            overallScore: convenienceData.data.overallScore,
            confidence: convenienceData.data.confidence || 0.8,
            components: convenienceData.data.components || {
              transportScore: 0,
              shoppingScore: 0,
              healthScore: 0,
              recreationScore: 0
            }
          })
        }
      }

      // Process combined investment score
      if (combinedResponse?.ok) {
        const combinedData = await combinedResponse.json()
        if (combinedData.success && combinedData.data) {
          setCombinedScore({
            investmentIndex: combinedData.data.investmentIndex,
            recommendation: combinedData.data.recommendation,
            safetyWeight: combinedData.data.safetyWeight || 0.6,
            convenienceWeight: combinedData.data.convenienceWeight || 0.4
          })
        }
      }

      setLoadingState('loaded')
    } catch (error) {
      console.log(`Error fetching data for ${suburb.sal_name}:`, error)
      setLoadingState('error')
    }
  }

  // Load data when component becomes visible (intersection observer would be better for production)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRatings()
    }, Math.random() * 1000) // Stagger requests

    return () => clearTimeout(timer)
  }, [suburb.sal_code])

  const getClassificationStyle = (type: string) => {
    const styles = {
      'Urban': 'bg-blue-500 text-white',
      'Suburban': 'bg-green-500 text-white',
      'Remote': 'bg-orange-500 text-white',
      'Mining': 'bg-red-500 text-white',
      'Coastal': 'bg-cyan-500 text-white',
      'Regional Town': 'bg-purple-500 text-white',
      'Rural': 'bg-yellow-600 text-white'
    }
    return styles[type as keyof typeof styles] || 'bg-gray-500 text-white'
  }

  const getInvestmentRecommendationStyle = (recommendation: string) => {
    if (recommendation?.toLowerCase().includes('excellent')) return 'text-green-600 font-bold'
    if (recommendation?.toLowerCase().includes('good')) return 'text-blue-600 font-semibold'
    if (recommendation?.toLowerCase().includes('fair')) return 'text-amber-600 font-medium'
    return 'text-red-600 font-medium'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-primary/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {suburb.sal_name}
            </h3>
            <p className="text-sm text-muted-foreground">SAL {suburb.sal_code}</p>
          </div>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getClassificationStyle(suburb.classification_type)}`}>
            {suburb.classification_type}
          </span>
        </div>

        {/* Ratings Section */}
        <div className="space-y-3 mb-5">
          {/* Safety Rating */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Safety:</span>
            {safetyRating ? (
              <SafetyRatingBadge
                rating={safetyRating.overallRating}
                confidence={safetyRating.confidence}
                size="sm"
                showLabel={false}
              />
            ) : loadingState === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
            ) : (
              <span className="text-xs text-muted-foreground">No data</span>
            )}
          </div>

          {/* Convenience Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Convenience:</span>
            {convenienceScore ? (
              <ConvenienceBadge
                score={convenienceScore.overallScore}
                confidence={convenienceScore.confidence}
                size="sm"
                showLabel={false}
              />
            ) : loadingState === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
            ) : (
              <span className="text-xs text-muted-foreground">No data</span>
            )}
          </div>

          {/* Investment Index */}
          {combinedScore && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm font-semibold text-foreground">Investment Index:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {combinedScore.investmentIndex.toFixed(1)}
                </span>
                <span className={`text-xs ${getInvestmentRecommendationStyle(combinedScore.recommendation)}`}>
                  {combinedScore.recommendation.split(' ')[0]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Location Details */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="w-4 h-4 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {suburb.latitude.toFixed(3)}°, {suburb.longitude.toFixed(3)}°
          </div>

          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className={suburb.sa2_mappings.length > 0 ? 'text-success font-medium' : 'text-warning font-medium'}>
              {suburb.sa2_mappings.length > 0 ? 'Complete data available' : 'Limited data coverage'}
            </span>
          </div>

          {suburb.economic_base && suburb.economic_base.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <svg className="w-4 h-4 mr-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
              </svg>
              {suburb.economic_base.slice(0, 2).join(', ')}
              {suburb.economic_base.length > 2 && ` +${suburb.economic_base.length - 2} more`}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/suburbs/${suburb.sal_code}`}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-center py-2 px-4 rounded-lg font-medium transition-all duration-200"
          >
            View Full Analysis
          </Link>
          <button
            onClick={fetchRatings}
            disabled={loadingState === 'loading'}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Refresh Data"
          >
            {loadingState === 'loading' ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
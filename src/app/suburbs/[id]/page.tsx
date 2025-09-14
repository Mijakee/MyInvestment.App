'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getSafetyRatingInfo, formatCurrency, formatPercentage, formatNumber } from '@/utils/helpers'
import type { SuburbAnalysis, ApiResponse } from '@/types'

export default function SuburbDetailPage() {
  const params = useParams()
  const suburbId = params.id as string

  const [analysis, setAnalysis] = useState<SuburbAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!suburbId) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/analysis/${suburbId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch suburb analysis')
        }

        const data: ApiResponse<SuburbAnalysis> = await response.json()

        if (data.success && data.data) {
          setAnalysis(data.data)
        } else {
          throw new Error(data.error || 'Failed to load analysis')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching analysis:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [suburbId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suburb analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Suburb not found'}</p>
          <Link
            href="/suburbs"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Suburbs
          </Link>
        </div>
      </div>
    )
  }

  const { suburb, latestCensus, latestCrime } = analysis
  const safetyInfo = getSafetyRatingInfo(suburb.safetyRating)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/suburbs"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            ← Back to Suburbs
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {suburb.name}
                </h1>
                <p className="text-xl text-gray-600">
                  {suburb.state} {suburb.postcode}
                </p>
                {suburb.latitude && suburb.longitude && (
                  <p className="text-sm text-gray-500 mt-2">
                    {suburb.latitude.toFixed(4)}, {suburb.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className="flex items-center mb-2">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4"
                    style={{ backgroundColor: safetyInfo.color }}
                  >
                    {safetyInfo.rating}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Safety Rating</p>
                    <p className="font-medium" style={{ color: safetyInfo.color }}>
                      {safetyInfo.label}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {analysis.investmentScore}/10
                  </p>
                  <p className="text-sm text-gray-500">Investment Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {suburb.population ? formatNumber(suburb.population) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Population</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(latestCensus.medianHouseholdIncome)}
                  </p>
                  <p className="text-sm text-gray-500">Median Income</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(latestCensus.medianRent)}/week
                  </p>
                  <p className="text-sm text-gray-500">Median Rent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPercentage(latestCensus.unemploymentRate)}
                  </p>
                  <p className="text-sm text-gray-500">Unemployment</p>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Demographics ({latestCensus.year})</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Education Level</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>High School</span>
                      <span className="font-medium">{formatPercentage(latestCensus.educationLevel.highSchool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bachelor's</span>
                      <span className="font-medium">{formatPercentage(latestCensus.educationLevel.bachelor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Postgraduate</span>
                      <span className="font-medium">{formatPercentage(latestCensus.educationLevel.postgraduate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Household Types</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Couples</span>
                      <span className="font-medium">{formatPercentage(latestCensus.householdComposition.couples)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Single Parent</span>
                      <span className="font-medium">{formatPercentage(latestCensus.householdComposition.singleParent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Single Person</span>
                      <span className="font-medium">{formatPercentage(latestCensus.householdComposition.singlePerson)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Crime Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Crime Statistics ({latestCrime.year})
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  latestCrime.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                  latestCrime.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {latestCrime.trend}
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600">{latestCrime.totalOffenses}</p>
                  <p className="text-sm text-gray-500">Total Offenses</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-600">{latestCrime.crimeRate}</p>
                  <p className="text-sm text-gray-500">Per 1,000 People</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(latestCrime.categories).map(([category, count]) => (
                  <div key={category} className="text-center p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{count}</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Investment Analysis</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Growth Potential</p>
                <p className={`font-semibold capitalize ${
                  analysis.growthPotential === 'high' ? 'text-green-600' :
                  analysis.growthPotential === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.growthPotential}
                </p>
              </div>

              {analysis.recommendations.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-green-800 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.riskFactors.length > 0 && (
                <div>
                  <p className="font-medium text-red-800 mb-2">Risk Factors</p>
                  <ul className="space-y-1">
                    {analysis.riskFactors.map((risk, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start">
                        <span className="text-red-500 mr-2">!</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Dwelling Types */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Property Types</h2>
              <div className="space-y-3">
                {Object.entries(latestCensus.dwellingTypes).map(([type, percentage]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{formatPercentage(percentage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'

interface SuburbDetailsModalProps {
  suburbName: string
  isOpen: boolean
  onClose: () => void
}

interface SuburbDetails {
  name: string
  safetyRating: number
  convenienceScore: number
  combinedScore: number
  population?: number
  confidence: number
  details: {
    crimeRating: number
    demographicRating: number
    neighborhoodRating: number
    trendRating: number
    transportScore: number
    shoppingScore: number
    educationScore: number
    recreationScore: number
  }
}

export default function SuburbDetailsModal({ suburbName, isOpen, onClose }: SuburbDetailsModalProps) {
  const [details, setDetails] = useState<SuburbDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && suburbName) {
      loadSuburbDetails()
    }
  }, [isOpen, suburbName])

  const loadSuburbDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data for now - in production this would call the suburb detail API
      const mockDetails: SuburbDetails = {
        name: suburbName,
        safetyRating: Math.random() * 4 + 5, // 5-9 range
        convenienceScore: Math.random() * 4 + 5,
        combinedScore: Math.random() * 4 + 5,
        population: Math.floor(Math.random() * 20000 + 5000),
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
        details: {
          crimeRating: Math.random() * 4 + 5,
          demographicRating: Math.random() * 4 + 5,
          neighborhoodRating: Math.random() * 4 + 5,
          trendRating: Math.random() * 4 + 5,
          transportScore: Math.random() * 4 + 5,
          shoppingScore: Math.random() * 4 + 5,
          educationScore: Math.random() * 4 + 5,
          recreationScore: Math.random() * 4 + 5
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setDetails(mockDetails)
    } catch (err) {
      setError('Failed to load suburb details')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {suburbName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading suburb details...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadSuburbDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {details && (
            <div className="space-y-6">
              {/* Overall Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {details.safetyRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Safety Rating</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {details.convenienceScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Convenience Score</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {details.combinedScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Investment Index</div>
                </div>
              </div>

              {/* Safety Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Components</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crime Rating</span>
                    <span className="font-medium">{details.details.crimeRating.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Demographics</span>
                    <span className="font-medium">{details.details.demographicRating.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Neighborhood</span>
                    <span className="font-medium">{details.details.neighborhoodRating.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trends</span>
                    <span className="font-medium">{details.details.trendRating.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              {/* Convenience Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Convenience Components</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transport Access</span>
                    <span className="font-medium">{details.details.transportScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shopping/Services</span>
                    <span className="font-medium">{details.details.shoppingScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Education</span>
                    <span className="font-medium">{details.details.educationScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recreation</span>
                    <span className="font-medium">{details.details.recreationScore.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Population:</span>
                    <span className="font-medium ml-2">{details.population?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Confidence:</span>
                    <span className="font-medium ml-2">{(details.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.href = `/suburbs?search=${encodeURIComponent(suburbName)}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Full Analysis
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
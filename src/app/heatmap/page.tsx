'use client'

import React, { useState } from 'react'
import SuburbBoundaryHeatMap from '../../components/SuburbBoundaryHeatMap'
import SuburbDetailsModal from '../../components/SuburbDetailsModal'

export default function HeatMapPage() {
  const [selectedMetric, setSelectedMetric] = useState<'crime' | 'convenience' | 'investment'>('investment')
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleSuburbClick = (suburbName: string) => {
    setSelectedSuburb(suburbName)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                WA Property Investment Heat Map
              </h1>
              <p className="mt-2 text-gray-600">
                Interactive visualization of crime scores and convenience scores across 1,701 WA suburbs
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedMetric('crime')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'crime'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Crime Score
              </button>
              <button
                onClick={() => setSelectedMetric('convenience')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'convenience'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Convenience Score
              </button>
              <button
                onClick={() => setSelectedMetric('investment')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'investment'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Investment Index
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Map Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedMetric === 'crime' && 'Crime Score Heat Map'}
                    {selectedMetric === 'convenience' && 'Convenience Score Heat Map'}
                    {selectedMetric === 'investment' && 'Investment Index Heat Map'}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Real-time data from 1,701 suburbs
                  </div>
                </div>

                <SuburbBoundaryHeatMap
                  metric={selectedMetric}
                  onSuburbClick={handleSuburbClick}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Metric Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Current Metric
                </h3>

                {selectedMetric === 'crime' && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Crime Score</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Measures crime risk and security concerns based on local crime data and neighborhood crime influence. <strong>Higher scores = worse crime</strong> (1-3: Very Safe, 7-10: High Crime Risk).
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Direct Crime Data: 70%</div>
                      <div>• Neighborhood Crime: 30%</div>
                    </div>
                  </div>
                )}

                {selectedMetric === 'convenience' && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Convenience Score</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Measures daily life convenience and accessibility including transport, shopping, education, and recreation. <strong>Higher scores = better convenience</strong> (1-3: Limited Access, 7-10: Excellent Access).
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Transport Access: 25%</div>
                      <div>• Shopping/Services: 25%</div>
                      <div>• Education: 25%</div>
                      <div>• Recreation: 25%</div>
                    </div>
                  </div>
                )}

                {selectedMetric === 'investment' && (
                  <div>
                    <h4 className="font-medium text-purple-600 mb-2">Investment Index</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Combined investment recommendation balancing both safety and convenience factors. <strong>Higher scores = better investment opportunities</strong> (1-3: High Risk Investment, 7-10: Excellent Investment).
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Inverted Crime Score: 60%</div>
                      <div>• Convenience Score: 40%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Suburb */}
              {selectedSuburb && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Selected Suburb
                  </h3>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{selectedSuburb}</div>
                    <button
                      onClick={() => {
                        // Navigate to suburb detail page
                        window.location.href = `/suburbs?search=${encodeURIComponent(selectedSuburb)}`
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View Detailed Analysis →
                    </button>
                  </div>
                </div>
              )}

              {/* Heat Map Legend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How to Read the Map
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• <strong>Crime Score</strong>: Higher scores = worse crime = darker red colors</p>
                  <p>• <strong>Convenience Score</strong>: Higher scores = better convenience = darker green colors</p>
                  <p>• <strong>Investment Index</strong>: Higher scores = better investment = darker purple colors</p>
                  <p>• <strong>Light colors</strong> indicate lower scores for each metric</p>
                  <p>• Click any suburb to view detailed analysis</p>
                  <p>• Switch between Crime, Convenience, and Investment metrics using buttons above</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Navigation
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/suburbs'}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Browse All Suburbs
                  </button>
                  <button
                    onClick={() => window.location.href = '/how-it-works'}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <div className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Data Sources</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• ABS 2021 Census Data</li>
                <li>• WA Police Crime Statistics</li>
                <li>• Transport Accessibility Data</li>
                <li>• Geographic Boundary Data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Coverage</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 1,701 WA Suburbs</li>
                <li>• State-wide Coverage</li>
                <li>• Real-time Calculations</li>
                <li>• Multi-factor Analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Technology</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Interactive Suburb Boundaries</li>
                <li>• Real-time Heat Generation</li>
                <li>• Responsive Design</li>
                <li>• Export Capabilities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Suburb Details Modal */}
      {selectedSuburb && (
        <SuburbDetailsModal
          suburbName={selectedSuburb}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedSuburb(null)
          }}
        />
      )}
    </div>
  )
}
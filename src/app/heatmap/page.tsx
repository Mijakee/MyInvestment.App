'use client'

import React, { useState } from 'react'
import SuburbBoundaryHeatMap from '../../components/SuburbBoundaryHeatMap'
import SuburbDetailsModal from '../../components/SuburbDetailsModal'

export default function HeatMapPage() {
  const [selectedMetric, setSelectedMetric] = useState<'safety' | 'convenience' | 'combined'>('combined')
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
                Interactive visualization of safety ratings and convenience scores across 1,701 WA suburbs
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedMetric('safety')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'safety'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Safety Rating
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
                onClick={() => setSelectedMetric('combined')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'combined'
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
                    {selectedMetric === 'safety' && 'Safety Rating Heat Map'}
                    {selectedMetric === 'convenience' && 'Convenience Score Heat Map'}
                    {selectedMetric === 'combined' && 'Investment Index Heat Map'}
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

                {selectedMetric === 'safety' && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Safety Rating</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Measures actual safety and security risk based on crime data, demographics, and neighborhood analysis.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Crime Data: 50%</div>
                      <div>• Demographics: 25%</div>
                      <div>• Neighborhood: 15%</div>
                      <div>• Trends: 10%</div>
                    </div>
                  </div>
                )}

                {selectedMetric === 'convenience' && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Convenience Score</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Measures daily life convenience and accessibility including transport, shopping, education, and recreation.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Transport Access: 40%</div>
                      <div>• Shopping/Services: 25%</div>
                      <div>• Education: 20%</div>
                      <div>• Recreation: 15%</div>
                    </div>
                  </div>
                )}

                {selectedMetric === 'combined' && (
                  <div>
                    <h4 className="font-medium text-purple-600 mb-2">Investment Index</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Combined investment recommendation balancing both safety and convenience factors.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Safety Rating: 60%</div>
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
                  <p>• <strong>Red/orange areas</strong> indicate lower scores</p>
                  <p>• <strong>Blue/green areas</strong> indicate higher scores</p>
                  <p>• Click on any suburb to see details</p>
                  <p>• Hover for interactive highlighting</p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/api/heatmap?action=export'}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Export Heat Map Data
                  </button>
                  <button
                    onClick={() => window.location.href = '/suburbs'}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Browse All Suburbs
                  </button>
                  <button
                    onClick={() => window.location.href = '/api/heatmap?action=statistics'}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    View Statistics
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
'use client'

import Link from 'next/link'
import { getSafetyRatingInfo, formatNumber } from '@/utils/helpers'
import type { SuburbCardProps } from '@/types'

export default function SuburbCard({ suburb, analysis, onSelect, compact = false }: SuburbCardProps) {
  const safetyInfo = getSafetyRatingInfo(suburb.safetyRating)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {suburb.name}
            </h3>
            <p className="text-gray-600">
              {suburb.state} {suburb.postcode}
            </p>
          </div>
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: safetyInfo.color }}
            >
              {safetyInfo.rating}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Population</p>
            <p className="font-medium">
              {suburb.population ? formatNumber(suburb.population) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Safety Rating</p>
            <p className="font-medium" style={{ color: safetyInfo.color }}>
              {safetyInfo.label}
            </p>
          </div>
        </div>

        {analysis && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Investment Score</p>
                <p className="font-bold text-lg text-blue-600">
                  {analysis.investmentScore}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Growth Potential</p>
                <p className={`font-medium capitalize ${
                  analysis.growthPotential === 'high' ? 'text-green-600' :
                  analysis.growthPotential === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.growthPotential}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(suburb.lastUpdated).toLocaleDateString()}
          </div>
          <Link
            href={`/suburbs/${suburb.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
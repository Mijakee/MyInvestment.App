'use client'

import { useState } from 'react'
import { AUSTRALIAN_STATES } from '@/utils/constants'
import type { SearchCriteria } from '@/types'

interface SearchFiltersProps {
  onSearch: (criteria: SearchCriteria) => void
  isLoading?: boolean
}

export default function SearchFilters({ onSearch, isLoading = false }: SearchFiltersProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [minSafetyRating, setMinSafetyRating] = useState<number>(0)
  const [minPopulation, setMinPopulation] = useState<number>(0)
  const [maxPopulation, setMaxPopulation] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'safetyRating' | 'population'>('safetyRating')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleStateToggle = (stateCode: string) => {
    setSelectedStates(prev =>
      prev.includes(stateCode)
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
    )
  }

  const handleSearch = () => {
    const criteria: SearchCriteria = {
      states: selectedStates.length > 0 ? selectedStates : undefined,
      minSafetyRating: minSafetyRating > 0 ? minSafetyRating : undefined,
      minPopulation: minPopulation > 0 ? minPopulation : undefined,
      maxPopulation: maxPopulation > 0 ? maxPopulation : undefined,
      sortBy,
      sortOrder,
    }
    onSearch(criteria)
  }

  const handleReset = () => {
    setSearchText('')
    setSelectedStates([])
    setMinSafetyRating(0)
    setMinPopulation(0)
    setMaxPopulation(0)
    setSortBy('safetyRating')
    setSortOrder('desc')

    onSearch({
      sortBy: 'safetyRating',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Search & Filter Suburbs</h2>

      {/* Text Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by name or postcode
        </label>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Surry Hills, 2010"
        />
      </div>

      {/* States Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          States/Territories
        </label>
        <div className="flex flex-wrap gap-2">
          {AUSTRALIAN_STATES.map((state) => (
            <button
              key={state.code}
              onClick={() => handleStateToggle(state.code)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedStates.includes(state.code)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {state.code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Safety Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Safety Rating
          </label>
          <select
            value={minSafetyRating}
            onChange={(e) => setMinSafetyRating(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Any</option>
            <option value={6}>6+ (Good)</option>
            <option value={7}>7+ (Very Good)</option>
            <option value={8}>8+ (Excellent)</option>
            <option value={9}>9+ (Outstanding)</option>
          </select>
        </div>

        {/* Min Population */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Population
          </label>
          <input
            type="number"
            value={minPopulation}
            onChange={(e) => setMinPopulation(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* Max Population */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Population
          </label>
          <input
            type="number"
            value={maxPopulation}
            onChange={(e) => setMaxPopulation(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="No limit"
          />
        </div>
      </div>

      {/* Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'safetyRating' | 'population')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="safetyRating">Safety Rating</option>
            <option value="population">Population</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
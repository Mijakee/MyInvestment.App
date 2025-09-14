'use client'

import { useState, useEffect } from 'react'
import SuburbCard from '@/components/SuburbCard'
import SearchFilters from '@/components/SearchFilters'
import type { Suburb, SearchCriteria, PaginatedResponse } from '@/types'

export default function SuburbsPage() {
  const [suburbs, setSuburbs] = useState<Suburb[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  const fetchSuburbs = async (criteria: SearchCriteria = {}, page: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      // Use POST for complex search, GET for simple queries
      const response = await fetch(`/api/search?page=${page}&limit=${pagination.limit}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suburbs')
      }

      const data: PaginatedResponse<Suburb> = await response.json()

      if (data.success && data.data) {
        if (page === 1) {
          setSuburbs(data.data)
        } else {
          setSuburbs(prev => [...prev, ...data.data!])
        }
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch suburbs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching suburbs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchSuburbs({
      sortBy: 'safetyRating',
      sortOrder: 'desc'
    })
  }, [])

  const handleSearch = (criteria: SearchCriteria) => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchSuburbs(criteria, 1)
  }

  const loadMore = () => {
    if (pagination.hasMore && !isLoading) {
      const nextPage = pagination.page + 1
      fetchSuburbs({}, nextPage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Australian Suburbs
          </h1>
          <p className="text-gray-600">
            Find the perfect investment opportunity with comprehensive suburb analysis
          </p>
        </header>

        <SearchFilters onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              {pagination.total > 0 ? (
                <>Showing {suburbs.length} of {pagination.total} suburbs</>
              ) : (
                'No suburbs found'
              )}
            </p>
            {isLoading && (
              <div className="flex items-center text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            )}
          </div>

          {/* Suburbs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suburbs.map((suburb) => (
              <SuburbCard
                key={suburb.id}
                suburb={suburb}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination.hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* Empty State */}
          {suburbs.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No suburbs found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria to find more results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
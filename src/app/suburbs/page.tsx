'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface WASuburb {
  sal_code: string
  sal_name: string
  state: string
  latitude: number
  longitude: number
  classification_type: string
  economic_base: string[]
  sa2_mappings: any[]
}

export default function SuburbsPage() {
  const [suburbs, setSuburbs] = useState<WASuburb[]>([])
  const [filteredSuburbs, setFilteredSuburbs] = useState<WASuburb[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassification, setSelectedClassification] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  const fetchSuburbs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/suburbs?limit=1701')

      if (!response.ok) {
        throw new Error('Failed to fetch suburbs')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setSuburbs(data.data)
        setFilteredSuburbs(data.data)
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

  useEffect(() => {
    fetchSuburbs()
  }, [])

  useEffect(() => {
    let filtered = suburbs

    if (searchTerm) {
      filtered = filtered.filter(suburb =>
        suburb.sal_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedClassification) {
      filtered = filtered.filter(suburb =>
        suburb.classification_type === selectedClassification
      )
    }

    setFilteredSuburbs(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedClassification, suburbs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const classifications = [...new Set(suburbs.map(s => s.classification_type))]
  const totalPages = Math.ceil(filteredSuburbs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentSuburbs = filteredSuburbs.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Explore 1,701 WA Suburbs
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover your next property investment with comprehensive analysis of every suburb in Western Australia
          </p>
        </header>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search Suburbs
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by suburb name..."
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Classification
                </label>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                  className="w-full py-3 px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Classifications</option>
                  {classifications.map(classification => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedClassification('')
                  }}
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-4 rounded-xl font-medium transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground">Loading suburbs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-danger mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-danger font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-foreground">
              Showing {currentSuburbs.length} of {filteredSuburbs.length} suburbs
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedClassification && ` in ${selectedClassification} areas`}
            </p>
            {filteredSuburbs.length > 0 && (
              <div className="text-sm text-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        )}

        {/* Suburbs Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {currentSuburbs.map((suburb) => (
              <div key={suburb.sal_code} className="bg-white rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {suburb.sal_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      suburb.classification_type === 'Urban' ? 'bg-primary/10 text-primary' :
                      suburb.classification_type === 'Suburban' ? 'bg-success/10 text-success' :
                      suburb.classification_type === 'Remote' ? 'bg-warning/10 text-warning' :
                      suburb.classification_type === 'Mining' ? 'bg-danger/10 text-danger' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {suburb.classification_type}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {suburb.latitude.toFixed(3)}°, {suburb.longitude.toFixed(3)}°
                    </div>

                    {suburb.economic_base && suburb.economic_base.length > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        {suburb.economic_base.slice(0, 2).join(', ')}
                        {suburb.economic_base.length > 2 && ` +${suburb.economic_base.length - 2} more`}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-foreground">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {suburb.sa2_mappings.length > 0 ? 'Census data available' : 'Limited data'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/suburbs/${suburb.sal_code}`}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-center py-2 px-4 rounded-lg font-medium transition-all duration-200"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/api/safety?action=suburb&sal_code=${suburb.sal_code}`}
                      target="_blank"
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-3 rounded-lg transition-all duration-200"
                      title="View Safety Rating"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-4 py-2 rounded-lg border border-border transition-all duration-200"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white hover:bg-secondary text-foreground border border-border'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-4 py-2 rounded-lg border border-border transition-all duration-200"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSuburbs.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-2xl mb-6">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              No suburbs found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or filters to find more results.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedClassification('')
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
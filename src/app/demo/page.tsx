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
  police_district?: string
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

interface DemoStats {
  total_suburbs: number
  classifications: Record<string, number>
  economic_bases: Record<string, number>
  with_sa2_mapping: number
  mapping_coverage: {
    sa2_percentage: number
    police_percentage: number
  }
}

export default function DemoPage() {
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [featuredSuburbs, setFeaturedSuburbs] = useState<WASuburb[]>([])
  const [safetyRatings, setSafetyRatings] = useState<Record<string, SafetyRating>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDemo, setSelectedDemo] = useState<'search' | 'classification' | 'crime'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WASuburb[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const loadDemoData = async () => {
      try {
        // Load statistics
        const statsResponse = await fetch('/api/suburbs?action=stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.success) {
            setStats(statsData.data)
          }
        }

        // Load featured suburbs (Perth, Fremantle, Cottesloe, Subiaco)
        const featuredResponse = await fetch('/api/suburbs?action=search&q=Perth&limit=4')
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json()
          if (featuredData.success && featuredData.data.length > 0) {
            setFeaturedSuburbs(featuredData.data.slice(0, 4))

            // Load safety ratings for featured suburbs
            const salCodes = featuredData.data.slice(0, 4).map((s: WASuburb) => s.sal_code).join(',')
            try {
              const safetyResponse = await fetch(`/api/safety?action=batch&sal_codes=${salCodes}`)
              if (safetyResponse.ok) {
                const safetyData = await safetyResponse.json()
                if (safetyData.success && safetyData.data) {
                  const ratingsMap: Record<string, SafetyRating> = {}
                  safetyData.data.forEach((rating: SafetyRating & { sal_code: string }) => {
                    ratingsMap[rating.sal_code] = rating
                  })
                  setSafetyRatings(ratingsMap)
                }
              }
            } catch (error) {
              console.warn('Safety ratings not available for demo')
            }
          }
        }
      } catch (error) {
        console.error('Error loading demo data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDemoData()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/suburbs?action=search&q=${encodeURIComponent(searchQuery)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.data || [])
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const getSafetyColor = (score: number) => {
    if (score >= 8) return 'hsl(145, 65%, 55%)' // success
    if (score >= 6) return 'hsl(35, 85%, 65%)' // warning
    return 'hsl(0, 75%, 65%)' // danger
  }

  const getSafetyLabel = (score: number) => {
    if (score >= 8) return 'Very Safe'
    if (score >= 6) return 'Safe'
    if (score >= 4) return 'Moderate'
    if (score >= 2) return 'Caution'
    return 'High Risk'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground">Loading demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Interactive Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our comprehensive analysis of {stats?.total_suburbs.toLocaleString() || '1,701'} WA suburbs with real-time data and safety ratings
          </p>
        </header>

        {/* Stats Overview */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-lg border border-border p-6 mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-primary/5 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.total_suburbs.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Suburbs</div>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-xl">
                <div className="text-3xl font-bold text-success mb-2">
                  {stats.mapping_coverage.sa2_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Census Coverage</div>
              </div>
              <div className="text-center p-4 bg-warning/5 rounded-xl">
                <div className="text-3xl font-bold text-warning mb-2">
                  {Object.keys(stats.classifications).length}
                </div>
                <div className="text-sm text-muted-foreground">Area Types</div>
              </div>
              <div className="text-center p-4 bg-danger/5 rounded-xl">
                <div className="text-3xl font-bold text-danger mb-2">
                  {Object.keys(stats.economic_bases).length}
                </div>
                <div className="text-sm text-muted-foreground">Economic Sectors</div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Selector */}
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Choose a Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setSelectedDemo('search')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedDemo === 'search'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-semibold">Search & Discovery</h3>
              <p className="text-sm text-muted-foreground mt-1">Find suburbs by name or criteria</p>
            </button>

            <button
              onClick={() => setSelectedDemo('classification')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedDemo === 'classification'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="font-semibold">Classification Analysis</h3>
              <p className="text-sm text-muted-foreground mt-1">Explore area types and economic data</p>
            </button>

            <button
              onClick={() => setSelectedDemo('crime')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedDemo === 'crime'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="font-semibold">Safety Ratings</h3>
              <p className="text-sm text-muted-foreground mt-1">Multi-factor safety analysis</p>
            </button>
          </div>

          {/* Demo Content */}
          <div className="border-t border-border pt-6">
            {selectedDemo === 'search' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Search Suburbs</h3>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search suburbs (e.g., Perth, Fremantle, Cottesloe)..."
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((suburb) => (
                      <div key={suburb.sal_code} className="p-4 border border-border rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-foreground">{suburb.sal_name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            suburb.classification_type === 'Urban' ? 'bg-primary/10 text-primary' :
                            suburb.classification_type === 'Suburban' ? 'bg-success/10 text-success' :
                            suburb.classification_type === 'Remote' ? 'bg-warning/10 text-warning' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {suburb.classification_type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">
                          {suburb.latitude.toFixed(3)}°, {suburb.longitude.toFixed(3)}°
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {suburb.sa2_mappings.length > 0 ? 'Census data available' : 'Limited data'}
                          </span>
                          <Link
                            href={`/suburbs/${suburb.sal_code}`}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDemo === 'classification' && stats && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Area Classifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Suburb Types</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.classifications).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium">{type}</span>
                          <span className="text-sm text-foreground">{count.toLocaleString()} suburbs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Top Economic Sectors</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.economic_bases)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([sector, count]) => (
                        <div key={sector} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium text-sm">{sector}</span>
                          <span className="text-sm text-foreground">{count} areas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedDemo === 'crime' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Safety Rating System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredSuburbs.map((suburb) => {
                    const rating = safetyRatings[suburb.sal_code]
                    return (
                      <div key={suburb.sal_code} className="p-4 border border-border rounded-xl">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{suburb.sal_name}</h4>
                            <p className="text-sm text-foreground">{suburb.classification_type}</p>
                          </div>
                          {rating && (
                            <div className="text-center">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1"
                                style={{ backgroundColor: getSafetyColor(rating.overallRating) }}
                              >
                                {rating.overallRating.toFixed(1)}
                              </div>
                              <p className="text-xs" style={{ color: getSafetyColor(rating.overallRating) }}>
                                {getSafetyLabel(rating.overallRating)}
                              </p>
                            </div>
                          )}
                        </div>

                        {rating && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center text-xs">
                              <div className="font-semibold text-danger">{rating.components.crimeRating.toFixed(1)}</div>
                              <div className="text-muted-foreground">Crime</div>
                            </div>
                            <div className="text-center text-xs">
                              <div className="font-semibold text-primary">{rating.components.demographicRating.toFixed(1)}</div>
                              <div className="text-muted-foreground">Demographics</div>
                            </div>
                            <div className="text-center text-xs">
                              <div className="font-semibold text-warning">{rating.components.neighborhoodRating.toFixed(1)}</div>
                              <div className="text-muted-foreground">Neighborhood</div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {suburb.sa2_mappings.length > 0 ? 'Full data' : 'Limited data'}
                          </span>
                          <Link
                            href={`/suburbs/${suburb.sal_code}`}
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            Analyze →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-lg border border-border p-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Explore All {stats?.total_suburbs.toLocaleString() || '1,701'} Suburbs?
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Access comprehensive data, safety ratings, and investment analysis for every WA suburb
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/suburbs"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Browse All Suburbs
            </Link>
            <Link
              href="/api/safety?action=stats"
              target="_blank"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              View API Stats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
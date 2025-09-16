'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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

export default function SuburbDetailPage() {
  const params = useParams()
  const suburbId = params.id as string

  const [suburb, setSuburb] = useState<WASuburb | null>(null)
  const [safetyRating, setSafetyRating] = useState<SafetyRating | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSuburbData = async () => {
      if (!suburbId) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch suburb details
        const suburbResponse = await fetch(`/api/suburbs?action=sal&code=${suburbId}`)
        if (!suburbResponse.ok) {
          throw new Error('Failed to fetch suburb data')
        }

        const suburbData = await suburbResponse.json()
        if (suburbData.success && suburbData.data) {
          const suburbInfo = suburbData.data
          setSuburb(suburbInfo)

          // Fetch safety rating
          try {
            const safetyResponse = await fetch(`/api/safety?action=suburb&sal_code=${suburbId}`)
            if (safetyResponse.ok) {
              const safetyData = await safetyResponse.json()
              if (safetyData.success && safetyData.data) {
                setSafetyRating(safetyData.data)
              }
            }
          } catch (safetyError) {
            console.warn('Safety rating not available:', safetyError)
          }
        } else {
          throw new Error('Suburb not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching suburb data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuburbData()
  }, [suburbId])

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
          <p className="text-muted-foreground">Loading suburb details...</p>
        </div>
      </div>
    )
  }

  if (error || !suburb) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-danger/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-danger mb-4">{error || 'Suburb not found'}</p>
          <Link
            href="/suburbs"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all duration-200"
          >
            Back to Suburbs
          </Link>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/suburbs"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            ← Back to Suburbs
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      {suburb.sal_name}
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      {suburb.state}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    suburb.classification_type === 'Urban' ? 'bg-primary/10 text-primary' :
                    suburb.classification_type === 'Suburban' ? 'bg-success/10 text-success' :
                    suburb.classification_type === 'Remote' ? 'bg-warning/10 text-warning' :
                    suburb.classification_type === 'Mining' ? 'bg-danger/10 text-danger' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {suburb.classification_type}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {suburb.latitude.toFixed(3)}°, {suburb.longitude.toFixed(3)}°
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m0 0h3" />
                    </svg>
                    SAL Code: {suburb.sal_code}
                  </div>
                  {suburb.police_district && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {suburb.police_district} District
                    </div>
                  )}
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {suburb.sa2_mappings.length > 0 ? 'Census data available' : 'Limited data'}
                  </div>
                </div>
              </div>

              {safetyRating && (
                <div className="flex flex-col items-center lg:items-end gap-4">
                  <div className="text-center lg:text-right">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Safety Rating</p>
                        <p className="font-semibold" style={{ color: getSafetyColor(safetyRating?.overallRating || 0) }}>
                          {getSafetyLabel(safetyRating?.overallRating || 0)}
                        </p>
                      </div>
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: getSafetyColor(safetyRating?.overallRating || 0) }}
                      >
                        {(safetyRating?.overallRating || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {((safetyRating?.confidence || 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Economic Base */}
            {suburb.economic_base && suburb.economic_base.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Economic Base</h2>
                <div className="flex flex-wrap gap-2">
                  {suburb.economic_base.map((base, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {base}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Analysis */}
            {safetyRating && (
              <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Safety Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-danger/5 rounded-xl">
                    <div className="text-2xl font-bold text-danger mb-1">
                      {safetyRating.components.crimeRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-foreground">Crime Rating</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {safetyRating.components.demographicRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-foreground">Demographics</div>
                  </div>
                  <div className="text-center p-4 bg-warning/5 rounded-xl">
                    <div className="text-2xl font-bold text-warning mb-1">
                      {safetyRating.components.neighborhoodRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-foreground">Neighborhood</div>
                  </div>
                  <div className="text-center p-4 bg-success/5 rounded-xl">
                    <div className="text-2xl font-bold text-success mb-1">
                      {safetyRating.components.trendRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-foreground">Trends</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Overall Safety Rating</span>
                    <span className="text-xl font-bold" style={{ color: getSafetyColor(safetyRating?.overallRating || 0) }}>
                      {(safetyRating?.overallRating || 0).toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Census Data Availability */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Availability</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    <span className="font-medium">Geographic Data</span>
                  </div>
                  <span className="text-success font-semibold">Available</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 mr-3 ${suburb.sa2_mappings.length > 0 ? 'text-success' : 'text-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {suburb.sa2_mappings.length > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                      )}
                    </svg>
                    <span className="font-medium">Census Data ({suburb.sa2_mappings.length} SA2 mappings)</span>
                  </div>
                  <span className={`font-semibold ${suburb.sa2_mappings.length > 0 ? 'text-success' : 'text-warning'}`}>
                    {suburb.sa2_mappings.length > 0 ? 'Available' : 'Limited'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 mr-3 ${safetyRating ? 'text-success' : 'text-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {safetyRating ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                      )}
                    </svg>
                    <span className="font-medium">Safety Rating</span>
                  </div>
                  <span className={`font-semibold ${safetyRating ? 'text-success' : 'text-warning'}`}>
                    {safetyRating ? 'Available' : 'Calculating'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href={`/api/safety?action=suburb&sal_code=${suburb.sal_code}`}
                  target="_blank"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  View Safety Report
                </Link>
                <button
                  onClick={() => navigator.clipboard.writeText(`${suburb.sal_name}, ${suburb.state} (${suburb.sal_code})`)}
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Details
                </button>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Location Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Classification</p>
                  <p className="font-medium text-foreground">{suburb.classification_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordinates</p>
                  <p className="font-medium text-foreground">
                    {suburb.latitude.toFixed(4)}°, {suburb.longitude.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SAL Code</p>
                  <p className="font-medium text-foreground">{suburb.sal_code}</p>
                </div>
                {suburb.police_district && (
                  <div>
                    <p className="text-sm text-muted-foreground">Police District</p>
                    <p className="font-medium text-foreground">{suburb.police_district}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Suburbs */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Explore More</h2>
              <div className="space-y-3">
                <Link
                  href={`/suburbs?classification=${encodeURIComponent(suburb.classification_type)}`}
                  className="block p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  <p className="font-medium text-foreground">Similar {suburb.classification_type} Areas</p>
                  <p className="text-sm text-muted-foreground">Browse other {suburb.classification_type.toLowerCase()} suburbs</p>
                </Link>
                {suburb.economic_base.length > 0 && (
                  <Link
                    href={`/suburbs?search=${encodeURIComponent(suburb.economic_base[0])}`}
                    className="block p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                  >
                    <p className="font-medium text-foreground">{suburb.economic_base[0]} Areas</p>
                    <p className="text-sm text-muted-foreground">Find suburbs with similar economic base</p>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
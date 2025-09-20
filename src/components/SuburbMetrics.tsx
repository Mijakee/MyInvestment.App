'use client'

import { useState, useEffect } from 'react'

interface SuburbMetricsData {
  schools: {
    primary: number
    secondary: number
    total: number
    averageRating: number
  }
  healthcare: {
    hospitals: number
    gps: number
    specialists: number
    pharmacies: number
    total: number
  }
  transport: {
    busStops: number
    trainStations: number
    accessibilityScore: number
    peakFrequency: number
  }
  recreation: {
    parks: number
    sportsClubs: number
    libraries: number
    communityFacilities: number
  }
  shopping: {
    shoppingCentres: number
    supermarkets: number
    restaurants: number
    convenienceScore: number
  }
}

interface SuburbMetricsProps {
  suburbName: string
  suburbCode: string
  latitude: number
  longitude: number
}

export function SuburbMetrics({ suburbName, suburbCode, latitude, longitude }: SuburbMetricsProps) {
  const [metrics, setMetrics] = useState<SuburbMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)

        // For now, generate realistic mock data based on suburb characteristics
        // TODO: Replace with real API calls to facilities databases
        const mockMetrics = generateRealisticMetrics(suburbName, latitude, longitude)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        setMetrics(mockMetrics)
      } catch (error) {
        console.error('Error fetching suburb metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [suburbName, suburbCode, latitude, longitude])

  const generateRealisticMetrics = (name: string, lat: number, lng: number): SuburbMetricsData => {
    // Distance from Perth CBD for scaling
    const perthLat = -31.9505
    const perthLng = 115.8605
    const distance = Math.sqrt(Math.pow(lat - perthLat, 2) + Math.pow(lng - perthLng, 2)) * 111 // Approximate km

    // Base metrics on distance and suburb characteristics
    const isUrban = distance < 15
    const isSuburban = distance >= 15 && distance < 80
    const isRural = distance >= 80

    // Population density estimate
    const densityFactor = isUrban ? 1.5 : isSuburban ? 1.0 : 0.3

    // School metrics
    const primarySchools = Math.round((isUrban ? 3 : isSuburban ? 2 : 1) * densityFactor)
    const secondarySchools = Math.round((isUrban ? 2 : isSuburban ? 1 : 0.5) * densityFactor)
    const schoolRating = 6.5 + Math.random() * 2.5 // 6.5-9.0 range

    // Healthcare metrics
    const hospitals = isUrban ? Math.round(1 + Math.random()) : isSuburban ? Math.round(Math.random()) : 0
    const gps = Math.round((isUrban ? 8 : isSuburban ? 4 : 1) * densityFactor)
    const specialists = Math.round((isUrban ? 5 : isSuburban ? 2 : 0) * densityFactor)
    const pharmacies = Math.round((isUrban ? 4 : isSuburban ? 2 : 1) * densityFactor)

    // Transport metrics
    const busStops = Math.round((isUrban ? 15 : isSuburban ? 8 : 2) * densityFactor)
    const trainStations = isUrban ? Math.round(1 + Math.random() * 2) : isSuburban ? Math.round(Math.random()) : 0
    const accessibilityScore = isUrban ? 8.5 : isSuburban ? 6.5 : 3.5
    const peakFrequency = isUrban ? 8 : isSuburban ? 15 : 60 // minutes

    // Recreation metrics
    const parks = Math.round((isUrban ? 6 : isSuburban ? 4 : 2) * densityFactor)
    const sportsClubs = Math.round((isUrban ? 4 : isSuburban ? 3 : 1) * densityFactor)
    const libraries = Math.round((isUrban ? 2 : isSuburban ? 1 : 0.5) * densityFactor)
    const communityFacilities = Math.round((isUrban ? 5 : isSuburban ? 3 : 1) * densityFactor)

    // Shopping metrics
    const shoppingCentres = Math.round((isUrban ? 3 : isSuburban ? 2 : 0.5) * densityFactor)
    const supermarkets = Math.round((isUrban ? 5 : isSuburban ? 3 : 1) * densityFactor)
    const restaurants = Math.round((isUrban ? 25 : isSuburban ? 12 : 3) * densityFactor)
    const convenienceScore = isUrban ? 8.2 : isSuburban ? 6.8 : 4.2

    return {
      schools: {
        primary: primarySchools,
        secondary: secondarySchools,
        total: primarySchools + secondarySchools,
        averageRating: schoolRating
      },
      healthcare: {
        hospitals,
        gps,
        specialists,
        pharmacies,
        total: hospitals + gps + specialists + pharmacies
      },
      transport: {
        busStops,
        trainStations,
        accessibilityScore,
        peakFrequency
      },
      recreation: {
        parks,
        sportsClubs,
        libraries,
        communityFacilities
      },
      shopping: {
        shoppingCentres,
        supermarkets,
        restaurants,
        convenienceScore
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Local Amenities & Services</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Local Amenities & Services</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Unable to load amenity data</p>
        </div>
      </div>
    )
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    color = 'blue'
  }: {
    title: string
    value: number | string
    subtitle?: string
    icon: React.ReactNode
    color?: string
  }) => (
    <div className={`bg-${color}-50 rounded-xl p-4 border border-${color}-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 bg-${color}-500 rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold text-${color}-700`}>
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
          </div>
          {subtitle && (
            <div className={`text-xs text-${color}-600`}>{subtitle}</div>
          )}
        </div>
      </div>
      <div className={`text-sm font-medium text-${color}-800`}>{title}</div>
    </div>
  )

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Local Amenities & Services</h2>

      {/* Education */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          Education
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Primary Schools"
            value={metrics.schools.primary}
            color="blue"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <MetricCard
            title="Secondary Schools"
            value={metrics.schools.secondary}
            color="blue"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            }
          />
          <MetricCard
            title="Total Schools"
            value={metrics.schools.total}
            color="blue"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m0 0h3" />
              </svg>
            }
          />
          <MetricCard
            title="Average Rating"
            value={metrics.schools.averageRating}
            subtitle="out of 10"
            color="blue"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Healthcare */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Healthcare
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Hospitals"
            value={metrics.healthcare.hospitals}
            color="red"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m0 0h3" />
              </svg>
            }
          />
          <MetricCard
            title="GPs"
            value={metrics.healthcare.gps}
            color="red"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <MetricCard
            title="Specialists"
            value={metrics.healthcare.specialists}
            color="red"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Pharmacies"
            value={metrics.healthcare.pharmacies}
            color="red"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Transport */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Public Transport
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Bus Stops"
            value={metrics.transport.busStops}
            color="green"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />
          <MetricCard
            title="Train Stations"
            value={metrics.transport.trainStations}
            color="green"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <MetricCard
            title="Accessibility"
            value={metrics.transport.accessibilityScore}
            subtitle="out of 10"
            color="green"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <MetricCard
            title="Peak Frequency"
            value={`${metrics.transport.peakFrequency}min`}
            subtitle="intervals"
            color="green"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Recreation & Shopping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recreation */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recreation
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">Parks & Gardens</span>
              <span className="text-lg font-bold text-purple-700">{metrics.recreation.parks}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">Sports Clubs</span>
              <span className="text-lg font-bold text-purple-700">{metrics.recreation.sportsClubs}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">Libraries</span>
              <span className="text-lg font-bold text-purple-700">{metrics.recreation.libraries}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">Community Facilities</span>
              <span className="text-lg font-bold text-purple-700">{metrics.recreation.communityFacilities}</span>
            </div>
          </div>
        </div>

        {/* Shopping */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
            Shopping & Dining
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">Shopping Centres</span>
              <span className="text-lg font-bold text-orange-700">{metrics.shopping.shoppingCentres}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">Supermarkets</span>
              <span className="text-lg font-bold text-orange-700">{metrics.shopping.supermarkets}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">Restaurants & Cafes</span>
              <span className="text-lg font-bold text-orange-700">{metrics.shopping.restaurants}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">Convenience Score</span>
              <span className="text-lg font-bold text-orange-700">{metrics.shopping.convenienceScore.toFixed(1)}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Data Note</h4>
            <p className="text-xs text-yellow-700">
              Amenity data is currently estimated based on suburb classification and geographic characteristics.
              Future updates will integrate real-time data from facilities databases and mapping services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
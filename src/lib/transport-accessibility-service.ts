/**
 * Public Transport Accessibility Service
 * Calculates transport convenience scores for suburbs based on WA public transport data
 */

export interface TransportStop {
  id: string
  name: string
  type: 'bus' | 'train' | 'ferry' | 'tram'
  latitude: number
  longitude: number
  accessibility_features?: {
    wheelchair_accessible: boolean
    audio_announcements: boolean
    tactile_indicators: boolean
    shelter: boolean
    seating: boolean
  }
  routes?: string[]
  frequency_score?: number // Services per hour during peak
}

export interface TransportAccessibilityRating {
  overall_score: number // 1-10 scale
  nearest_stop_distance: number // meters
  stop_density: number // stops per km²
  service_frequency: number // avg services per hour
  accessibility_features: number // 1-10 accessibility score
  transport_types: number // variety bonus (bus, train, etc.)
  coverage_score: number // How well connected the area is
  explanation: string
  confidence: number
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Calculate transport accessibility score for a suburb
 */
export function calculateTransportAccessibility(
  suburbLat: number,
  suburbLng: number,
  nearbyStops: TransportStop[],
  searchRadiusKm: number = 2.0
): TransportAccessibilityRating {

  // Filter stops within search radius
  const stopsInRadius = nearbyStops.filter(stop => {
    const distance = calculateDistance(suburbLat, suburbLng, stop.latitude, stop.longitude)
    return distance <= (searchRadiusKm * 1000)
  })

  if (stopsInRadius.length === 0) {
    return {
      overall_score: 1,
      nearest_stop_distance: Infinity,
      stop_density: 0,
      service_frequency: 0,
      accessibility_features: 0,
      transport_types: 0,
      coverage_score: 0,
      explanation: 'No public transport stops within 2km radius',
      confidence: 0.9
    }
  }

  // 1. Nearest Stop Distance Score (40% weight)
  const distances = stopsInRadius.map(stop =>
    calculateDistance(suburbLat, suburbLng, stop.latitude, stop.longitude)
  )
  const nearestDistance = Math.min(...distances)
  const distanceScore = Math.max(1, 10 - (nearestDistance / 200)) // 200m = excellent, 2000m = poor

  // 2. Stop Density Score (25% weight)
  const areaKm2 = Math.PI * searchRadiusKm * searchRadiusKm
  const density = stopsInRadius.length / areaKm2
  const densityScore = Math.min(10, Math.max(1, density * 2)) // 5 stops/km² = excellent

  // 3. Service Frequency Score (15% weight)
  const avgFrequency = stopsInRadius.reduce((sum, stop) => sum + (stop.frequency_score || 2), 0) / stopsInRadius.length
  const frequencyScore = Math.min(10, Math.max(1, avgFrequency * 2)) // 5 services/hour = excellent

  // 4. Accessibility Features Score (10% weight)
  const accessibilityScores = stopsInRadius.map(stop => {
    if (!stop.accessibility_features) return 5 // Default average
    const features = stop.accessibility_features
    let score = 0
    if (features.wheelchair_accessible) score += 3
    if (features.audio_announcements) score += 2
    if (features.tactile_indicators) score += 2
    if (features.shelter) score += 2
    if (features.seating) score += 1
    return Math.min(10, score)
  })
  const accessibilityScore = accessibilityScores.reduce((sum, score) => sum + score, 0) / accessibilityScores.length

  // 5. Transport Types Variety Score (5% weight)
  const uniqueTypes = new Set(stopsInRadius.map(stop => stop.type))
  const varietyScore = Math.min(10, uniqueTypes.size * 2.5) // 4 types = excellent

  // 6. Coverage Score (5% weight) - How well connected to major destinations
  const trainStops = stopsInRadius.filter(stop => stop.type === 'train').length
  const busRoutes = new Set(stopsInRadius.flatMap(stop => stop.routes || [])).size
  const coverageScore = Math.min(10, (trainStops * 2) + (busRoutes / 5))

  // Weighted final score
  const overallScore = (
    distanceScore * 0.40 +
    densityScore * 0.25 +
    frequencyScore * 0.15 +
    accessibilityScore * 0.10 +
    varietyScore * 0.05 +
    coverageScore * 0.05
  )

  // Generate explanation
  let explanation = ''
  if (overallScore >= 8) {
    explanation = 'Excellent public transport access with frequent services and nearby stops'
  } else if (overallScore >= 6) {
    explanation = 'Good public transport connectivity with reasonable walking distances'
  } else if (overallScore >= 4) {
    explanation = 'Limited public transport options requiring longer walks to stops'
  } else {
    explanation = 'Poor public transport accessibility with infrequent services'
  }

  // Calculate confidence based on data completeness
  const dataCompleteness = stopsInRadius.filter(stop =>
    stop.accessibility_features && stop.frequency_score && stop.routes
  ).length / stopsInRadius.length
  const confidence = Math.max(0.5, 0.7 + (dataCompleteness * 0.3))

  return {
    overall_score: Math.round(overallScore * 10) / 10,
    nearest_stop_distance: nearestDistance,
    stop_density: Math.round(density * 10) / 10,
    service_frequency: Math.round(avgFrequency * 10) / 10,
    accessibility_features: Math.round(accessibilityScore * 10) / 10,
    transport_types: varietyScore,
    coverage_score: Math.round(coverageScore * 10) / 10,
    explanation,
    confidence: Math.round(confidence * 100) / 100
  }
}

/**
 * Load transport stops from WA Data Portal (mock implementation)
 * In production, this would fetch from the actual WA transport datasets
 */
export async function loadTransportStopsForArea(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5.0
): Promise<TransportStop[]> {
  // TODO: Implement actual data loading from:
  // - catalogue.data.wa.gov.au/dataset/public-transport-authority-stops-bus-stops
  // - transperth.wa.gov.au GTFS data

  // Mock realistic data for development
  return generateMockTransportStops(centerLat, centerLng, radiusKm)
}

/**
 * Generate realistic mock transport data for testing
 */
function generateMockTransportStops(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): TransportStop[] {
  const stops: TransportStop[] = []

  // Density varies by area type (urban vs suburban vs rural)
  const distanceFromPerth = calculateDistance(centerLat, centerLng, -31.9505, 115.8605) / 1000

  let stopDensity: number
  let trainLikelihood: number

  if (distanceFromPerth <= 10) {
    // Urban - high density
    stopDensity = 8 + Math.random() * 12 // 8-20 stops
    trainLikelihood = 0.3
  } else if (distanceFromPerth <= 80) {
    // Suburban - medium density
    stopDensity = 3 + Math.random() * 8 // 3-11 stops
    trainLikelihood = 0.15
  } else {
    // Rural - low density
    stopDensity = 0 + Math.random() * 3 // 0-3 stops
    trainLikelihood = 0.05
  }

  for (let i = 0; i < stopDensity; i++) {
    // Random location within radius
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * radiusKm * 1000
    const lat = centerLat + (distance * Math.cos(angle)) / 111000
    const lng = centerLng + (distance * Math.sin(angle)) / (111000 * Math.cos(centerLat * Math.PI / 180))

    const isTrainStop = Math.random() < trainLikelihood
    const isFerryStop = distanceFromPerth <= 20 && Math.random() < 0.05 // Only near Perth/Fremantle

    stops.push({
      id: `stop_${i}`,
      name: `${isTrainStop ? 'Train' : isFerryStop ? 'Ferry' : 'Bus'} Stop ${i + 1}`,
      type: isTrainStop ? 'train' : isFerryStop ? 'ferry' : 'bus',
      latitude: lat,
      longitude: lng,
      accessibility_features: {
        wheelchair_accessible: Math.random() > 0.3,
        audio_announcements: Math.random() > 0.4,
        tactile_indicators: Math.random() > 0.5,
        shelter: Math.random() > 0.4,
        seating: Math.random() > 0.3
      },
      routes: [`Route ${Math.floor(Math.random() * 100) + 1}`],
      frequency_score: isTrainStop ? 4 + Math.random() * 4 : 1 + Math.random() * 4
    })
  }

  return stops
}

/**
 * Classify transport accessibility level
 */
export function getAccessibilityLevel(score: number): {
  level: string,
  color: string,
  description: string
} {
  if (score >= 8) {
    return {
      level: 'Excellent',
      color: 'green',
      description: 'Outstanding public transport access with frequent, diverse services'
    }
  } else if (score >= 6) {
    return {
      level: 'Good',
      color: 'blue',
      description: 'Solid public transport connectivity with reasonable access'
    }
  } else if (score >= 4) {
    return {
      level: 'Fair',
      color: 'yellow',
      description: 'Limited public transport requiring longer walks or planning'
    }
  } else if (score >= 2) {
    return {
      level: 'Poor',
      color: 'orange',
      description: 'Minimal public transport access with infrequent services'
    }
  } else {
    return {
      level: 'Very Poor',
      color: 'red',
      description: 'Very limited or no public transport access'
    }
  }
}
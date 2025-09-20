/**
 * WA PTA Transport Service
 * Integrates with official Public Transport Authority APIs to get real transport data
 * Uses ArcGIS REST services from SLIP (Shared Land Information Platform)
 */

export interface WAPTAStop {
  stopid: number
  stopname: string
  stopnumber: number
  suburb: string
  accessible: string // Y/N
  status: string
  latitude: number
  longitude: number
  distance?: number // Distance from query point in meters
}

export interface WAPTARoute {
  routeid: string
  routename: string
  routenumber: string
  routetype: string // 'Bus', 'Train', 'Ferry'
  operator: string
  status: string
}

export interface TransportAccessibilityResult {
  stopsWithin2km: WAPTAStop[]
  stopsWithin5km: WAPTAStop[]
  nearestStop: WAPTAStop | null
  accessibilityScore: number // 1-10 scale
  serviceTypes: string[] // ['Bus', 'Train', 'Ferry']
  accessibilityFeatures: number // Count of accessible stops
  serviceFrequency: number // Estimated based on stop density
  confidence: number // 0-1 scale
}

class WAPTATransportService {
  private readonly PTA_STOPS_API = 'https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Transport/MapServer/14'
  private readonly PTA_ROUTES_API = 'https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Transport/MapServer/15'

  /**
   * Calculate transport accessibility for given coordinates
   */
  async calculateTransportAccessibility(
    latitude: number,
    longitude: number,
    searchRadius: number = 5.0 // km
  ): Promise<TransportAccessibilityResult> {
    try {
      console.log(`Fetching transport stops within ${searchRadius}km of ${latitude}, ${longitude}`)

      const stops = await this.getStopsNearLocation(latitude, longitude, searchRadius)

      if (stops.length === 0) {
        return this.createEmptyResult()
      }

      const stopsWithin2km = stops.filter(stop => stop.distance! <= 2000)
      const stopsWithin5km = stops.filter(stop => stop.distance! <= 5000)
      const nearestStop = stops.length > 0 ? stops[0] : null

      // Calculate accessibility score based on multiple factors
      const accessibilityScore = this.calculateAccessibilityScore(stopsWithin2km, stopsWithin5km)

      // Extract service types from stop names/routes
      const serviceTypes = this.extractServiceTypes(stops)

      // Count accessible stops
      const accessibilityFeatures = stops.filter(stop =>
        stop.accessible?.toUpperCase() === 'Y'
      ).length

      // Estimate service frequency based on stop density
      const serviceFrequency = this.estimateServiceFrequency(stopsWithin2km.length)

      return {
        stopsWithin2km,
        stopsWithin5km,
        nearestStop,
        accessibilityScore,
        serviceTypes,
        accessibilityFeatures,
        serviceFrequency,
        confidence: stops.length > 0 ? 0.9 : 0.1
      }
    } catch (error) {
      console.error('Error calculating transport accessibility:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Get transport stops near a location using ArcGIS spatial query
   */
  private async getStopsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<WAPTAStop[]> {
    try {
      // Convert radius to meters for spatial query
      const radiusMeters = radiusKm * 1000

      // Build spatial query for ArcGIS REST API using buffer approach
      const queryParams = new URLSearchParams({
        f: 'json',
        where: '1=1',
        outFields: 'stopid,stopname,stopnumber,suburb,accessible,status,weekpam,weekppm,stoptype',
        returnGeometry: 'true',
        spatialRel: 'esriSpatialRelIntersects',
        geometry: JSON.stringify({
          xmin: longitude - (radiusKm * 0.009), // Approximate degree conversion
          ymin: latitude - (radiusKm * 0.009),
          xmax: longitude + (radiusKm * 0.009),
          ymax: latitude + (radiusKm * 0.009),
          spatialReference: { wkid: 4326 }
        }),
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        resultRecordCount: '50' // Limit results for performance
      })

      const url = `${this.PTA_STOPS_API}/query?${queryParams}`
      console.log('Fetching PTA stops from:', url.substring(0, 100) + '...')

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        console.log('No transport stops found in specified radius')
        return []
      }

      console.log(`Found ${data.features.length} transport stops`)

      // Parse and enhance stop data
      const stops: WAPTAStop[] = data.features.map((feature: any) => {
        const attrs = feature.attributes
        const geom = feature.geometry

        const stop: WAPTAStop = {
          stopid: attrs.stopid || 0,
          stopname: attrs.stopname || 'Unknown Stop',
          stopnumber: attrs.stopnumber || 0,
          suburb: attrs.suburb || '',
          accessible: attrs.accessible || 'N',
          status: attrs.status || 'Active',
          latitude: geom.y,
          longitude: geom.x
        }

        // Calculate distance from query point
        stop.distance = this.calculateDistance(
          latitude, longitude,
          stop.latitude, stop.longitude
        ) * 1000 // Convert to meters

        return stop
      })

      // Sort by distance
      return stops.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    } catch (error) {
      console.error('Error fetching PTA stops:', error)
      return []
    }
  }

  /**
   * Calculate accessibility score based on stop availability
   */
  private calculateAccessibilityScore(
    stopsWithin2km: WAPTAStop[],
    stopsWithin5km: WAPTAStop[]
  ): number {
    let score = 1.0 // Base score

    // Heavy weight for stops within walking distance (2km)
    if (stopsWithin2km.length >= 5) {
      score += 4.0 // Excellent accessibility
    } else if (stopsWithin2km.length >= 3) {
      score += 3.0 // Good accessibility
    } else if (stopsWithin2km.length >= 1) {
      score += 2.0 // Basic accessibility
    }

    // Additional points for broader area coverage (2-5km)
    const stopsIn2to5km = stopsWithin5km.length - stopsWithin2km.length
    if (stopsIn2to5km >= 10) {
      score += 2.5
    } else if (stopsIn2to5km >= 5) {
      score += 1.5
    } else if (stopsIn2to5km >= 1) {
      score += 0.5
    }

    // Bonus for accessible stops
    const accessibleStops = stopsWithin5km.filter(s => s.accessible === 'Y').length
    if (accessibleStops > 0) {
      score += Math.min(1.0, accessibleStops * 0.2)
    }

    return Math.max(1, Math.min(10, score))
  }

  /**
   * Extract service types from stop data
   */
  private extractServiceTypes(stops: WAPTAStop[]): string[] {
    const types = new Set<string>()

    stops.forEach(stop => {
      const name = stop.stopname.toLowerCase()
      if (name.includes('station') || name.includes('rail')) {
        types.add('Train')
      } else if (name.includes('ferry') || name.includes('jetty')) {
        types.add('Ferry')
      } else {
        types.add('Bus') // Default assumption for most stops
      }
    })

    return Array.from(types).sort()
  }

  /**
   * Estimate service frequency based on stop density
   */
  private estimateServiceFrequency(stopCount: number): number {
    if (stopCount >= 10) return 8 // High frequency
    if (stopCount >= 5) return 6   // Good frequency
    if (stopCount >= 2) return 4   // Moderate frequency
    if (stopCount >= 1) return 2   // Low frequency
    return 0 // No service
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Create empty result for areas with no transport access
   */
  private createEmptyResult(): TransportAccessibilityResult {
    return {
      stopsWithin2km: [],
      stopsWithin5km: [],
      nearestStop: null,
      accessibilityScore: 1.0,
      serviceTypes: [],
      accessibilityFeatures: 0,
      serviceFrequency: 0,
      confidence: 0.9 // High confidence in "no service" result
    }
  }

  /**
   * Test the transport service with multiple locations
   */
  async testTransportService(): Promise<{
    results: Array<{
      location: string
      coordinates: [number, number]
      result: TransportAccessibilityResult
    }>
  }> {
    const testLocations = [
      { name: 'Perth CBD', coords: [-31.9505, 115.8605] as [number, number] },
      { name: 'Fremantle', coords: [-32.0569, 115.7441] as [number, number] },
      { name: 'Joondalup', coords: [-31.7448, 115.7661] as [number, number] },
      { name: 'Rockingham', coords: [-32.2767, 115.7297] as [number, number] },
      { name: 'Midland', coords: [-31.8946, 116.0118] as [number, number] }
    ]

    const results = []
    for (const location of testLocations) {
      console.log(`\nTesting transport accessibility: ${location.name}`)
      const result = await this.calculateTransportAccessibility(
        location.coords[0],
        location.coords[1],
        5.0
      )

      results.push({
        location: location.name,
        coordinates: location.coords,
        result
      })
    }

    return { results }
  }
}

// Export singleton instance
export const waptaTransportService = new WAPTATransportService()
export default waptaTransportService
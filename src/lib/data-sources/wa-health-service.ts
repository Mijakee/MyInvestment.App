/**
 * WA Health Service
 * Integrates with official WA Health API to get real medical facility data
 * Uses SLIP (Shared Land Information Platform) services for hospital and health facility locations
 */

export interface WAHealthFacility {
  id: string
  name: string
  type: 'hospital' | 'nursing_post' | 'gp_clinic' | 'pharmacy' | 'medical_centre'
  category: 'public' | 'private' | 'community'
  latitude: number
  longitude: number
  address?: string
  suburb?: string
  postcode?: string
  distance?: number // Distance from query point in meters
  services?: string[] // Available medical services
}

export interface HealthAccessibilityResult {
  facilitiesWithin5km: WAHealthFacility[]
  facilitiesWithin10km: WAHealthFacility[]
  nearestHospital: WAHealthFacility | null
  nearestGP: WAHealthFacility | null
  healthScore: number // 1-10 scale (lower = better access)
  facilityTypes: string[] // ['hospital', 'gp_clinic', etc.]
  facilityCount: number
  confidence: number // 0-1 scale
}

class WAHealthService {
  private readonly WA_HEALTH_API = 'https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Health/MapServer/1'
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search' // For additional medical facilities
  private cache = new Map<string, HealthAccessibilityResult>()

  /**
   * Calculate health facility accessibility for given coordinates
   */
  async calculateHealthAccessibility(
    latitude: number,
    longitude: number,
    searchRadius: number = 10.0 // km
  ): Promise<HealthAccessibilityResult> {
    try {
      console.log(`Fetching health facilities within ${searchRadius}km of ${latitude}, ${longitude}`)

      // Get official WA Health hospitals and nursing posts
      const waHealthFacilities = await this.getWAHealthFacilities(latitude, longitude, searchRadius)

      // Get additional medical facilities from OpenStreetMap
      const additionalFacilities = await this.getAdditionalMedicalFacilities(latitude, longitude, searchRadius)

      // Combine and deduplicate facilities
      const allFacilities = this.combineAndDeduplicate([...waHealthFacilities, ...additionalFacilities])

      if (allFacilities.length === 0) {
        return this.createEmptyResult()
      }

      const facilitiesWithin5km = allFacilities.filter(facility => facility.distance! <= 5000)
      const facilitiesWithin10km = allFacilities.filter(facility => facility.distance! <= 10000)

      const nearestHospital = allFacilities.find(f => f.type === 'hospital') || null
      const nearestGP = allFacilities.find(f => f.type === 'gp_clinic' || f.type === 'medical_centre') || null

      // Calculate health score based on multiple factors
      const healthScore = this.calculateHealthScore(facilitiesWithin5km, facilitiesWithin10km, nearestHospital, nearestGP)

      // Extract facility types
      const facilityTypes = [...new Set(allFacilities.map(facility => facility.type))].sort()

      return {
        facilitiesWithin5km,
        facilitiesWithin10km,
        nearestHospital,
        nearestGP,
        healthScore,
        facilityTypes,
        facilityCount: allFacilities.length,
        confidence: allFacilities.length > 0 ? 0.9 : 0.1
      }
    } catch (error) {
      console.error('Error calculating health accessibility:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Get WA Health facilities using official SLIP API
   */
  private async getWAHealthFacilities(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<WAHealthFacility[]> {
    try {
      // Build spatial query for ArcGIS REST API
      const queryParams = new URLSearchParams({
        f: 'json',
        where: '1=1',
        outFields: '*', // Get all available fields
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

      const url = `${this.WA_HEALTH_API}/query?${queryParams}`
      console.log('Fetching WA Health facilities from:', url.substring(0, 120) + '...')

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`WA Health API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        console.log('No WA Health facilities found in specified radius')
        return []
      }

      console.log(`Found ${data.features.length} WA Health facilities`)

      // Parse and enhance facility data
      const facilities: WAHealthFacility[] = data.features.map((feature: any) => {
        const attrs = feature.attributes
        const geom = feature.geometry

        const facility: WAHealthFacility = {
          id: `wa_health_${attrs.OBJECTID || Math.random()}`,
          name: attrs.FACILITY_NAME || attrs.NAME || 'Unknown Health Facility',
          type: this.determineHealthFacilityType(attrs.FACILITY_NAME || attrs.NAME || ''),
          category: this.determineHealthCategory(attrs.FACILITY_TYPE || attrs.TYPE || ''),
          latitude: geom.y,
          longitude: geom.x,
          address: attrs.ADDRESS || '',
          suburb: attrs.SUBURB || '',
          postcode: attrs.POSTCODE || ''
        }

        // Calculate distance from query point
        facility.distance = this.calculateDistance(
          latitude, longitude,
          facility.latitude, facility.longitude
        ) * 1000 // Convert to meters

        return facility
      }).filter(facility => facility.distance! <= (radiusKm * 1000)) // Filter by actual distance

      // Sort by distance
      return facilities.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    } catch (error) {
      console.error('Error fetching WA Health facilities:', error)
      return []
    }
  }

  /**
   * Get additional medical facilities from OpenStreetMap
   */
  private async getAdditionalMedicalFacilities(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<WAHealthFacility[]> {
    try {
      const facilities: WAHealthFacility[] = []

      // Search for different types of medical facilities
      const facilityQueries = [
        { type: 'gp_clinic', query: 'amenity=doctors OR amenity=clinic' },
        { type: 'pharmacy', query: 'amenity=pharmacy' },
        { type: 'medical_centre', query: 'amenity=hospital OR healthcare=centre' }
      ]

      for (const facilityType of facilityQueries) {
        try {
          const results = await this.searchNominatimMedical(
            latitude,
            longitude,
            radiusKm,
            facilityType.query,
            facilityType.type as WAHealthFacility['type']
          )
          facilities.push(...results)

          // Add delay to respect Nominatim rate limits
          await new Promise(resolve => setTimeout(resolve, 1100))
        } catch (error) {
          console.warn(`Error searching for ${facilityType.type}:`, error)
        }
      }

      return facilities

    } catch (error) {
      console.error('Error fetching additional medical facilities:', error)
      return []
    }
  }

  /**
   * Search Nominatim API for medical facilities
   */
  private async searchNominatimMedical(
    latitude: number,
    longitude: number,
    radiusKm: number,
    query: string,
    facilityType: WAHealthFacility['type']
  ): Promise<WAHealthFacility[]> {
    try {
      const latDelta = radiusKm / 111.0
      const lngDelta = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180))

      const params = new URLSearchParams({
        format: 'json',
        limit: '20',
        addressdetails: '1',
        viewbox: `${longitude - lngDelta},${latitude + latDelta},${longitude + lngDelta},${latitude - latDelta}`,
        bounded: '1',
        q: query
      })

      const url = `${this.NOMINATIM_API}?${params}`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MyInvestmentApp/1.0 (contact@example.com)'
        }
      })

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        return []
      }

      console.log(`Found ${data.length} ${facilityType} facilities via OpenStreetMap`)

      return data.map((item: any) => {
        const facility: WAHealthFacility = {
          id: `osm_${item.place_id}`,
          name: item.display_name.split(',')[0] || `${facilityType} facility`,
          type: facilityType,
          category: 'community',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: item.display_name,
          distance: this.calculateDistance(
            latitude, longitude,
            parseFloat(item.lat), parseFloat(item.lon)
          ) * 1000
        }

        return facility
      }).filter(facility => facility.distance! <= (radiusKm * 1000))

    } catch (error) {
      console.error(`Error searching Nominatim for ${facilityType}:`, error)
      return []
    }
  }

  /**
   * Determine health facility type from name
   */
  private determineHealthFacilityType(name: string): WAHealthFacility['type'] {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('hospital') || lowerName.includes('emergency')) {
      return 'hospital'
    } else if (lowerName.includes('nursing') || lowerName.includes('post')) {
      return 'nursing_post'
    } else if (lowerName.includes('pharmacy') || lowerName.includes('chemist')) {
      return 'pharmacy'
    } else if (lowerName.includes('medical') || lowerName.includes('clinic')) {
      return 'medical_centre'
    } else if (lowerName.includes('doctor') || lowerName.includes('gp')) {
      return 'gp_clinic'
    }

    return 'medical_centre' // Default
  }

  /**
   * Determine health category from type
   */
  private determineHealthCategory(type: string): WAHealthFacility['category'] {
    const lowerType = type.toLowerCase()

    if (lowerType.includes('public') || lowerType.includes('government')) {
      return 'public'
    } else if (lowerType.includes('private')) {
      return 'private'
    }

    return 'community' // Default
  }

  /**
   * Combine and remove duplicate facilities
   */
  private combineAndDeduplicate(facilities: WAHealthFacility[]): WAHealthFacility[] {
    const unique: WAHealthFacility[] = []

    for (const facility of facilities) {
      const isDuplicate = unique.some(existing =>
        existing.name.toLowerCase() === facility.name.toLowerCase() ||
        this.calculateDistance(
          existing.latitude, existing.longitude,
          facility.latitude, facility.longitude
        ) < 0.1 // Less than 100m apart
      )

      if (!isDuplicate) {
        unique.push(facility)
      }
    }

    return unique.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  /**
   * Calculate health accessibility score
   */
  private calculateHealthScore(
    facilitiesWithin5km: WAHealthFacility[],
    facilitiesWithin10km: WAHealthFacility[],
    nearestHospital: WAHealthFacility | null,
    nearestGP: WAHealthFacility | null
  ): number {
    let score = 10.0 // Start with worst score (high = poor access)

    // Heavy weight for nearby hospitals
    if (nearestHospital) {
      const hospitalDistance = nearestHospital.distance! / 1000 // Convert to km
      if (hospitalDistance <= 5) {
        score -= 3.0 // Excellent hospital access
      } else if (hospitalDistance <= 10) {
        score -= 2.0 // Good hospital access
      } else if (hospitalDistance <= 20) {
        score -= 1.0 // Moderate hospital access
      }
    }

    // Weight for nearby GP/medical centres
    if (nearestGP) {
      const gpDistance = nearestGP.distance! / 1000
      if (gpDistance <= 2) {
        score -= 2.0 // Excellent GP access
      } else if (gpDistance <= 5) {
        score -= 1.5 // Good GP access
      } else if (gpDistance <= 10) {
        score -= 1.0 // Moderate GP access
      }
    }

    // Bonus for medical facility density
    if (facilitiesWithin5km.length >= 5) {
      score -= 1.5 // Excellent medical density
    } else if (facilitiesWithin5km.length >= 3) {
      score -= 1.0 // Good medical density
    } else if (facilitiesWithin5km.length >= 1) {
      score -= 0.5 // Basic medical access
    }

    // Bonus for facility diversity
    const uniqueTypes = new Set(facilitiesWithin10km.map(f => f.type))
    if (uniqueTypes.size >= 4) {
      score -= 1.0 // Excellent diversity
    } else if (uniqueTypes.size >= 3) {
      score -= 0.5 // Good diversity
    }

    // Bonus for pharmacies (essential medical access)
    const pharmacies = facilitiesWithin5km.filter(f => f.type === 'pharmacy').length
    if (pharmacies >= 2) {
      score -= 0.5
    } else if (pharmacies >= 1) {
      score -= 0.25
    }

    return Math.max(1, Math.min(10, score))
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
   * Create empty result for areas with no health access
   */
  private createEmptyResult(): HealthAccessibilityResult {
    return {
      facilitiesWithin5km: [],
      facilitiesWithin10km: [],
      nearestHospital: null,
      nearestGP: null,
      healthScore: 10.0, // High score = poor health access
      facilityTypes: [],
      facilityCount: 0,
      confidence: 0.9 // High confidence in "no facilities" result
    }
  }

  /**
   * Test the health service with multiple locations
   */
  async testHealthService(): Promise<{
    results: Array<{
      location: string
      coordinates: [number, number]
      result: HealthAccessibilityResult
    }>
  }> {
    const testLocations = [
      { name: 'Perth CBD', coords: [-31.9505, 115.8605] as [number, number] },
      { name: 'Fremantle Hospital Area', coords: [-32.0569, 115.7441] as [number, number] },
      { name: 'Joondalup Health Campus', coords: [-31.7448, 115.7661] as [number, number] }
    ]

    const results = []
    for (const location of testLocations) {
      console.log(`\nTesting health accessibility: ${location.name}`)
      const result = await this.calculateHealthAccessibility(
        location.coords[0],
        location.coords[1],
        10.0
      )

      results.push({
        location: location.name,
        coordinates: location.coords,
        result
      })

      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return { results }
  }
}

// Export singleton instance
export const waHealthService = new WAHealthService()
export default waHealthService
/**
 * WA Recreation Service
 * Integrates with OpenStreetMap Nominatim API to get real recreation facility data
 * Provides recreation convenience scoring based on actual facility locations
 */

export interface RecreationFacility {
  id: string
  name: string
  type: 'park' | 'sports_facility' | 'gym' | 'library' | 'cinema' | 'beach' | 'playground' | 'community_centre'
  latitude: number
  longitude: number
  distance?: number // Distance from query point in meters
  address?: string
  opening_hours?: string
}

export interface RecreationAccessibilityResult {
  facilitiesWithin2km: RecreationFacility[]
  facilitiesWithin5km: RecreationFacility[]
  nearestFacility: RecreationFacility | null
  recreationScore: number // 1-10 scale (lower = better access)
  facilityTypes: string[] // ['park', 'sports_facility', etc.]
  facilityCount: number
  confidence: number // 0-1 scale
}

class WARecreationService {
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search'
  private cache = new Map<string, RecreationAccessibilityResult>()

  /**
   * Calculate recreation accessibility for given coordinates
   */
  async calculateRecreationAccessibility(
    latitude: number,
    longitude: number,
    searchRadius: number = 5.0 // km
  ): Promise<RecreationAccessibilityResult> {
    try {
      console.log(`Fetching recreation facilities within ${searchRadius}km of ${latitude}, ${longitude}`)

      const facilities = await this.getRecreationFacilitiesNearLocation(latitude, longitude, searchRadius)

      if (facilities.length === 0) {
        return this.createEmptyResult()
      }

      const facilitiesWithin2km = facilities.filter(facility => facility.distance! <= 2000)
      const facilitiesWithin5km = facilities.filter(facility => facility.distance! <= 5000)
      const nearestFacility = facilities.length > 0 ? facilities[0] : null

      // Calculate recreation score based on multiple factors
      const recreationScore = this.calculateRecreationScore(facilitiesWithin2km, facilitiesWithin5km)

      // Extract facility types
      const facilityTypes = [...new Set(facilities.map(facility => facility.type))].sort()

      return {
        facilitiesWithin2km,
        facilitiesWithin5km,
        nearestFacility,
        recreationScore,
        facilityTypes,
        facilityCount: facilities.length,
        confidence: facilities.length > 0 ? 0.9 : 0.1
      }
    } catch (error) {
      console.error('Error calculating recreation accessibility:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Get recreation facilities near a location using OpenStreetMap Nominatim API
   */
  private async getRecreationFacilitiesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<RecreationFacility[]> {
    try {
      const facilities: RecreationFacility[] = []

      // Search for different types of recreation facilities
      const facilityQueries = [
        { type: 'park', query: 'leisure=park OR natural=beach' },
        { type: 'sports_facility', query: 'leisure=sports_centre OR leisure=fitness_centre OR leisure=swimming_pool' },
        { type: 'gym', query: 'leisure=fitness_centre' },
        { type: 'library', query: 'amenity=library' },
        { type: 'cinema', query: 'amenity=cinema' },
        { type: 'playground', query: 'leisure=playground' },
        { type: 'community_centre', query: 'amenity=community_centre' }
      ]

      for (const facilityType of facilityQueries) {
        try {
          const results = await this.searchNominatim(
            latitude,
            longitude,
            radiusKm,
            facilityType.query,
            facilityType.type as RecreationFacility['type']
          )
          facilities.push(...results)

          // Add delay to respect Nominatim rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1100))
        } catch (error) {
          console.warn(`Error searching for ${facilityType.type}:`, error)
        }
      }

      // Remove duplicates and sort by distance
      const uniqueFacilities = this.removeDuplicateFacilities(facilities)
      return uniqueFacilities.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    } catch (error) {
      console.error('Error fetching recreation facilities:', error)
      return []
    }
  }

  /**
   * Search Nominatim API for specific facility types
   */
  private async searchNominatim(
    latitude: number,
    longitude: number,
    radiusKm: number,
    query: string,
    facilityType: RecreationFacility['type']
  ): Promise<RecreationFacility[]> {
    try {
      // Calculate bounding box for search area
      const latDelta = radiusKm / 111.0 // Approximate degrees per km
      const lngDelta = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180))

      const params = new URLSearchParams({
        format: 'json',
        limit: '20', // Reduced limit to avoid overwhelming API
        addressdetails: '1',
        extratags: '1',
        viewbox: `${longitude - lngDelta},${latitude + latDelta},${longitude + lngDelta},${latitude - latDelta}`,
        bounded: '1',
        q: query
      })

      const url = `${this.NOMINATIM_API}?${params}`
      console.log(`Searching Nominatim for ${facilityType}:`, url.substring(0, 100) + '...')

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MyInvestmentApp/1.0 (contact@example.com)' // Required by Nominatim
        }
      })

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.log(`No ${facilityType} facilities found`)
        return []
      }

      console.log(`Found ${data.length} ${facilityType} facilities`)

      // Convert to our RecreationFacility format
      const facilities: RecreationFacility[] = data.map((item: any) => {
        const facility: RecreationFacility = {
          id: item.place_id?.toString() || `${facilityType}_${Math.random()}`,
          name: item.display_name.split(',')[0] || `${facilityType} facility`,
          type: facilityType,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: item.display_name
        }

        // Calculate distance from query point
        facility.distance = this.calculateDistance(
          latitude, longitude,
          facility.latitude, facility.longitude
        ) * 1000 // Convert to meters

        return facility
      }).filter(facility => facility.distance! <= (radiusKm * 1000)) // Filter by actual distance

      return facilities

    } catch (error) {
      console.error(`Error searching Nominatim for ${facilityType}:`, error)
      return []
    }
  }

  /**
   * Remove duplicate facilities based on name and proximity
   */
  private removeDuplicateFacilities(facilities: RecreationFacility[]): RecreationFacility[] {
    const unique: RecreationFacility[] = []

    for (const facility of facilities) {
      const isDuplicate = unique.some(existing =>
        existing.name === facility.name ||
        this.calculateDistance(
          existing.latitude, existing.longitude,
          facility.latitude, facility.longitude
        ) < 0.1 // Less than 100m apart
      )

      if (!isDuplicate) {
        unique.push(facility)
      }
    }

    return unique
  }

  /**
   * Calculate recreation score based on facility availability and diversity
   */
  private calculateRecreationScore(
    facilitiesWithin2km: RecreationFacility[],
    facilitiesWithin5km: RecreationFacility[]
  ): number {
    let score = 10.0 // Start with worst score (high = poor access)

    // Heavy weight for facilities within walking distance (2km)
    if (facilitiesWithin2km.length >= 8) {
      score -= 4.0 // Excellent recreation access
    } else if (facilitiesWithin2km.length >= 5) {
      score -= 3.0 // Good recreation access
    } else if (facilitiesWithin2km.length >= 2) {
      score -= 2.0 // Basic recreation access
    } else if (facilitiesWithin2km.length >= 1) {
      score -= 1.0 // Minimal access
    }

    // Additional points for broader area coverage (2-5km)
    const facilitiesIn2to5km = facilitiesWithin5km.length - facilitiesWithin2km.length
    if (facilitiesIn2to5km >= 15) {
      score -= 2.5
    } else if (facilitiesIn2to5km >= 8) {
      score -= 1.5
    } else if (facilitiesIn2to5km >= 3) {
      score -= 0.5
    }

    // Bonus for recreation diversity
    const uniqueTypes = new Set(facilitiesWithin5km.map(f => f.type))
    if (uniqueTypes.size >= 5) {
      score -= 1.5 // Excellent diversity
    } else if (uniqueTypes.size >= 3) {
      score -= 1.0 // Good diversity
    } else if (uniqueTypes.size >= 2) {
      score -= 0.5 // Basic diversity
    }

    // Bonus for specific high-value facilities
    const parks = facilitiesWithin5km.filter(f => f.type === 'park').length
    const sportsFacilities = facilitiesWithin5km.filter(f => f.type === 'sports_facility').length

    if (parks >= 3) score -= 0.5 // Good park access
    if (sportsFacilities >= 2) score -= 0.5 // Good sports access

    // Coastal bonus - check if near WA coast (longitude < 116.0)
    const isCoastal = facilitiesWithin5km.some(f => f.longitude < 116.0)
    if (isCoastal) score -= 0.5 // Coastal recreation bonus

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
   * Create empty result for areas with no recreation access
   */
  private createEmptyResult(): RecreationAccessibilityResult {
    return {
      facilitiesWithin2km: [],
      facilitiesWithin5km: [],
      nearestFacility: null,
      recreationScore: 10.0, // High score = poor recreation access
      facilityTypes: [],
      facilityCount: 0,
      confidence: 0.9 // High confidence in "no facilities" result
    }
  }

  /**
   * Test the recreation service with multiple locations
   */
  async testRecreationService(): Promise<{
    results: Array<{
      location: string
      coordinates: [number, number]
      result: RecreationAccessibilityResult
    }>
  }> {
    const testLocations = [
      { name: 'Perth CBD', coords: [-31.9505, 115.8605] as [number, number] },
      { name: 'Cottesloe Beach', coords: [-31.9959, 115.7581] as [number, number] },
      { name: 'Kings Park', coords: [-31.9614, 115.8337] as [number, number] }
    ]

    const results = []
    for (const location of testLocations) {
      console.log(`\nTesting recreation accessibility: ${location.name}`)
      const result = await this.calculateRecreationAccessibility(
        location.coords[0],
        location.coords[1],
        3.0 // Smaller radius for testing
      )

      results.push({
        location: location.name,
        coordinates: location.coords,
        result
      })

      // Add delay to respect Nominatim rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return { results }
  }
}

// Export singleton instance
export const waRecreationService = new WARecreationService()
export default waRecreationService
/**
 * WA Shopping Service
 * Integrates with OpenStreetMap Nominatim API to get real shopping center and retail data
 * Provides shopping convenience scoring based on actual retail locations
 */

export interface ShoppingFacility {
  id: string
  name: string
  type: 'shopping_centre' | 'supermarket' | 'pharmacy' | 'bank' | 'post_office' | 'retail'
  latitude: number
  longitude: number
  distance?: number // Distance from query point in meters
  address?: string
  opening_hours?: string
}

export interface ShoppingAccessibilityResult {
  facilitiesWithin2km: ShoppingFacility[]
  facilitiesWithin5km: ShoppingFacility[]
  nearestFacility: ShoppingFacility | null
  shoppingScore: number // 1-10 scale (lower = better access)
  facilityTypes: string[] // ['shopping_centre', 'supermarket', etc.]
  facilityCount: number
  confidence: number // 0-1 scale
}

class WAShoppingService {
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search'
  private cache = new Map<string, ShoppingAccessibilityResult>()

  /**
   * Calculate shopping accessibility for given coordinates
   */
  async calculateShoppingAccessibility(
    latitude: number,
    longitude: number,
    searchRadius: number = 5.0 // km
  ): Promise<ShoppingAccessibilityResult> {
    try {
      console.log(`Fetching shopping facilities within ${searchRadius}km of ${latitude}, ${longitude}`)

      const facilities = await this.getShoppingFacilitiesNearLocation(latitude, longitude, searchRadius)

      if (facilities.length === 0) {
        return this.createEmptyResult()
      }

      const facilitiesWithin2km = facilities.filter(facility => facility.distance! <= 2000)
      const facilitiesWithin5km = facilities.filter(facility => facility.distance! <= 5000)
      const nearestFacility = facilities.length > 0 ? facilities[0] : null

      // Calculate shopping score based on multiple factors
      const shoppingScore = this.calculateShoppingScore(facilitiesWithin2km, facilitiesWithin5km)

      // Extract facility types
      const facilityTypes = [...new Set(facilities.map(facility => facility.type))].sort()

      return {
        facilitiesWithin2km,
        facilitiesWithin5km,
        nearestFacility,
        shoppingScore,
        facilityTypes,
        facilityCount: facilities.length,
        confidence: facilities.length > 0 ? 0.9 : 0.1
      }
    } catch (error) {
      console.error('Error calculating shopping accessibility:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Get shopping facilities near a location using OpenStreetMap Nominatim API
   */
  private async getShoppingFacilitiesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<ShoppingFacility[]> {
    try {
      const facilities: ShoppingFacility[] = []

      // Search for different types of shopping facilities
      const facilityQueries = [
        { type: 'shopping_centre', query: 'shop=mall OR shop=shopping_centre OR amenity=marketplace' },
        { type: 'supermarket', query: 'shop=supermarket OR shop=convenience' },
        { type: 'pharmacy', query: 'amenity=pharmacy' },
        { type: 'bank', query: 'amenity=bank' },
        { type: 'post_office', query: 'amenity=post_office' },
        { type: 'retail', query: 'shop=department_store OR shop=clothes OR shop=electronics' }
      ]

      for (const facilityType of facilityQueries) {
        try {
          const results = await this.searchNominatim(
            latitude,
            longitude,
            radiusKm,
            facilityType.query,
            facilityType.type as ShoppingFacility['type']
          )
          facilities.push(...results)
        } catch (error) {
          console.warn(`Error searching for ${facilityType.type}:`, error)
        }
      }

      // Remove duplicates and sort by distance
      const uniqueFacilities = this.removeDuplicateFacilities(facilities)
      return uniqueFacilities.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    } catch (error) {
      console.error('Error fetching shopping facilities:', error)
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
    facilityType: ShoppingFacility['type']
  ): Promise<ShoppingFacility[]> {
    try {
      // Calculate bounding box for search area
      const latDelta = radiusKm / 111.0 // Approximate degrees per km
      const lngDelta = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180))

      const params = new URLSearchParams({
        format: 'json',
        limit: '50',
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

      // Convert to our ShoppingFacility format
      const facilities: ShoppingFacility[] = data.map((item: any) => {
        const facility: ShoppingFacility = {
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
  private removeDuplicateFacilities(facilities: ShoppingFacility[]): ShoppingFacility[] {
    const unique: ShoppingFacility[] = []

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
   * Calculate shopping score based on facility availability and diversity
   */
  private calculateShoppingScore(
    facilitiesWithin2km: ShoppingFacility[],
    facilitiesWithin5km: ShoppingFacility[]
  ): number {
    let score = 10.0 // Start with worst score (high = poor access)

    // Heavy weight for facilities within walking distance (2km)
    if (facilitiesWithin2km.length >= 5) {
      score -= 4.0 // Excellent shopping access
    } else if (facilitiesWithin2km.length >= 3) {
      score -= 3.0 // Good shopping access
    } else if (facilitiesWithin2km.length >= 1) {
      score -= 2.0 // Basic shopping access
    }

    // Additional points for broader area coverage (2-5km)
    const facilitiesIn2to5km = facilitiesWithin5km.length - facilitiesWithin2km.length
    if (facilitiesIn2to5km >= 10) {
      score -= 2.5
    } else if (facilitiesIn2to5km >= 5) {
      score -= 1.5
    } else if (facilitiesIn2to5km >= 1) {
      score -= 0.5
    }

    // Bonus for shopping diversity
    const uniqueTypes = new Set(facilitiesWithin5km.map(f => f.type))
    if (uniqueTypes.size >= 4) {
      score -= 1.0 // Excellent diversity
    } else if (uniqueTypes.size >= 3) {
      score -= 0.5 // Good diversity
    }

    // Bonus for major shopping centres
    const shoppingCentres = facilitiesWithin5km.filter(f => f.type === 'shopping_centre').length
    if (shoppingCentres >= 2) {
      score -= 1.0
    } else if (shoppingCentres >= 1) {
      score -= 0.5
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
   * Create empty result for areas with no shopping access
   */
  private createEmptyResult(): ShoppingAccessibilityResult {
    return {
      facilitiesWithin2km: [],
      facilitiesWithin5km: [],
      nearestFacility: null,
      shoppingScore: 10.0, // High score = poor shopping access
      facilityTypes: [],
      facilityCount: 0,
      confidence: 0.9 // High confidence in "no facilities" result
    }
  }

  /**
   * Test the shopping service with multiple locations
   */
  async testShoppingService(): Promise<{
    results: Array<{
      location: string
      coordinates: [number, number]
      result: ShoppingAccessibilityResult
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
      console.log(`\nTesting shopping accessibility: ${location.name}`)
      const result = await this.calculateShoppingAccessibility(
        location.coords[0],
        location.coords[1],
        5.0
      )

      results.push({
        location: location.name,
        coordinates: location.coords,
        result
      })

      // Add delay to respect Nominatim rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return { results }
  }
}

// Export singleton instance
export const waShoppingService = new WAShoppingService()
export default waShoppingService
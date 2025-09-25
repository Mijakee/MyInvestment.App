/**
 * Enhanced Convenience Score Service
 * Comprehensive convenience scoring using all facility types:
 * - Parks, Shopping Centres, Groceries, Health Care, Pharmacies, Leisure Centres
 * - Uses local static data files to avoid API rate limits
 * - Performance optimized for real-time calculations
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface ConveniencePoint {
  name: string
  latitude: number
  longitude: number
  type: string
  category: string
  subcategory?: string
  suburb?: string
  postcode?: string
  metadata?: any
}

export interface EnhancedConvenienceScore {
  overallScore: number
  confidence: number
  components: {
    shopping: {
      score: number
      weight: number
      nearbyShoppingCentres: number
      nearbyGroceries: number
      facilitiesWithin2km: number
      facilitiesWithin5km: number
    }
    health: {
      score: number
      weight: number
      nearbyHealthCare: number
      nearbyPharmacies: number
      facilitiesWithin5km: number
      facilitiesWithin10km: number
    }
    recreation: {
      score: number
      weight: number
      nearbyParks: number
      nearbyLeisureCentres: number
      facilitiesWithin2km: number
      beachAccess: boolean
    }
    transport: {
      score: number
      weight: number
      nearbyStops: number
      stopsWithin1km: number
      stopsWithin2km: number
    }
  }
  explanation: {
    shoppingSummary: string
    healthSummary: string
    recreationSummary: string
    transportSummary: string
    overallSummary: string
  }
}

class EnhancedConvenienceScoreService {
  private shoppingCentres: ConveniencePoint[] = []
  private groceries: ConveniencePoint[] = []
  private healthCare: ConveniencePoint[] = []
  private pharmacies: ConveniencePoint[] = []
  private leisureCentres: ConveniencePoint[] = []
  private parks: ConveniencePoint[] = []
  private transportStops: ConveniencePoint[] = []
  private initialized = false

  /**
   * Component weights for overall convenience score
   */
  private readonly weights = {
    shopping: 0.30,      // Shopping centres + groceries (30%)
    health: 0.25,        // Health care + pharmacies (25%)
    recreation: 0.25,    // Parks + leisure centres (25%)
    transport: 0.20      // Public transport (20%)
  }

  /**
   * Initialize service with all static facility data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🚀 Initializing enhanced convenience scoring with comprehensive facility data...')

    try {
      // Load all facility types from static OSM data
      this.shoppingCentres = this.loadFacilityData('shopping-centres.json')
      this.groceries = this.loadFacilityData('groceries.json')
      this.healthCare = this.loadFacilityData('health-care.json')
      this.pharmacies = this.loadFacilityData('pharmacies.json')
      this.leisureCentres = this.loadFacilityData('leisure-centres.json')
      this.parks = this.loadFacilityData('parks.json')

      // Load transport data from existing GTFS file
      this.transportStops = this.loadTransportData()

      console.log('📊 Loaded facility data:')
      console.log(`   🏪 Shopping Centres: ${this.shoppingCentres.length}`)
      console.log(`   🛒 Groceries: ${this.groceries.length}`)
      console.log(`   🏥 Health Care: ${this.healthCare.length}`)
      console.log(`   💊 Pharmacies: ${this.pharmacies.length}`)
      console.log(`   🏃 Leisure Centres: ${this.leisureCentres.length}`)
      console.log(`   🌳 Parks: ${this.parks.length}`)
      console.log(`   🚌 Transport Stops: ${this.transportStops.length}`)

      this.initialized = true
      console.log('✅ Enhanced convenience scoring initialized successfully')

    } catch (error) {
      console.error('💥 Failed to initialize enhanced convenience scoring:', error)
      throw error
    }
  }

  /**
   * Calculate comprehensive convenience score for coordinates
   */
  async calculateEnhancedConvenienceScore(latitude: number, longitude: number): Promise<EnhancedConvenienceScore> {
    if (!this.initialized) {
      await this.initialize()
    }

    // Calculate individual component scores
    const shoppingComponent = this.calculateShoppingScore(latitude, longitude)
    const healthComponent = this.calculateHealthScore(latitude, longitude)
    const recreationComponent = this.calculateRecreationScore(latitude, longitude)
    const transportComponent = this.calculateTransportScore(latitude, longitude)

    // Calculate weighted overall score
    const overallScore = (
      shoppingComponent.score * this.weights.shopping +
      healthComponent.score * this.weights.health +
      recreationComponent.score * this.weights.recreation +
      transportComponent.score * this.weights.transport
    )

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence()

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      confidence,
      components: {
        shopping: { ...shoppingComponent, weight: this.weights.shopping },
        health: { ...healthComponent, weight: this.weights.health },
        recreation: { ...recreationComponent, weight: this.weights.recreation },
        transport: { ...transportComponent, weight: this.weights.transport }
      },
      explanation: {
        shoppingSummary: this.generateShoppingSummary(shoppingComponent),
        healthSummary: this.generateHealthSummary(healthComponent),
        recreationSummary: this.generateRecreationSummary(recreationComponent),
        transportSummary: this.generateTransportSummary(transportComponent),
        overallSummary: this.generateOverallSummary(overallScore)
      }
    }
  }

  /**
   * Calculate shopping convenience (shopping centres + groceries)
   */
  private calculateShoppingScore(lat: number, lng: number) {
    const shoppingWithin2km = this.shoppingCentres.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 2
    )
    const groceriesWithin2km = this.groceries.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 2
    )
    const shoppingWithin5km = this.shoppingCentres.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )
    const groceriesWithin5km = this.groceries.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )

    let score = 1 // Base score

    // Major shopping centres have high impact
    if (shoppingWithin2km.length >= 2) score = 9
    else if (shoppingWithin2km.length >= 1) score = 7
    else if (shoppingWithin5km.length >= 2) score = 5
    else if (shoppingWithin5km.length >= 1) score = 4

    // Groceries provide essential convenience
    if (groceriesWithin2km.length >= 3) score += 1
    else if (groceriesWithin2km.length >= 1) score += 0.5

    // Bonus for variety
    if (shoppingWithin2km.length >= 1 && groceriesWithin2km.length >= 1) score += 0.5

    score = Math.min(10, Math.max(1, score))

    return {
      score: Math.round(score * 10) / 10,
      nearbyShoppingCentres: shoppingWithin5km.length,
      nearbyGroceries: groceriesWithin5km.length,
      facilitiesWithin2km: shoppingWithin2km.length + groceriesWithin2km.length,
      facilitiesWithin5km: shoppingWithin5km.length + groceriesWithin5km.length
    }
  }

  /**
   * Calculate health convenience (health care + pharmacies)
   */
  private calculateHealthScore(lat: number, lng: number) {
    const healthWithin5km = this.healthCare.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )
    const pharmaciesWithin5km = this.pharmacies.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )
    const healthWithin10km = this.healthCare.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 10
    )
    const pharmaciesWithin10km = this.pharmacies.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 10
    )

    let score = 1

    // Health care facilities
    if (healthWithin5km.length >= 2) score = 8
    else if (healthWithin5km.length >= 1) score = 6
    else if (healthWithin10km.length >= 2) score = 4
    else if (healthWithin10km.length >= 1) score = 3

    // Pharmacy access is essential
    if (pharmaciesWithin5km.length >= 2) score += 1
    else if (pharmaciesWithin5km.length >= 1) score += 0.5

    // Bonus for comprehensive health coverage
    if (healthWithin5km.length >= 1 && pharmaciesWithin5km.length >= 1) score += 0.5

    score = Math.min(10, Math.max(1, score))

    return {
      score: Math.round(score * 10) / 10,
      nearbyHealthCare: healthWithin10km.length,
      nearbyPharmacies: pharmaciesWithin10km.length,
      facilitiesWithin5km: healthWithin5km.length + pharmaciesWithin5km.length,
      facilitiesWithin10km: healthWithin10km.length + pharmaciesWithin10km.length
    }
  }

  /**
   * Calculate recreation convenience (parks + leisure centres)
   */
  private calculateRecreationScore(lat: number, lng: number) {
    const parksWithin2km = this.parks.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 2
    )
    const leisureWithin2km = this.leisureCentres.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 2
    )
    const parksWithin5km = this.parks.filter(facility =>
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )
    const beachAccess = this.parks.some(facility =>
      facility.subcategory === 'beach' &&
      this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
    )

    let score = 1

    // Parks are essential for recreation
    if (parksWithin2km.length >= 3) score = 8
    else if (parksWithin2km.length >= 2) score = 6
    else if (parksWithin2km.length >= 1) score = 4
    else if (parksWithin5km.length >= 2) score = 3
    else if (parksWithin5km.length >= 1) score = 2

    // Leisure centres add active recreation options
    if (leisureWithin2km.length >= 1) score += 1.5

    // Beach access is a major bonus
    if (beachAccess) score += 2

    score = Math.min(10, Math.max(1, score))

    return {
      score: Math.round(score * 10) / 10,
      nearbyParks: parksWithin5km.length,
      nearbyLeisureCentres: this.leisureCentres.filter(facility =>
        this.calculateDistance(lat, lng, facility.latitude, facility.longitude) <= 5
      ).length,
      facilitiesWithin2km: parksWithin2km.length + leisureWithin2km.length,
      beachAccess
    }
  }

  /**
   * Calculate transport convenience (existing GTFS data)
   */
  private calculateTransportScore(lat: number, lng: number) {
    const within1km = this.transportStops.filter(stop =>
      this.calculateDistance(lat, lng, stop.latitude, stop.longitude) <= 1
    )
    const within2km = this.transportStops.filter(stop =>
      this.calculateDistance(lat, lng, stop.latitude, stop.longitude) <= 2
    )

    let score = 1

    // Score based on stops within walking distance
    if (within1km.length >= 10) score = 10
    else if (within1km.length >= 5) score = 8
    else if (within1km.length >= 3) score = 6
    else if (within1km.length >= 1) score = 4
    else if (within2km.length >= 5) score = 3
    else if (within2km.length >= 1) score = 2

    return {
      score,
      nearbyStops: within2km.length,
      stopsWithin1km: within1km.length,
      stopsWithin2km: within2km.length
    }
  }

  /**
   * Load facility data from JSON files
   */
  private loadFacilityData(filename: string): ConveniencePoint[] {
    try {
      const filePath = join(process.cwd(), 'src/data/convenience-data/osm-static', filename)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8')
        return JSON.parse(content) as ConveniencePoint[]
      }
      console.warn(`⚠️ ${filename} not found, using empty array`)
      return []
    } catch (error) {
      console.warn(`⚠️ Failed to load ${filename}:`, error)
      return []
    }
  }

  /**
   * Load transport data from GTFS stops
   */
  private loadTransportData(): ConveniencePoint[] {
    try {
      const filePath = join(process.cwd(), 'src/data/convenience-data/transport/stops.txt')
      if (!existsSync(filePath)) {
        console.warn('⚠️ Transport stops.txt not found')
        return []
      }

      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n').slice(1) // Skip header
      const stops: ConveniencePoint[] = []

      for (const line of lines) {
        if (!line.trim()) continue

        const parts = line.split(',')
        if (parts.length < 8) continue

        const stopId = parts[2]?.replace(/"/g, '')
        const stopName = parts[4]?.replace(/"/g, '')
        const lat = parseFloat(parts[6])
        const lng = parseFloat(parts[7])
        const modes = parts[9]?.replace(/"/g, '') || 'Bus'

        if (!stopId || isNaN(lat) || isNaN(lng)) continue

        stops.push({
          name: stopName || `Stop ${stopId}`,
          latitude: lat,
          longitude: lng,
          type: 'transport',
          category: 'transport',
          metadata: {
            stopId,
            modes: modes.split(',').map(m => m.trim())
          }
        })
      }

      return stops
    } catch (error) {
      console.warn('⚠️ Failed to load transport data:', error)
      return []
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(): number {
    let confidence = 0.3 // Base confidence

    // Increase confidence based on available data
    if (this.shoppingCentres.length > 0) confidence += 0.15
    if (this.groceries.length > 0) confidence += 0.15
    if (this.healthCare.length > 0) confidence += 0.1
    if (this.pharmacies.length > 0) confidence += 0.1
    if (this.leisureCentres.length > 0) confidence += 0.1
    if (this.parks.length > 0) confidence += 0.1
    if (this.transportStops.length > 0) confidence += 0.1

    return Math.min(1.0, confidence)
  }

  // Summary generation methods
  private generateShoppingSummary(component: any): string {
    if (component.facilitiesWithin2km >= 3) return `Excellent shopping access (${component.facilitiesWithin2km} facilities within 2km)`
    if (component.facilitiesWithin2km >= 1) return `Good shopping access (${component.facilitiesWithin2km} facilities within 2km)`
    if (component.facilitiesWithin5km >= 1) return `Moderate shopping access (${component.facilitiesWithin5km} facilities within 5km)`
    return 'Limited shopping access'
  }

  private generateHealthSummary(component: any): string {
    if (component.facilitiesWithin5km >= 3) return `Excellent health access (${component.facilitiesWithin5km} facilities within 5km)`
    if (component.facilitiesWithin5km >= 1) return `Good health access (${component.facilitiesWithin5km} facilities within 5km)`
    if (component.facilitiesWithin10km >= 1) return `Moderate health access (${component.facilitiesWithin10km} facilities within 10km)`
    return 'Limited health facility access'
  }

  private generateRecreationSummary(component: any): string {
    const beach = component.beachAccess ? ' with beach access' : ''
    if (component.facilitiesWithin2km >= 3) return `Excellent recreation access (${component.facilitiesWithin2km} facilities within 2km)${beach}`
    if (component.facilitiesWithin2km >= 1) return `Good recreation access (${component.facilitiesWithin2km} facilities within 2km)${beach}`
    if (component.nearbyParks >= 1) return `Moderate recreation access (${component.nearbyParks} parks nearby)${beach}`
    return `Limited recreation access${beach}`
  }

  private generateTransportSummary(component: any): string {
    if (component.stopsWithin1km >= 5) return `Excellent public transport (${component.stopsWithin1km} stops within 1km)`
    if (component.stopsWithin1km >= 1) return `Good public transport (${component.stopsWithin1km} stops within 1km)`
    if (component.stopsWithin2km >= 1) return `Moderate transport access (${component.stopsWithin2km} stops within 2km)`
    return 'Limited public transport access'
  }

  private generateOverallSummary(score: number): string {
    if (score >= 8.5) return 'Exceptional convenience with excellent access to all amenities'
    if (score >= 7.5) return 'High convenience with very good access to most amenities'
    if (score >= 6.5) return 'Good convenience with reasonable access to amenities'
    if (score >= 5.5) return 'Moderate convenience with basic access to amenities'
    if (score >= 4.0) return 'Limited convenience with some essential amenities nearby'
    return 'Basic convenience with minimal amenity access'
  }
}

// Export singleton instance
export const enhancedConvenienceScoreService = new EnhancedConvenienceScoreService()
export default enhancedConvenienceScoreService
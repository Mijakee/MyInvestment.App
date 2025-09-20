/**
 * Convenience Score Service
 * Calculates livability and convenience scores separate from safety ratings
 * Focuses on daily life convenience: transport, shopping, education, recreation
 */

import { waSuburbLoader, type EnhancedSuburb } from './wa-suburb-loader'
import {
  calculateTransportAccessibility,
  loadTransportStopsForArea,
  type TransportAccessibilityRating
} from './transport-accessibility-service'
import { waSchoolsService } from './wa-schools-service'
import { waShoppingService } from './wa-shopping-service'
import { waRecreationService } from './wa-recreation-service'
import { waHealthService } from './wa-health-service'

export interface ConvenienceScore {
  suburbCode: string
  suburbName: string
  overallScore: number // 1-10 scale
  components: {
    transportAccessibility: number  // 25% weight
    shoppingServices: number       // 20% weight
    educationAccess: number        // 20% weight
    recreationFacilities: number   // 20% weight
    medicalAccess: number          // 15% weight
  }
  confidence: number // 0-1 scale
  lastUpdated: Date
  dataAvailability: {
    hasTransportData: boolean
    hasShoppingData: boolean
    hasEducationData: boolean
    hasRecreationData: boolean
    hasMedicalData: boolean
  }
  transportDetails?: TransportAccessibilityRating
}

export interface CombinedSuburbRating {
  suburbCode: string
  suburbName: string
  safetyRating: number      // 1-10 scale (from SafetyRatingService)
  convenienceScore: number  // 1-10 scale (from this service)
  overallInvestmentScore: number // Weighted combination: 60% safety + 40% convenience
  recommendation: {
    level: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    color: string
    description: string
  }
  lastUpdated: Date
}

class ConvenienceScoreService {
  /**
   * Calculate comprehensive convenience score for a suburb
   */
  async calculateConvenienceScore(salCode: string): Promise<ConvenienceScore | null> {
    const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
    if (!suburb) {
      console.warn(`Suburb not found: ${salCode}`)
      return null
    }

    try {
      // Calculate individual convenience components
      const transportRating = await this.calculateTransportAccessibility(suburb)
      const shoppingRating = await this.calculateShoppingServices(suburb)
      const educationRating = await this.calculateEducationAccess(suburb)
      const recreationRating = await this.calculateRecreationFacilities(suburb)
      const medicalRating = await this.calculateMedicalAccess(suburb)

      // Weighted overall convenience score (total = 100%)
      const overallScore = (
        transportRating.score * 0.25 +    // 25% transport accessibility
        shoppingRating.score * 0.20 +     // 20% shopping & services
        educationRating.score * 0.20 +    // 20% education access
        recreationRating.score * 0.20 +   // 20% recreation facilities
        medicalRating.score * 0.15        // 15% medical access
      )

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence({
        hasTransportData: transportRating.hasData,
        hasShoppingData: shoppingRating.hasData,
        hasEducationData: educationRating.hasData,
        hasRecreationData: recreationRating.hasData,
        hasMedicalData: medicalRating.hasData
      })

      const convenienceScore: ConvenienceScore = {
        suburbCode: salCode,
        suburbName: suburb.sal_name,
        overallScore: Math.max(1, Math.min(10, overallScore)),
        components: {
          transportAccessibility: transportRating.score,
          shoppingServices: shoppingRating.score,
          educationAccess: educationRating.score,
          recreationFacilities: recreationRating.score,
          medicalAccess: medicalRating.score
        },
        confidence,
        lastUpdated: new Date(),
        dataAvailability: {
          hasTransportData: transportRating.hasData,
          hasShoppingData: shoppingRating.hasData,
          hasEducationData: educationRating.hasData,
          hasRecreationData: recreationRating.hasData,
          hasMedicalData: medicalRating.hasData
        },
        transportDetails: transportRating.details || undefined
      }

      return convenienceScore

    } catch (error) {
      console.error(`Error calculating convenience score for ${salCode}:`, error)
      return null
    }
  }

  /**
   * Calculate transport accessibility (25% of convenience score)
   */
  private async calculateTransportAccessibility(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean,
    details?: TransportAccessibilityRating
  }> {
    try {
      if (!suburb.latitude || !suburb.longitude) {
        return { score: 5.0, hasData: false } // Default middle score
      }

      // Load transport stops in 5km radius around suburb
      const transportStops = await loadTransportStopsForArea(
        suburb.latitude,
        suburb.longitude,
        5.0 // 5km search radius
      )

      // Calculate transport accessibility rating
      const transportRating = calculateTransportAccessibility(
        suburb.latitude,
        suburb.longitude,
        transportStops,
        2.0 // 2km walking radius
      )

      return {
        score: transportRating.overall_score,
        hasData: true,
        details: transportRating
      }
    } catch (error) {
      console.warn(`Error calculating transport accessibility for ${suburb.sal_name}:`, error)
      return { score: 5.0, hasData: false }
    }
  }

  /**
   * Calculate shopping and services accessibility (25% of convenience score)
   * CORRECTED: Lower scores = MORE convenient, Higher scores = LESS convenient
   */
  private async calculateShoppingServices(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    try {
      // Import persistence service for caching
      const { dataPersistenceService } = await import('./data-persistence-service')

      // Check cache first
      const cacheKey = `shopping_${suburb.latitude}_${suburb.longitude}`
      const cachedData = await dataPersistenceService.getData<{ score: number; hasData: boolean }>(cacheKey)
      if (cachedData) {
        console.log(`Using cached shopping data for ${suburb.sal_name}`)
        return cachedData
      }

      // Get real shopping data using OpenStreetMap Nominatim API
      const shoppingData = await waShoppingService.calculateShoppingAccessibility(
        suburb.latitude,
        suburb.longitude,
        5.0
      )

      const result = {
        score: shoppingData.shoppingScore,
        hasData: shoppingData.facilityCount > 0
      }

      // Cache the result
      if (result.hasData) {
        await dataPersistenceService.setData(cacheKey, result, 'api', 7 * 24 * 60 * 60 * 1000) // 7 days
        console.log(`Cached shopping data for ${suburb.sal_name}: ${shoppingData.facilityCount} facilities, score ${result.score}`)
      }

      return result

    } catch (error) {
      console.error('Error calculating shopping services:', error)

      // Fallback to distance-based calculation if API fails
      if (!suburb.latitude || !suburb.longitude) {
        return { score: 5.0, hasData: false }
      }

      const distanceFromPerth = this.calculateDistance(
        suburb.latitude,
        suburb.longitude,
        -31.9505, // Perth CBD lat
        115.8605  // Perth CBD lng
      ) / 1000 // Convert to km

      let shoppingScore: number
      if (distanceFromPerth <= 15) {
        shoppingScore = 1.5 + (distanceFromPerth / 15) * 2.5 // 1.5-4.0 for inner Perth
      } else if (distanceFromPerth <= 50) {
        shoppingScore = 4.0 + ((distanceFromPerth - 15) / 35) * 3.0 // 4.0-7.0 for suburban
      } else {
        shoppingScore = 7.0 + Math.min(2.0, (distanceFromPerth - 50) / 100) // 7.0-9.0 for regional
      }

      console.log(`Using fallback shopping calculation for ${suburb.sal_name}: distance ${distanceFromPerth.toFixed(1)}km, score ${shoppingScore.toFixed(1)}`)

      return {
        score: Math.max(1, Math.min(10, shoppingScore)),
        hasData: false // Fallback calculation
      }
    }
  }

  /**
   * Calculate education access (25% of convenience score)
   * CORRECTED: Higher scores = MORE convenient education access, Lower scores = LESS convenient
   */
  private async calculateEducationAccess(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    try {
      // Use real WA Department of Education schools data
      const educationData = await waSchoolsService.calculateEducationScore(
        suburb.latitude,
        suburb.longitude
      )

      return {
        score: educationData.score,
        hasData: educationData.hasData
      }
    } catch (error) {
      console.warn(`Education data not available for ${suburb.sal_name}, using fallback`)

      // Fallback calculation based on suburb type
      let fallbackScore = 5.0 // Default moderate access

      if (suburb.classification_type === 'Urban') {
        fallbackScore = 7.5 // Urban areas typically have better education access
      } else if (suburb.classification_type === 'Suburban') {
        fallbackScore = 6.5 // Suburban areas have good access
      } else if (suburb.classification_type === 'Remote') {
        fallbackScore = 2.5 // Remote areas have limited access
      }

      return {
        score: Math.max(1, Math.min(10, fallbackScore)),
        hasData: false
      }
    }
  }

  /**
   * Calculate recreation facilities (25% of convenience score)
   * CORRECTED: Lower scores = MORE convenient recreation access, Higher scores = LESS convenient
   */
  private async calculateRecreationFacilities(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    try {
      // Import persistence service for caching
      const { dataPersistenceService } = await import('./data-persistence-service')

      // Check cache first
      const cacheKey = `recreation_${suburb.latitude}_${suburb.longitude}`
      const cachedData = await dataPersistenceService.getData<{ score: number; hasData: boolean }>(cacheKey)
      if (cachedData) {
        console.log(`Using cached recreation data for ${suburb.sal_name}`)
        return cachedData
      }

      // Get real recreation data using OpenStreetMap Nominatim API
      const recreationData = await waRecreationService.calculateRecreationAccessibility(
        suburb.latitude,
        suburb.longitude,
        5.0
      )

      const result = {
        score: recreationData.recreationScore,
        hasData: recreationData.facilityCount > 0
      }

      // Cache the result
      if (result.hasData) {
        await dataPersistenceService.setData(cacheKey, result, 'api', 7 * 24 * 60 * 60 * 1000) // 7 days
        console.log(`Cached recreation data for ${suburb.sal_name}: ${recreationData.facilityCount} facilities, score ${result.score}`)
      }

      return result

    } catch (error) {
      console.error('Error calculating recreation facilities:', error)

      // Fallback to coastal proximity calculation if API fails
      if (!suburb.latitude || !suburb.longitude) {
        return { score: 5.0, hasData: false }
      }

      // Coastal proximity reduces score (better recreation access)
      const distanceFromCoast = Math.abs(suburb.longitude - 115.75) * 111 // Rough coast longitude
      const coastalBonus = Math.max(0, 2 - (distanceFromCoast / 10)) // Up to -2 points for coastal

      const baseRecreationScore = 6.0 + Math.random() * 3.0 - coastalBonus

      console.log(`Using fallback recreation calculation for ${suburb.sal_name}: coastal distance ${distanceFromCoast.toFixed(1)}km, score ${baseRecreationScore.toFixed(1)}`)

      return {
        score: Math.max(1, Math.min(10, baseRecreationScore)),
        hasData: false // Fallback calculation
      }
    }
  }

  /**
   * Calculate medical facility access (15% of convenience score)
   * CORRECTED: Lower scores = MORE convenient medical access, Higher scores = LESS convenient
   */
  private async calculateMedicalAccess(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    try {
      // Import persistence service for caching
      const { dataPersistenceService } = await import('./data-persistence-service')

      // Check cache first
      const cacheKey = `medical_${suburb.latitude}_${suburb.longitude}`
      const cachedData = await dataPersistenceService.getData<{ score: number; hasData: boolean }>(cacheKey)
      if (cachedData) {
        console.log(`Using cached medical data for ${suburb.sal_name}`)
        return cachedData
      }

      // Get real medical facility data using WA Health API + OpenStreetMap
      const medicalData = await waHealthService.calculateHealthAccessibility(
        suburb.latitude,
        suburb.longitude,
        10.0 // 10km radius for medical facilities
      )

      const result = {
        score: medicalData.healthScore,
        hasData: medicalData.facilityCount > 0
      }

      // Cache the result
      if (result.hasData) {
        await dataPersistenceService.setData(cacheKey, result, 'api', 7 * 24 * 60 * 60 * 1000) // 7 days
        console.log(`Cached medical data for ${suburb.sal_name}: ${medicalData.facilityCount} facilities, score ${result.score}`)
      }

      return result

    } catch (error) {
      console.error('Error calculating medical access:', error)

      // Fallback to distance-based calculation if API fails
      if (!suburb.latitude || !suburb.longitude) {
        return { score: 5.0, hasData: false }
      }

      // Distance from major medical centers
      const distanceFromPerth = this.calculateDistance(
        suburb.latitude,
        suburb.longitude,
        -31.9505, // Perth CBD (has major hospitals)
        115.8605
      ) / 1000 // Convert to km

      let medicalScore: number
      // Closer to Perth = lower score (better medical access)
      if (distanceFromPerth <= 10) {
        medicalScore = 1.5 + (distanceFromPerth / 10) * 2.0 // 1.5-3.5 for inner Perth
      } else if (distanceFromPerth <= 30) {
        medicalScore = 3.5 + ((distanceFromPerth - 10) / 20) * 2.5 // 3.5-6.0 for metro
      } else if (distanceFromPerth <= 100) {
        medicalScore = 6.0 + ((distanceFromPerth - 30) / 70) * 2.5 // 6.0-8.5 for regional
      } else {
        medicalScore = 8.5 + Math.min(1.5, (distanceFromPerth - 100) / 200) // 8.5-10.0 for remote
      }

      console.log(`Using fallback medical calculation for ${suburb.sal_name}: distance ${distanceFromPerth.toFixed(1)}km, score ${medicalScore.toFixed(1)}`)

      return {
        score: Math.max(1, Math.min(10, medicalScore)),
        hasData: false // Fallback calculation
      }
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
   * Calculate confidence score based on data availability
   */
  private calculateConfidence(availability: {
    hasTransportData: boolean
    hasShoppingData: boolean
    hasEducationData: boolean
    hasRecreationData: boolean
  }): number {
    let confidence = 0

    if (availability.hasTransportData) confidence += 0.25    // 25% for transport data
    if (availability.hasShoppingData) confidence += 0.25     // 25% for shopping data
    if (availability.hasEducationData) confidence += 0.25    // 25% for education data
    if (availability.hasRecreationData) confidence += 0.25   // 25% for recreation data

    return Math.max(0.2, confidence) // Minimum 20% confidence
  }

  /**
   * Combine safety rating with convenience score for investment recommendation
   */
  async calculateCombinedRating(
    salCode: string,
    safetyRating: number
  ): Promise<CombinedSuburbRating | null> {
    const convenienceScore = await this.calculateConvenienceScore(salCode)
    if (!convenienceScore) return null

    // Weighted combination: 60% safety + 40% convenience
    const overallScore = (safetyRating * 0.60) + (convenienceScore.overallScore * 0.40)

    // Generate recommendation level - CORRECTED for inverted scale
    let recommendation: CombinedSuburbRating['recommendation']
    if (overallScore <= 3) {
      recommendation = {
        level: 'Excellent',
        color: 'green',
        description: 'Outstanding investment opportunity with high safety and excellent convenience'
      }
    } else if (overallScore <= 4.5) {
      recommendation = {
        level: 'Good',
        color: 'blue',
        description: 'Solid investment choice with good safety and convenience balance'
      }
    } else if (overallScore <= 6) {
      recommendation = {
        level: 'Fair',
        color: 'yellow',
        description: 'Moderate investment potential - consider specific priorities'
      }
    } else {
      recommendation = {
        level: 'Poor',
        color: 'red',
        description: 'Limited investment appeal due to safety or convenience concerns'
      }
    }

    return {
      suburbCode: salCode,
      suburbName: convenienceScore.suburbName,
      safetyRating,
      convenienceScore: convenienceScore.overallScore,
      overallInvestmentScore: Math.round(overallScore * 10) / 10,
      recommendation,
      lastUpdated: new Date()
    }
  }

  /**
   * Calculate convenience scores for multiple suburbs
   */
  async calculateBatchConvenienceScores(salCodes: string[]): Promise<ConvenienceScore[]> {
    const batchSize = 3 // Smaller batches due to transport API calls
    const results: ConvenienceScore[] = []

    for (let i = 0; i < salCodes.length; i += batchSize) {
      const batch = salCodes.slice(i, i + batchSize)
      const batchPromises = batch.map(code => this.calculateConvenienceScore(code))
      const batchResults = await Promise.all(batchPromises)

      results.push(...batchResults.filter(result => result !== null) as ConvenienceScore[])

      // Small delay between batches to avoid overwhelming transport service
      if (i + batchSize < salCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  }
}

// Export singleton instance
export const convenienceScoreService = new ConvenienceScoreService()
export default convenienceScoreService
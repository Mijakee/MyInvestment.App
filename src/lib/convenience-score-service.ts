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

export interface ConvenienceScore {
  suburbCode: string
  suburbName: string
  overallScore: number // 1-10 scale
  components: {
    transportAccessibility: number  // 40% weight
    shoppingServices: number       // 25% weight
    educationAccess: number        // 20% weight
    recreationFacilities: number   // 15% weight
  }
  confidence: number // 0-1 scale
  lastUpdated: Date
  dataAvailability: {
    hasTransportData: boolean
    hasShoppingData: boolean
    hasEducationData: boolean
    hasRecreationData: boolean
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

      // Weighted overall convenience score (total = 100%)
      const overallScore = (
        transportRating.score * 0.40 +    // 40% transport accessibility
        shoppingRating.score * 0.25 +     // 25% shopping & services
        educationRating.score * 0.20 +    // 20% education access
        recreationRating.score * 0.15     // 15% recreation facilities
      )

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence({
        hasTransportData: transportRating.hasData,
        hasShoppingData: shoppingRating.hasData,
        hasEducationData: educationRating.hasData,
        hasRecreationData: recreationRating.hasData
      })

      const convenienceScore: ConvenienceScore = {
        suburbCode: salCode,
        suburbName: suburb.sal_name,
        overallScore: Math.max(1, Math.min(10, overallScore)),
        components: {
          transportAccessibility: transportRating.score,
          shoppingServices: shoppingRating.score,
          educationAccess: educationRating.score,
          recreationFacilities: recreationRating.score
        },
        confidence,
        lastUpdated: new Date(),
        dataAvailability: {
          hasTransportData: transportRating.hasData,
          hasShoppingData: shoppingRating.hasData,
          hasEducationData: educationRating.hasData,
          hasRecreationData: recreationRating.hasData
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
   * Calculate transport accessibility (40% of convenience score)
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
   */
  private async calculateShoppingServices(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    // TODO: Implement shopping center and service accessibility analysis
    // Data sources:
    // - Shopping centers and malls within 10km
    // - Supermarkets, pharmacies, banks within 5km
    // - Medical facilities and government services
    // - Postal services and other essential services

    // Mock calculation based on distance from Perth CBD and population density
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
      shoppingScore = 8.5 - (distanceFromPerth / 15) * 2.5 // 8.5-6.0 for inner Perth
    } else if (distanceFromPerth <= 50) {
      shoppingScore = 6.0 - ((distanceFromPerth - 15) / 35) * 3.0 // 6.0-3.0 for suburban
    } else {
      shoppingScore = 3.0 - Math.min(2.0, (distanceFromPerth - 50) / 100) // 3.0-1.0 for regional
    }

    return {
      score: Math.max(1, Math.min(10, shoppingScore)),
      hasData: false // Mock data
    }
  }

  /**
   * Calculate education access (20% of convenience score)
   */
  private async calculateEducationAccess(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    // TODO: Implement education facility accessibility analysis
    // Data sources:
    // - Primary and secondary schools within reasonable distance
    // - School quality ratings and ICSEA scores
    // - Universities and TAFE campuses
    // - Childcare centers and early learning facilities

    // Mock calculation based on population density (higher density = more schools)
    const mockEducationScore = 5.0 + Math.random() * 3.0 // 5.0-8.0 range

    return {
      score: Math.max(1, Math.min(10, mockEducationScore)),
      hasData: false // Mock data
    }
  }

  /**
   * Calculate recreation facilities (15% of convenience score)
   */
  private async calculateRecreationFacilities(suburb: EnhancedSuburb): Promise<{
    score: number,
    hasData: boolean
  }> {
    // TODO: Implement recreation facility accessibility analysis
    // Data sources:
    // - Parks and reserves within walking distance
    // - Sports facilities and gyms
    // - Libraries and community centers
    // - Entertainment venues and cultural facilities

    // Mock calculation based on proximity to coast and parks
    if (!suburb.latitude || !suburb.longitude) {
      return { score: 5.0, hasData: false }
    }

    // Bonus for coastal proximity (many WA suburbs value beach access)
    const distanceFromCoast = Math.abs(suburb.longitude - 115.75) * 111 // Rough coast longitude
    const coastalBonus = Math.max(0, 2 - (distanceFromCoast / 10)) // Up to +2 points for coastal

    const baseRecreationScore = 4.0 + Math.random() * 4.0 + coastalBonus

    return {
      score: Math.max(1, Math.min(10, baseRecreationScore)),
      hasData: false // Mock data
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

    if (availability.hasTransportData) confidence += 0.40    // 40% for transport data
    if (availability.hasShoppingData) confidence += 0.25     // 25% for shopping data
    if (availability.hasEducationData) confidence += 0.20    // 20% for education data
    if (availability.hasRecreationData) confidence += 0.15   // 15% for recreation data

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

    // Generate recommendation level
    let recommendation: CombinedSuburbRating['recommendation']
    if (overallScore >= 8) {
      recommendation = {
        level: 'Excellent',
        color: 'green',
        description: 'Outstanding investment opportunity with high safety and excellent convenience'
      }
    } else if (overallScore >= 6.5) {
      recommendation = {
        level: 'Good',
        color: 'blue',
        description: 'Solid investment choice with good safety and convenience balance'
      }
    } else if (overallScore >= 5) {
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
/**
 * Crime Score Service
 * Focuses purely on crime data and neighboring crime influence
 * Higher scores indicate worse crime (opposite of safety rating)
 */

import { waSuburbLoader, type EnhancedSuburb } from './wa-suburb-loader'
import { waPoliceCrimeService } from './wa-police-crime-service'
import { absCensusService } from './abs-census-service'
import type { CrimeData, CrimeScore, CensusData } from '../types'

// Legacy interface for backward compatibility
export interface SafetyRating {
  suburbCode: string
  suburbName: string
  overallRating: number // 1-10 scale (legacy)
  components: {
    crimeRating: number
    demographicRating: number
    neighborhoodRating: number
    trendRating: number
  }
  confidence: number
  lastUpdated: Date
  dataAvailability: {
    hasCensusData: boolean
    hasCrimeData: boolean
    hasNeighborData: boolean
  }
}

export interface CrimeSeverityData {
  totalOffenses: number
  crimeRate: number // per 1000 population
  severityScore: number // weighted by crime types
  categories: {
    violent: number
    property: number
    drug: number
    traffic: number
    publicOrder: number
  }
}

class CrimeScoreService {
  /**
   * Calculate crime score for a suburb (higher = worse crime)
   */
  async calculateCrimeScore(salCode: string): Promise<CrimeScore | null> {
    const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
    if (!suburb) {
      console.warn(`Suburb not found: ${salCode}`)
      return null
    }

    try {
      // Gather crime data only
      const crimeData = await waPoliceCrimeService.getCrimeDataForSuburb(salCode)

      // Calculate individual components (crime-focused only)
      const directCrimeScore = this.calculateDirectCrimeScore(crimeData)
      const neighborhoodCrimeScore = await this.calculateNeighborhoodCrimeScore(suburb)

      // Crime score calculation (higher = worse)
      const overallScore = (
        directCrimeScore * 0.70 +        // 70% direct crime data
        neighborhoodCrimeScore * 0.30    // 30% neighboring crime influence
      )

      // DEBUG: Log component scores
      console.log(`Crime Score components - Direct: ${directCrimeScore}, Neighborhood: ${neighborhoodCrimeScore}, Overall: ${overallScore}`)

      // Calculate confidence based on crime data availability
      const confidence = this.calculateCrimeConfidence({
        hasCrimeData: !!crimeData,
        hasNeighborData: true // Always available from geographic data
      })

      const crimeScore: CrimeScore = {
        overallScore: Math.max(1, Math.min(10, overallScore)), // 1-10 scale (higher = worse)
        confidence,
        components: {
          directCrimeScore,
          neighborhoodCrimeScore
        },
        explanation: {
          crimeSummary: this.generateCrimeSummary(crimeData),
          neighborhoodSummary: `Neighboring area influence: ${neighborhoodCrimeScore.toFixed(1)}/10`
        }
      }

      return crimeScore

    } catch (error) {
      console.error(`Error calculating crime score for ${salCode}:`, error)
      return null
    }
  }

  /**
   * Calculate direct crime score (70% of total)
   * Higher scores = MORE CRIME (opposite of safety rating)
   */
  private calculateDirectCrimeScore(crimeData: CrimeData | null): number {
    if (!crimeData) {
      // Return middle score if no data available
      console.log(`Missing crime data`)
      return 5.5
    }

    // Base calculation on crime rate per 1000 population
    const crimeRate = crimeData.crimeRate

    // DEBUG: Log crime rate for debugging
    console.log(`Crime rate for suburb: ${crimeRate}`)

    // IMPROVED: Better distribution across 1-10 scale with more granularity
    let rating: number

    if (crimeRate <= 15) {
      rating = 1 + crimeRate / 15 // 1-2 for very low crime (SAFEST areas like Wheatbelt)
    } else if (crimeRate <= 25) {
      rating = 2 + (crimeRate - 15) / 10 * 1 // 2-3 for low crime (safe suburbs)
    } else if (crimeRate <= 35) {
      rating = 3 + (crimeRate - 25) / 10 * 1 // 3-4 for below average crime
    } else if (crimeRate <= 50) {
      rating = 4 + (crimeRate - 35) / 15 * 2 // 4-6 for average crime (most Perth suburbs)
    } else if (crimeRate <= 70) {
      rating = 6 + (crimeRate - 50) / 20 * 2 // 6-8 for above average crime
    } else if (crimeRate <= 100) {
      rating = 8 + (crimeRate - 70) / 30 * 1.5 // 8-9.5 for high crime (mining towns)
    } else {
      rating = Math.min(10, 9.5 + (crimeRate - 100) / 50 * 0.5) // 9.5-10 for extreme crime
    }

    // Reduce violent crime multiplier to be less aggressive
    const violentCrimes = crimeData.categories.assault + (crimeData.categories.other * 0.1)
    const violentRate = (violentCrimes / crimeData.totalOffenses) * 100

    // DEBUG: Log violent rate
    console.log(`Violent rate: ${violentRate}%`)

    if (violentRate > 25) {
      rating *= 1.15 // Increase score by 15% for very high violent crime
    } else if (violentRate > 15) {
      rating *= 1.08 // Increase score by 8% for moderate violent crime
    }

    const finalRating = Math.max(1, Math.min(10, rating))
    console.log(`Final crime rating: ${finalRating}`)

    return finalRating
  }

  /**
   * Calculate demographic-based safety rating (25% of total)
   */
  private calculateDemographicRating(censusData: CensusData | null, suburb: EnhancedSuburb): number {
    if (!censusData) {
      // Use suburb classification as fallback
      const classificationRatings: Record<string, number> = {
        'Urban': 7,
        'Suburban': 8,
        'Coastal': 8.5,
        'Regional Town': 7.5,
        'Rural': 8,
        'Remote': 6.5,
        'Mining': 6
      }
      return classificationRatings[suburb.classification_type] || 7
    }

    let rating = 5 // Base rating

    // Income factor (higher income = generally safer)
    const income = censusData.medianHouseholdIncome
    if (income > 120000) {
      rating += 2
    } else if (income > 80000) {
      rating += 1
    } else if (income < 40000) {
      rating -= 1.5
    } else if (income < 60000) {
      rating -= 0.5
    }

    // Age factor (stable age demographics = safer)
    const medianAge = censusData.medianAge
    if (medianAge >= 35 && medianAge <= 55) {
      rating += 0.5 // Stable family demographics
    } else if (medianAge < 25) {
      rating -= 0.5 // Younger demographics may correlate with more activity
    }

    // Education factor (higher education = generally safer)
    const highEducation = censusData.educationLevel.bachelor + censusData.educationLevel.postgraduate
    if (highEducation > 50) {
      rating += 0.5
    } else if (highEducation < 20) {
      rating -= 0.5
    }

    // Employment factor (lower unemployment = safer)
    const unemploymentRate = censusData.unemploymentRate
    if (unemploymentRate < 3) {
      rating += 0.5
    } else if (unemploymentRate > 8) {
      rating -= 1
    } else if (unemploymentRate > 5) {
      rating -= 0.5
    }

    // Housing stability factor
    const couples = censusData.householdComposition.couples
    const houses = censusData.dwellingTypes.houses
    if (couples > 50 && houses > 60) {
      rating += 0.5 // Stable family housing
    }

    return Math.max(1, Math.min(10, rating))
  }

  /**
   * Calculate neighborhood influence rating (30% of total)
   * CORRECTED: Lower scores = SAFER neighborhoods, Higher scores = MORE DANGEROUS neighborhoods
   */
  private async calculateNeighborhoodCrimeScore(suburb: EnhancedSuburb): Promise<number> {
    // Get nearby suburbs within 20km
    const neighbors = waSuburbLoader.getSuburbsNearCoordinates(
      suburb.latitude,
      suburb.longitude,
      20,  // 20km radius
      10   // limit to 10 neighbors
    )

    if (neighbors.length <= 1) {
      return 5.5 // Neutral rating if no neighbors found
    }

    // Calculate average of neighbor characteristics
    let neighborhoodScore = 0
    let count = 0

    for (const neighbor of neighbors) {
      if (neighbor.sal_code === suburb.sal_code) continue // Skip self

      // CORRECTED: Lower scores for safer areas, higher scores for more dangerous areas
      let score = 5

      // Economic base influences (lower scores for safer economic bases)
      if (neighbor.economic_base.includes('Finance')) score -= 1.5    // Financial areas are safer
      if (neighbor.economic_base.includes('Services')) score -= 0.5   // Service areas are safer
      if (neighbor.economic_base.includes('Tourism')) score -= 0.5    // Tourism areas are safer
      if (neighbor.economic_base.includes('Mining')) score += 1       // Mining areas more dangerous

      // Classification influences (INVERTED: lower scores for safer areas)
      const classificationScores: Record<string, number> = {
        'Suburban': 2.5,      // Safest (was 8.5)
        'Rural': 3,           // Very safe (was 8)
        'Coastal': 3.5,       // Safe (was 8)
        'Regional Town': 4.5, // Moderate (was 7.5)
        'Urban': 6,           // More dangerous (was 7)
        'Mining': 7.5,        // Dangerous (was 6.5)
        'Remote': 8           // Most dangerous (was 6)
      }

      score = classificationScores[neighbor.classification_type] || 5

      neighborhoodScore += score
      count++
    }

    const avgNeighborRating = count > 0 ? neighborhoodScore / count : 5.5

    // Since demographic rating is now 0% weight, just use neighborhood rating
    return Math.max(1, Math.min(10, avgNeighborRating))
  }

  /**
   * Calculate trend-based rating (10% of total)
   */
  private calculateTrendRating(crimeData: CrimeData | null): number {
    if (!crimeData || !crimeData.trend) {
      return 6 // Neutral if no trend data
    }

    switch (crimeData.trend) {
      case 'decreasing':
        return 8.5 // Improving safety
      case 'stable':
        return 7   // Stable safety
      case 'increasing':
        return 4.5 // Declining safety
      default:
        return 6   // Unknown trend
    }
  }


  /**
   * Calculate confidence score based on data availability
   */
  private calculateConfidence(availability: {
    hasCensusData: boolean
    hasCrimeData: boolean
    hasNeighborData: boolean
    hasHistoricalData: boolean
  }): number {
    let confidence = 0

    if (availability.hasCensusData) confidence += 0.45    // 45% for census data
    if (availability.hasCrimeData) confidence += 0.45     // 45% for crime data (increased from 35%)
    if (availability.hasNeighborData) confidence += 0.05  // 5% for neighborhood data (reduced from 15%)
    if (availability.hasHistoricalData) confidence += 0.05 // 5% for historical trends

    return Math.max(0.3, confidence) // Minimum 30% confidence
  }

  /**
   * Calculate safety ratings for multiple suburbs
   */
  async calculateBatchSafetyRatings(salCodes: string[]): Promise<SafetyRating[]> {
    const batchSize = 5
    const results: SafetyRating[] = []

    for (let i = 0; i < salCodes.length; i += batchSize) {
      const batch = salCodes.slice(i, i + batchSize)
      const batchPromises = batch.map(code => this.calculateSafetyRating(code))
      const batchResults = await Promise.all(batchPromises)

      results.push(...batchResults.filter(r => r !== null) as SafetyRating[])
    }

    return results
  }

  /**
   * Calculate confidence for crime score (crime data focused)
   */
  private calculateCrimeConfidence(availability: {
    hasCrimeData: boolean
    hasNeighborData: boolean
  }): number {
    let confidence = 0

    if (availability.hasCrimeData) confidence += 0.80     // 80% for crime data
    if (availability.hasNeighborData) confidence += 0.20  // 20% for neighborhood data

    return Math.max(0.3, confidence) // Minimum 30% confidence
  }

  /**
   * Generate crime summary explanation
   */
  private generateCrimeSummary(crimeData: CrimeData | null): string {
    if (!crimeData) return "No crime data available"

    const rate = crimeData.crimeRate
    if (rate <= 25) return `Very low crime area (${rate.toFixed(1)} per 1000)`
    if (rate <= 35) return `Low crime area (${rate.toFixed(1)} per 1000)`
    if (rate <= 50) return `Moderate crime area (${rate.toFixed(1)} per 1000)`
    if (rate <= 65) return `Higher crime area (${rate.toFixed(1)} per 1000)`
    return `High crime area (${rate.toFixed(1)} per 1000)`
  }

  /**
   * Legacy method for backward compatibility
   */
  async calculateSafetyRating(salCode: string): Promise<SafetyRating | null> {
    const crimeScore = await this.calculateCrimeScore(salCode)
    if (!crimeScore) return null

    const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
    if (!suburb) return null

    // Get real census data for demographic calculation
    let censusData: CensusData | null = null
    let hasCensusData = false

    try {
      censusData = await absCensusService.getCensusDataForSuburb(salCode, 2021)
      hasCensusData = censusData !== null
      console.log(`Census data for ${salCode}: ${hasCensusData ? `population ${censusData.population}` : 'not available'}`)
    } catch (error) {
      console.warn(`Error getting census data for ${salCode}:`, error)
    }

    // Calculate real demographic rating using census data
    const demographicRating = this.calculateDemographicRating(censusData, suburb)

    // Calculate enhanced trend rating based on crime data
    const crimeData = await waPoliceCrimeService.getCrimeDataForSuburb(salCode)
    const trendRating = this.calculateTrendRating(crimeData)

    // Convert crime score to legacy safety rating format
    return {
      suburbCode: salCode,
      suburbName: suburb.sal_name,
      overallRating: 11 - crimeScore.overallScore, // Invert for safety rating
      components: {
        crimeRating: 11 - crimeScore.components.directCrimeScore,
        demographicRating,
        neighborhoodRating: 11 - crimeScore.components.neighborhoodCrimeScore,
        trendRating
      },
      confidence: crimeScore.confidence,
      lastUpdated: new Date(),
      dataAvailability: {
        hasCensusData,
        hasCrimeData: true,
        hasNeighborData: true
      }
    }
  }
}

// Export singleton instance (legacy name for backward compatibility)
export const safetyRatingService = new CrimeScoreService()

// New crime score service export
export const crimeScoreService = new CrimeScoreService()

// Export convenience functions
export const calculateSuburbSafety = (salCode: string) =>
  safetyRatingService.calculateSafetyRating(salCode)

export const calculateSuburbCrimeScore = (salCode: string) =>
  crimeScoreService.calculateCrimeScore(salCode)

export const calculateBatchSafety = (salCodes: string[]) =>
  safetyRatingService.calculateBatchSafetyRatings(salCodes)
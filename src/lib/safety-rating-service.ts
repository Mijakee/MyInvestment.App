/**
 * Comprehensive Safety Rating Service
 * Integrates Census, Crime, and Geographic data for suburb safety analysis
 */

import { waSuburbLoader, type EnhancedSuburb } from './wa-suburb-loader'
import { absCensusService } from './abs-census-service'
import { waPoliceCrimeService } from './wa-police-crime-service'
// Transport accessibility moved to separate convenience service
import type { CensusData, CrimeData } from '../types'

export interface SafetyRating {
  suburbCode: string
  suburbName: string
  overallRating: number // 1-10 scale
  components: {
    crimeRating: number      // 50% weight (restored)
    demographicRating: number // 25% weight
    neighborhoodRating: number // 15% weight
    trendRating: number       // 10% weight (restored)
  }
  confidence: number // 0-1 scale
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

class SafetyRatingService {
  /**
   * Calculate comprehensive safety rating for a suburb
   */
  async calculateSafetyRating(salCode: string): Promise<SafetyRating | null> {
    const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
    if (!suburb) {
      console.warn(`Suburb not found: ${salCode}`)
      return null
    }

    try {
      // Gather all data sources
      const [censusData, crimeData] = await Promise.all([
        absCensusService.getCensusDataForSuburb(salCode, 2021),
        waPoliceCrimeService.getCrimeDataForSuburb(salCode) // Now uses real WA Police data
      ])

      // Calculate individual components
      const crimeRating = this.calculateCrimeRating(crimeData, censusData)
      const demographicRating = this.calculateDemographicRating(censusData, suburb)
      const neighborhoodRating = await this.calculateNeighborhoodRating(suburb)
      const trendRating = this.calculateTrendRating(crimeData)

      // Weighted overall rating (total = 100%)
      const overallRating = (
        crimeRating * 0.50 +        // 50% crime impact (primary factor)
        demographicRating * 0.25 +  // 25% demographics
        neighborhoodRating * 0.15 + // 15% neighborhood
        trendRating * 0.10          // 10% trends
      )

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence({
        hasCensusData: !!censusData,
        hasCrimeData: !!crimeData,
        hasNeighborData: true, // Always available from geographic data
        hasHistoricalData: false // TODO: Add historical data
      })

      const safetyRating: SafetyRating = {
        suburbCode: salCode,
        suburbName: suburb.sal_name,
        overallRating: Math.max(1, Math.min(10, overallRating)),
        components: {
          crimeRating,
          demographicRating,
          neighborhoodRating,
          trendRating
        },
        confidence,
        lastUpdated: new Date(),
        dataAvailability: {
          hasCensusData: !!censusData,
          hasCrimeData: !!crimeData,
          hasNeighborData: true
        }
      }

      return safetyRating

    } catch (error) {
      console.error(`Error calculating safety rating for ${salCode}:`, error)
      return null
    }
  }

  /**
   * Calculate crime-based safety rating (50% of total)
   */
  private calculateCrimeRating(crimeData: CrimeData | null, censusData: CensusData | null): number {
    if (!crimeData || !censusData) {
      // Return middle rating if no data available
      return 5.5
    }

    // Base calculation on crime rate per 1000 population
    const crimeRate = crimeData.crimeRate

    // WA baseline: ~30-50 crimes per 1000 people is average
    // Lower is better (higher safety rating)
    let rating: number

    if (crimeRate <= 20) {
      rating = 9 + (20 - crimeRate) / 20 // 9-10 for very low crime
    } else if (crimeRate <= 35) {
      rating = 7 + (35 - crimeRate) / 15 * 2 // 7-9 for low crime
    } else if (crimeRate <= 50) {
      rating = 5 + (50 - crimeRate) / 15 * 2 // 5-7 for average crime
    } else if (crimeRate <= 75) {
      rating = 3 + (75 - crimeRate) / 25 * 2 // 3-5 for high crime
    } else {
      rating = Math.max(1, 3 - (crimeRate - 75) / 25) // 1-3 for very high crime
    }

    // Adjust based on crime severity (violent crimes weighted more heavily)
    const violentCrimes = crimeData.categories.assault + (crimeData.categories.other * 0.1)
    const violentRate = (violentCrimes / crimeData.totalOffenses) * 100

    if (violentRate > 20) {
      rating *= 0.8 // Reduce rating by 20% for high violent crime
    } else if (violentRate > 10) {
      rating *= 0.9 // Reduce rating by 10% for moderate violent crime
    }

    return Math.max(1, Math.min(10, rating))
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
   * Calculate neighborhood influence rating (15% of total)
   */
  private async calculateNeighborhoodRating(suburb: EnhancedSuburb): Promise<number> {
    // Get nearby suburbs within 20km
    const neighbors = waSuburbLoader.getSuburbsNearCoordinates(
      suburb.latitude,
      suburb.longitude,
      20,  // 20km radius
      10   // limit to 10 neighbors
    )

    if (neighbors.length <= 1) {
      return 7 // Neutral rating if no neighbors found
    }

    // Calculate average of neighbor characteristics
    let neighborhoodScore = 0
    let count = 0

    for (const neighbor of neighbors) {
      if (neighbor.sal_code === suburb.sal_code) continue // Skip self

      // Weight by economic base and classification
      let score = 5

      // Economic base influences
      if (neighbor.economic_base.includes('Mining')) score += 1
      if (neighbor.economic_base.includes('Tourism')) score += 0.5
      if (neighbor.economic_base.includes('Services')) score += 0.5
      if (neighbor.economic_base.includes('Finance')) score += 1

      // Classification influences
      const classificationScores: Record<string, number> = {
        'Urban': 7,
        'Suburban': 8.5,
        'Coastal': 8,
        'Regional Town': 7.5,
        'Rural': 8,
        'Remote': 6,
        'Mining': 6.5
      }

      score = classificationScores[neighbor.classification_type] || 7

      neighborhoodScore += score
      count++
    }

    const avgNeighborRating = count > 0 ? neighborhoodScore / count : 7

    // Blend with own suburb characteristics (70% neighbors, 30% self)
    const ownScore = this.calculateDemographicRating(null, suburb)

    return (avgNeighborRating * 0.7) + (ownScore * 0.3)
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
    if (availability.hasCrimeData) confidence += 0.35     // 35% for crime data
    if (availability.hasNeighborData) confidence += 0.15  // 15% for neighborhood data
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
}

// Export singleton instance
export const safetyRatingService = new SafetyRatingService()

// Export convenience functions
export const calculateSuburbSafety = (salCode: string) =>
  safetyRatingService.calculateSafetyRating(salCode)

export const calculateBatchSafety = (salCodes: string[]) =>
  safetyRatingService.calculateBatchSafetyRatings(salCodes)
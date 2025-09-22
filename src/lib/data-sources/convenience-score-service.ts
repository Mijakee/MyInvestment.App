/**
 * Convenience Score Service
 * Calculates livability and convenience scores separate from safety ratings
 * Focuses on daily life convenience: transport, shopping, education, recreation
 */

import { waSuburbLoader, type EnhancedSuburb } from '../wa-suburb-loader'
import { staticConvenienceParser, type ConvenienceScore as StaticConvenienceScore } from '../static-convenience-parser'

export interface ConvenienceScore {
  suburbCode: string
  suburbName: string
  overallScore: number // 1-10 scale
  components: {
    transport: {
      score: number
      nearbyStops: number
    }
    shopping: {
      score: number
      nearbyFacilities: number
    }
    education: {
      score: number
      nearbySchools: number
    }
    medical: {
      score: number
      nearbyFacilities: number
    }
    recreation: {
      score: number
      nearbyFacilities: number
    }
  }
  confidence: number // 0-1 scale
  lastUpdated: Date
  explanation: {
    transportSummary: string
    educationSummary: string
    healthSummary: string
    recreationSummary: string
    shoppingSummary: string
  }
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
   * Calculate comprehensive convenience score for a suburb using static data
   */
  async calculateConvenienceScore(latitude: number, longitude: number): Promise<ConvenienceScore | null> {
    try {
      // Use static convenience parser for all calculations
      const staticScore = await staticConvenienceParser.calculateConvenienceScore(latitude, longitude)

      // Find suburb info for metadata
      const suburb = waSuburbLoader.getSuburbsNearCoordinates(latitude, longitude, 1, 1)[0]
      const suburbName = suburb?.sal_name || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      const suburbCode = suburb?.sal_code || 'UNKNOWN'

      // Convert static score format to convenience score format
      const convenienceScore: ConvenienceScore = {
        suburbCode,
        suburbName,
        overallScore: staticScore.overallScore,
        components: {
          transport: {
            score: staticScore.components.transport.score,
            nearbyStops: staticScore.components.transport.nearbyStops
          },
          shopping: {
            score: staticScore.components.shopping.score,
            nearbyFacilities: staticScore.components.shopping.nearbyFacilities
          },
          education: {
            score: staticScore.components.education.score,
            nearbySchools: staticScore.components.education.nearbySchools
          },
          medical: {
            score: staticScore.components.health.score,
            nearbyFacilities: staticScore.components.health.nearbyFacilities
          },
          recreation: {
            score: staticScore.components.recreation.score,
            nearbyFacilities: staticScore.components.recreation.nearbyFacilities
          }
        },
        confidence: staticScore.confidence,
        lastUpdated: new Date(),
        explanation: staticScore.explanation
      }

      return convenienceScore

    } catch (error) {
      console.error(`Error calculating convenience score for coordinates (${latitude}, ${longitude}):`, error)
      return null
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async calculateConvenienceScoreForSuburb(salCode: string): Promise<ConvenienceScore | null> {
    const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
    if (!suburb) {
      console.warn(`Suburb not found: ${salCode}`)
      return null
    }

    return this.calculateConvenienceScore(suburb.latitude, suburb.longitude)
  }


  /**
   * Combine safety rating with convenience score for investment recommendation
   */
  async calculateCombinedRating(
    salCode: string,
    safetyRating: number
  ): Promise<CombinedSuburbRating | null> {
    const convenienceScore = await this.calculateConvenienceScoreForSuburb(salCode)
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
    const batchSize = 10 // Larger batches since using static data now
    const results: ConvenienceScore[] = []

    for (let i = 0; i < salCodes.length; i += batchSize) {
      const batch = salCodes.slice(i, i + batchSize)
      const batchPromises = batch.map(code => this.calculateConvenienceScoreForSuburb(code))
      const batchResults = await Promise.all(batchPromises)

      results.push(...batchResults.filter(result => result !== null) as ConvenienceScore[])

      // Smaller delay since using static data
      if (i + batchSize < salCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }
}

// Export singleton instance
export const convenienceScoreService = new ConvenienceScoreService()
export default convenienceScoreService
/**
 * Precomputed Data Service
 * Fast lookups for pre-calculated suburb scores using static JSON data
 * No external API calls, no real-time calculations
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { waSuburbLoader } from './wa-suburb-loader'

export interface PrecomputedSuburbScore {
  sal_code: string
  sal_name: string
  coordinates: {
    latitude: number
    longitude: number
  }
  scores: {
    safety: number
    crime: number
    convenience: number
    investment: number
  }
  raw_data: {
    crime_stats?: any
    transport_stops?: number
    shopping_facilities?: number
    schools?: number
    health_facilities?: number
  }
  metadata: {
    last_calculated: string
    data_quality: 'high' | 'medium' | 'low'
    confidence: number
  }
}

export interface PrecomputedDataFile {
  _metadata: {
    version: string
    last_updated: string
    total_suburbs: number
    data_sources: Record<string, string>
    calculation_method: string
    next_update_due: string
  }
  suburbs: Record<string, PrecomputedSuburbScore>
}

class PrecomputedDataService {
  private readonly DATA_FILE_PATH = join(process.cwd(), 'src/data/precomputed-suburb-scores.json')
  private cachedData: PrecomputedDataFile | null = null

  /**
   * Load precomputed data (with caching)
   */
  private loadData(): PrecomputedDataFile {
    if (this.cachedData) {
      return this.cachedData
    }

    if (!existsSync(this.DATA_FILE_PATH)) {
      throw new Error('Precomputed suburb data not found. Run data update process first.')
    }

    try {
      const rawData = readFileSync(this.DATA_FILE_PATH, 'utf-8')
      this.cachedData = JSON.parse(rawData)
      console.log(`✅ Loaded precomputed data for ${this.cachedData?._metadata.total_suburbs} suburbs`)
      return this.cachedData!
    } catch (error) {
      throw new Error(`Failed to load precomputed suburb data: ${error}`)
    }
  }

  /**
   * Get suburb score by SAL code (ultra-fast lookup with fallback)
   */
  getSuburbScore(salCode: string): PrecomputedSuburbScore | null {
    const data = this.loadData()

    // Try precomputed data first
    if (data.suburbs[salCode]) {
      return data.suburbs[salCode]
    }

    // Fallback: Generate estimated scores for missing suburbs
    return this.generateEstimatedScore(salCode)
  }

  /**
   * Generate estimated scores for suburbs not in precomputed data
   */
  private generateEstimatedScore(salCode: string): PrecomputedSuburbScore | null {
    try {
      // Get suburb basic info
      const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
      if (!suburb) {
        return null
      }

      // Generate location-based estimates using simple heuristics
      const { latitude, longitude } = suburb

      // Regional scoring patterns (rough estimates)
      let baseSafety = 5.5
      let baseConvenience = 4.0

      // Perth metro area (higher convenience, varied safety)
      if (latitude > -32.5 && latitude < -31.4 && longitude > 115.5 && longitude < 116.2) {
        baseConvenience = 6.5
        baseSafety = 6.0
      }
      // Regional areas (lower convenience, potentially higher safety)
      else if (latitude < -33.5 || latitude > -31.0) {
        baseConvenience = 3.5
        baseSafety = 6.5
      }

      // Add some variation based on coordinates (pseudo-random but consistent)
      const coordSeed = Math.abs(latitude * 100 + longitude * 100) % 100
      const safetyVariation = (coordSeed % 20 - 10) / 10 // ±1.0
      const convenienceVariation = ((coordSeed * 7) % 20 - 10) / 10 // ±1.0

      const safety = Math.max(1, Math.min(10, baseSafety + safetyVariation))
      const convenience = Math.max(1, Math.min(10, baseConvenience + convenienceVariation))
      const crime = Math.max(1, Math.min(10, 11 - safety)) // Inverse of safety
      const investment = Math.round((safety * 0.6 + convenience * 0.4) * 10) / 10

      return {
        sal_code: suburb.sal_code,
        sal_name: suburb.sal_name,
        coordinates: {
          latitude: suburb.latitude,
          longitude: suburb.longitude
        },
        scores: {
          safety: Math.round(safety * 10) / 10,
          crime: Math.round(crime * 10) / 10,
          convenience: Math.round(convenience * 10) / 10,
          investment: investment
        },
        raw_data: {
          transport_stops: Math.floor(convenience * 2), // Estimate
          shopping_facilities: Math.floor(convenience * 1.5), // Estimate
          schools: Math.floor(convenience * 0.8), // Estimate
          health_facilities: Math.floor(convenience * 0.5) // Estimate
        },
        metadata: {
          last_calculated: new Date().toISOString(),
          data_quality: 'low', // Estimated data
          confidence: 0.3 // Low confidence for estimates
        }
      }
    } catch (error) {
      console.warn(`Failed to generate estimated score for ${salCode}:`, error)
      return null
    }
  }

  /**
   * Get all suburb scores (precomputed only)
   */
  getAllSuburbScores(): PrecomputedSuburbScore[] {
    const data = this.loadData()
    return Object.values(data.suburbs)
  }

  /**
   * Get all suburb scores including estimated data for missing suburbs
   * (Use this for heatmap and comprehensive coverage)
   */
  getAllSuburbScoresWithFallback(): PrecomputedSuburbScore[] {
    const precomputedSuburbs = this.getAllSuburbScores()
    const allSuburbs = waSuburbLoader.getAllSuburbs()

    const result: PrecomputedSuburbScore[] = []
    const precomputedCodes = new Set(precomputedSuburbs.map(s => s.sal_code))

    // Add all precomputed suburbs first
    result.push(...precomputedSuburbs)

    // Add estimated scores for missing suburbs
    for (const suburb of allSuburbs) {
      if (!precomputedCodes.has(suburb.sal_code)) {
        const estimated = this.generateEstimatedScore(suburb.sal_code)
        if (estimated) {
          result.push(estimated)
        }
      }
    }

    return result
  }

  /**
   * Get suburbs by score range
   */
  getSuburbsByScoreRange(metric: 'safety' | 'crime' | 'convenience' | 'investment', min: number, max: number): PrecomputedSuburbScore[] {
    const allSuburbs = this.getAllSuburbScores()
    return allSuburbs.filter(suburb => {
      const score = suburb.scores[metric]
      return score >= min && score <= max
    })
  }

  /**
   * Get data freshness information
   */
  getDataInfo() {
    const data = this.loadData()
    const lastUpdated = new Date(data._metadata.last_updated)
    const nextUpdate = new Date(data._metadata.next_update_due)
    const now = new Date()

    return {
      metadata: data._metadata,
      freshness: {
        last_updated: lastUpdated,
        next_update_due: nextUpdate,
        days_since_update: Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)),
        is_stale: now > nextUpdate
      }
    }
  }

  /**
   * Get statistics about the dataset
   */
  getDataStatistics() {
    const allSuburbs = this.getAllSuburbScores()

    const safetyScores = allSuburbs.map(s => s.scores.safety)
    const crimeScores = allSuburbs.map(s => s.scores.crime)
    const convenienceScores = allSuburbs.map(s => s.scores.convenience)
    const investmentScores = allSuburbs.map(s => s.scores.investment)

    return {
      total_suburbs: allSuburbs.length,
      averages: {
        safety: this.average(safetyScores),
        crime: this.average(crimeScores),
        convenience: this.average(convenienceScores),
        investment: this.average(investmentScores)
      },
      ranges: {
        safety: { min: Math.min(...safetyScores), max: Math.max(...safetyScores) },
        crime: { min: Math.min(...crimeScores), max: Math.max(...crimeScores) },
        convenience: { min: Math.min(...convenienceScores), max: Math.max(...convenienceScores) },
        investment: { min: Math.min(...investmentScores), max: Math.max(...investmentScores) }
      },
      quality_distribution: {
        high: allSuburbs.filter(s => s.metadata.data_quality === 'high').length,
        medium: allSuburbs.filter(s => s.metadata.data_quality === 'medium').length,
        low: allSuburbs.filter(s => s.metadata.data_quality === 'low').length
      }
    }
  }

  /**
   * Search suburbs by name
   */
  searchSuburbs(query: string): PrecomputedSuburbScore[] {
    const allSuburbs = this.getAllSuburbScores()
    const searchTerm = query.toLowerCase()

    return allSuburbs.filter(suburb =>
      suburb.sal_name.toLowerCase().includes(searchTerm)
    ).sort((a, b) => a.sal_name.localeCompare(b.sal_name))
  }

  private average(numbers: number[]): number {
    return Math.round((numbers.reduce((sum, num) => sum + num, 0) / numbers.length) * 10) / 10
  }
}

// Export singleton instance
export const precomputedDataService = new PrecomputedDataService()
export default precomputedDataService
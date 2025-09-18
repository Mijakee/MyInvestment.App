/**
 * Heat Map Data Service
 * Generates and manages heat map data for safety and convenience visualization
 */

import { waSuburbLoader } from './wa-suburb-loader'
import { safetyRatingService } from './safety-rating-service'
import { convenienceScoreService } from './convenience-score-service'

export interface HeatMapPoint {
  lat: number
  lng: number
  safetyRating: number
  convenienceScore: number
  combinedScore: number
  safetyIntensity: number    // 0-1 scale for safety heat visualization
  convenienceIntensity: number // 0-1 scale for convenience heat visualization
  combinedIntensity: number  // 0-1 scale for combined investment heat
  suburbName: string
  salCode: string
}

export interface HeatMapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface HeatMapDataset {
  points: HeatMapPoint[]
  bounds: HeatMapBounds
  statistics: {
    totalSuburbs: number
    averageSafety: number
    averageConvenience: number
    averageCombined: number
    safetyRange: { min: number; max: number }
    convenienceRange: { min: number; max: number }
    combinedRange: { min: number; max: number }
  }
  lastUpdated: Date
}

class HeatMapDataService {
  private cachedHeatMapData: HeatMapDataset | null = null
  private lastCacheTime: Date | null = null
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Generate complete heat map dataset for all WA suburbs
   */
  async generateHeatMapData(): Promise<HeatMapDataset> {
    // Check cache first
    if (this.cachedHeatMapData && this.lastCacheTime) {
      const cacheAge = Date.now() - this.lastCacheTime.getTime()
      if (cacheAge < this.CACHE_DURATION_MS) {
        return this.cachedHeatMapData
      }
    }

    console.log('Generating heat map data for all WA suburbs...')
    const startTime = Date.now()

    const suburbs = waSuburbLoader.getAllSuburbs()
    const heatMapPoints: HeatMapPoint[] = []
    const batchSize = 50 // Process in batches to avoid memory issues

    // Process suburbs in batches
    for (let i = 0; i < suburbs.length; i += batchSize) {
      const batch = suburbs.slice(i, i + batchSize)
      const batchPromises = batch.map(suburb => this.generateSuburbHeatPoint(suburb.sal_code))
      const batchResults = await Promise.all(batchPromises)

      // Add successful results to heat map
      heatMapPoints.push(...batchResults.filter(point => point !== null) as HeatMapPoint[])

      // Progress logging
      if ((i + batchSize) % 200 === 0) {
        console.log(`Processed ${Math.min(i + batchSize, suburbs.length)}/${suburbs.length} suburbs`)
      }
    }

    // Calculate statistics and bounds
    const statistics = this.calculateHeatMapStatistics(heatMapPoints)
    const bounds = this.calculateHeatMapBounds(heatMapPoints)

    const heatMapDataset: HeatMapDataset = {
      points: heatMapPoints,
      bounds,
      statistics,
      lastUpdated: new Date()
    }

    // Cache the result
    this.cachedHeatMapData = heatMapDataset
    this.lastCacheTime = new Date()

    const processingTime = (Date.now() - startTime) / 1000
    console.log(`Heat map generation completed: ${heatMapPoints.length} points in ${processingTime}s`)

    return heatMapDataset
  }

  /**
   * Generate heat map point for a single suburb
   */
  private async generateSuburbHeatPoint(salCode: string): Promise<HeatMapPoint | null> {
    try {
      const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
      if (!suburb || !suburb.latitude || !suburb.longitude) {
        return null
      }

      // Calculate ratings (with fallback to avoid blocking entire dataset)
      let safetyRating = 5.0
      let convenienceScore = 5.0

      try {
        const safety = await safetyRatingService.calculateSafetyRating(salCode)
        if (safety) safetyRating = safety.overallRating
      } catch (error) {
        console.warn(`Failed to calculate safety rating for ${salCode}:`, error)
      }

      try {
        const convenience = await convenienceScoreService.calculateConvenienceScore(salCode)
        if (convenience) convenienceScore = convenience.overallScore
      } catch (error) {
        console.warn(`Failed to calculate convenience score for ${salCode}:`, error)
      }

      // Calculate combined investment score
      const combinedScore = (safetyRating * 0.60) + (convenienceScore * 0.40)

      // Convert to heat map intensities (0-1 scale)
      const safetyIntensity = this.normalizeToIntensity(safetyRating, 1, 10)
      const convenienceIntensity = this.normalizeToIntensity(convenienceScore, 1, 10)
      const combinedIntensity = this.normalizeToIntensity(combinedScore, 1, 10)

      return {
        lat: suburb.latitude,
        lng: suburb.longitude,
        safetyRating,
        convenienceScore,
        combinedScore,
        safetyIntensity,
        convenienceIntensity,
        combinedIntensity,
        suburbName: suburb.sal_name,
        salCode: suburb.sal_code
      }
    } catch (error) {
      console.error(`Error generating heat point for ${salCode}:`, error)
      return null
    }
  }

  /**
   * Filter heat map points by geographic bounds (for viewport optimization)
   */
  filterByBounds(points: HeatMapPoint[], bounds: HeatMapBounds): HeatMapPoint[] {
    return points.filter(point =>
      point.lat >= bounds.south &&
      point.lat <= bounds.north &&
      point.lng >= bounds.west &&
      point.lng <= bounds.east
    )
  }

  /**
   * Get heat map points for specific metric within bounds
   */
  getHeatMapForMetric(
    points: HeatMapPoint[],
    metric: 'safety' | 'convenience' | 'combined',
    bounds?: HeatMapBounds
  ): Array<{ lat: number; lng: number; intensity: number; suburbName: string }> {
    let filteredPoints = bounds ? this.filterByBounds(points, bounds) : points

    return filteredPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
      intensity: metric === 'safety' ? point.safetyIntensity :
                metric === 'convenience' ? point.convenienceIntensity :
                point.combinedIntensity,
      suburbName: point.suburbName
    }))
  }

  /**
   * Calculate heat map statistics
   */
  private calculateHeatMapStatistics(points: HeatMapPoint[]) {
    if (points.length === 0) {
      return {
        totalSuburbs: 0,
        averageSafety: 0,
        averageConvenience: 0,
        averageCombined: 0,
        safetyRange: { min: 0, max: 10 },
        convenienceRange: { min: 0, max: 10 },
        combinedRange: { min: 0, max: 10 }
      }
    }

    const safetyRatings = points.map(p => p.safetyRating)
    const convenienceScores = points.map(p => p.convenienceScore)
    const combinedScores = points.map(p => p.combinedScore)

    return {
      totalSuburbs: points.length,
      averageSafety: this.average(safetyRatings),
      averageConvenience: this.average(convenienceScores),
      averageCombined: this.average(combinedScores),
      safetyRange: { min: Math.min(...safetyRatings), max: Math.max(...safetyRatings) },
      convenienceRange: { min: Math.min(...convenienceScores), max: Math.max(...convenienceScores) },
      combinedRange: { min: Math.min(...combinedScores), max: Math.max(...combinedScores) }
    }
  }

  /**
   * Calculate geographic bounds for all points
   */
  private calculateHeatMapBounds(points: HeatMapPoint[]): HeatMapBounds {
    if (points.length === 0) {
      return { north: -25, south: -35, east: 130, west: 113 } // Default WA bounds
    }

    const latitudes = points.map(p => p.lat)
    const longitudes = points.map(p => p.lng)

    return {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes)
    }
  }

  /**
   * Normalize value to 0-1 intensity scale
   */
  private normalizeToIntensity(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)))
  }

  /**
   * Calculate average of number array
   */
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0
  }

  /**
   * Export heat map data to JSON for static hosting
   */
  async exportHeatMapData(): Promise<string> {
    const heatMapData = await this.generateHeatMapData()
    return JSON.stringify(heatMapData, null, 2)
  }

  /**
   * Get optimized heat map data for web client
   * Reduces data size by removing unnecessary fields for visualization
   */
  async getOptimizedHeatMapData(metric: 'safety' | 'convenience' | 'combined' = 'combined'): Promise<{
    points: Array<{ lat: number; lng: number; intensity: number; suburbName: string; safetyRating: number; convenienceScore: number; combinedScore: number }>,
    bounds: HeatMapBounds,
    statistics: any
  }> {
    const fullData = await this.generateHeatMapData()

    const optimizedPoints = fullData.points.map(point => ({
      lat: point.lat,
      lng: point.lng,
      intensity: metric === 'safety' ? point.safetyIntensity :
                metric === 'convenience' ? point.convenienceIntensity :
                point.combinedIntensity,
      suburbName: point.suburbName,
      safetyRating: point.safetyRating,
      convenienceScore: point.convenienceScore,
      combinedScore: point.combinedScore
    }))

    return {
      points: optimizedPoints,
      bounds: fullData.bounds,
      statistics: fullData.statistics
    }
  }
}

// Export singleton instance
export const heatMapDataService = new HeatMapDataService()
export default heatMapDataService
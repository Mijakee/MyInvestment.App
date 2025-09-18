/**
 * WA Suburb Database Loader
 * Loads and processes the 1,701 real WA suburbs from ABS SAL data
 */

import waSuburbsData from '../data/wa_suburbs_final.json'

export interface SA2Mapping {
  sa2_code: string
  sa2_name: string
  population_weight: number
  area_weight: number
  match_confidence: number
}

export interface EnhancedSuburb {
  sal_code: string
  sal_name: string
  state: string
  latitude: number
  longitude: number
  area_km2: number
  abs_area_km2: number
  sa2_mappings: SA2Mapping[]
  police_district: string
  police_mapping_confidence: number
  classification_type: string
  economic_base: string[]
  last_updated: string
  data_source: string
}

export interface WASuburbDatabase {
  metadata: {
    total_suburbs: number
    processing_date: string
    data_source: string
    version: string
    fixes_applied: string[]
    coverage: {
      sa2_mapped: number
      police_mapped: number
      sa2_percentage: number
      police_percentage: number
    }
  }
  suburbs: EnhancedSuburb[]
}

class WASuburbLoaderService {
  private data: WASuburbDatabase
  private suburbIndex: Map<string, EnhancedSuburb>
  private nameIndex: Map<string, EnhancedSuburb[]>

  constructor() {
    this.data = waSuburbsData as WASuburbDatabase
    this.suburbIndex = new Map()
    this.nameIndex = new Map()
    this.buildIndices()
  }

  private buildIndices() {
    console.log(`🏗️ Building indices for ${this.data.suburbs.length} suburbs...`)

    for (const suburb of this.data.suburbs) {
      // SAL code index
      this.suburbIndex.set(suburb.sal_code, suburb)

      // Name index (multiple suburbs can have same name)
      const normalizedName = suburb.sal_name.toLowerCase().trim()
      if (!this.nameIndex.has(normalizedName)) {
        this.nameIndex.set(normalizedName, [])
      }
      this.nameIndex.get(normalizedName)!.push(suburb)
    }

    console.log(`✅ Built indices: ${this.suburbIndex.size} SAL codes, ${this.nameIndex.size} unique names`)
  }

  /**
   * Get all WA suburbs
   */
  getAllSuburbs(): EnhancedSuburb[] {
    return this.data.suburbs
  }

  /**
   * Get suburbs with SA2 mapping for Census data integration
   */
  getSuburbsWithCensusMapping(): EnhancedSuburb[] {
    return this.data.suburbs.filter(suburb => suburb.sa2_mappings.length > 0)
  }

  /**
   * Get suburb by SAL code
   */
  getSuburbBySALCode(salCode: string): EnhancedSuburb | null {
    return this.suburbIndex.get(salCode) || null
  }

  /**
   * Apply new distance-based classification to all suburbs (analysis only)
   */
  applyNewClassification(): { summary: any, changes: any[] } {
    const perthCBD = { lat: -31.9523, lng: 115.8613 }

    const summary = {
      Urban: { current: 0, proposed: 0, changed: 0 },
      Suburban: { current: 0, proposed: 0, changed: 0 },
      Rural: { current: 0, proposed: 0, changed: 0 }
    }

    const changes: any[] = []
    let unchanged = 0

    for (const suburb of this.data.suburbs) {
      const lat = suburb.latitude
      const lng = suburb.longitude

      // Calculate distance from Perth CBD
      const distanceFromCBD = Math.sqrt(
        Math.pow((lat - perthCBD.lat) * 111, 2) +
        Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
      )

      // New classification logic
      const newClass = distanceFromCBD <= 10 ? 'Urban' :
                      distanceFromCBD <= 80 ? 'Suburban' : 'Rural'

      const oldClass = suburb.classification_type

      // Count current classifications
      if (summary[oldClass as keyof typeof summary]) {
        summary[oldClass as keyof typeof summary].current++
      }

      // Count proposed classifications
      summary[newClass].proposed++

      if (oldClass !== newClass) {
        // Count changes
        if (summary[oldClass as keyof typeof summary]) {
          summary[oldClass as keyof typeof summary].changed++
        }

        changes.push({
          sal_code: suburb.sal_code,
          sal_name: suburb.sal_name,
          old_classification: oldClass,
          new_classification: newClass,
          distance: Math.round(distanceFromCBD),
          reason: `${Math.round(distanceFromCBD)}km from Perth CBD`
        })
      } else {
        unchanged++
      }
    }

    return { summary, changes, unchanged, total: this.data.suburbs.length }
  }

  /**
   * Actually update the classification_type field for all suburbs
   */
  updateClassifications(): { updated: number, summary: any } {
    const perthCBD = { lat: -31.9523, lng: 115.8613 }
    let updated = 0

    const summary = {
      Urban: 0,
      Suburban: 0,
      Rural: 0
    }

    for (const suburb of this.data.suburbs) {
      const lat = suburb.latitude
      const lng = suburb.longitude

      // Calculate distance from Perth CBD
      const distanceFromCBD = Math.sqrt(
        Math.pow((lat - perthCBD.lat) * 111, 2) +
        Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
      )

      // New classification logic
      const newClass = distanceFromCBD <= 10 ? 'Urban' :
                      distanceFromCBD <= 80 ? 'Suburban' : 'Rural'

      // Update if different
      if (suburb.classification_type !== newClass) {
        suburb.classification_type = newClass
        updated++
      }

      // Count final classifications
      summary[newClass]++
    }

    return { updated, summary, total: this.data.suburbs.length }
  }

  /**
   * Search suburbs by name (fuzzy matching)
   */
  searchSuburbsByName(name: string, limit: number = 10): EnhancedSuburb[] {
    const normalizedSearch = name.toLowerCase().trim()
    const results: EnhancedSuburb[] = []

    // Exact match first
    const exactMatches = this.nameIndex.get(normalizedSearch) || []
    results.push(...exactMatches)

    if (results.length < limit) {
      // Partial matches
      for (const [suburbName, suburbs] of this.nameIndex) {
        if (suburbName.includes(normalizedSearch) && suburbName !== normalizedSearch) {
          results.push(...suburbs)
          if (results.length >= limit) break
        }
      }
    }

    return results.slice(0, limit)
  }

  /**
   * Get suburbs within radius of coordinates
   */
  getSuburbsNearCoordinates(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    limit: number = 20
  ): EnhancedSuburb[] {
    const results: Array<{ suburb: EnhancedSuburb; distance: number }> = []

    for (const suburb of this.data.suburbs) {
      const distance = this.calculateDistance(lat, lng, suburb.latitude, suburb.longitude)
      if (distance <= radiusKm) {
        results.push({ suburb, distance })
      }
    }

    // Sort by distance and return
    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(r => r.suburb)
  }

  /**
   * Filter suburbs by classification
   */
  getSuburbsByClassification(classification: string): EnhancedSuburb[] {
    return this.data.suburbs.filter(suburb =>
      suburb.classification_type === classification
    )
  }

  /**
   * Get suburbs by economic base
   */
  getSuburbsByEconomicBase(economicBase: string): EnhancedSuburb[] {
    return this.data.suburbs.filter(suburb =>
      suburb.economic_base.includes(economicBase)
    )
  }

  /**
   * Get statistics about the database
   */
  getStatistics() {
    const classifications = new Map<string, number>()
    const economicBases = new Map<string, number>()

    for (const suburb of this.data.suburbs) {
      // Classification counts
      classifications.set(
        suburb.classification_type,
        (classifications.get(suburb.classification_type) || 0) + 1
      )

      // Economic base counts
      for (const base of suburb.economic_base) {
        economicBases.set(base, (economicBases.get(base) || 0) + 1)
      }
    }

    return {
      metadata: this.data.metadata,
      total_suburbs: this.data.suburbs.length,
      classifications: Object.fromEntries(classifications),
      economic_bases: Object.fromEntries(economicBases),
      with_sa2_mapping: this.getSuburbsWithCensusMapping().length,
      mapping_coverage: {
        sa2_percentage: this.data.metadata.coverage.sa2_percentage,
        police_percentage: this.data.metadata.coverage.police_percentage
      }
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

// Singleton instance
export const waSuburbLoader = new WASuburbLoaderService()

// Export functions for convenience
export const getAllWASuburbs = () => waSuburbLoader.getAllSuburbs()
export const getWASuburbBySALCode = (code: string) => waSuburbLoader.getSuburbBySALCode(code)
export const searchWASuburbs = (name: string, limit?: number) => waSuburbLoader.searchSuburbsByName(name, limit)
export const getWASuburbsNear = (lat: number, lng: number, radius?: number, limit?: number) =>
  waSuburbLoader.getSuburbsNearCoordinates(lat, lng, radius, limit)
export const getWASuburbStats = () => waSuburbLoader.getStatistics()
export const getWASuburbsWithCensusData = () => waSuburbLoader.getSuburbsWithCensusMapping()
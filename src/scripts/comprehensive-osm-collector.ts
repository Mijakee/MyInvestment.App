/**
 * Comprehensive OSM Data Collector
 * Downloads ALL shopping centers, recreation facilities across Western Australia
 * Uses multiple query strategies to ensure complete coverage
 */

import fetch from 'node-fetch'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface OSMElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OSMResponse {
  version: number
  generator: string
  elements: OSMElement[]
}

interface ConveniencePoint {
  name: string
  latitude: number
  longitude: number
  type: string
  category: string
  suburb?: string
  postcode?: string
}

class ComprehensiveOSMCollector {
  private readonly baseURL = 'https://overpass-api.de/api/interpreter'
  private readonly outputDir = join(process.cwd(), 'src/data/convenience-data/osm-static')
  private readonly waBox = [-35.0, 113.0, -25.0, 129.0] // [south, west, north, east]

  constructor() {
    mkdirSync(this.outputDir, { recursive: true })
  }

  /**
   * Collect ALL shopping facilities in WA
   */
  async collectAllShoppingFacilities(): Promise<void> {
    console.log('🛒 Starting comprehensive shopping data collection for WA...')

    const queries = [
      // Major shopping centers and malls
      `[out:json][timeout:60];
       (
         way["shop"="mall"](bbox:${this.waBox.join(',')});
         way["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
         relation["shop"="mall"](bbox:${this.waBox.join(',')});
         relation["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
         node["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
         node["shop"="mall"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Supermarkets and large retail
      `[out:json][timeout:60];
       (
         node["shop"="supermarket"](bbox:${this.waBox.join(',')});
         way["shop"="supermarket"](bbox:${this.waBox.join(',')});
         node["shop"="department_store"](bbox:${this.waBox.join(',')});
         way["shop"="department_store"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Community shopping - convenience stores, local shops
      `[out:json][timeout:60];
       (
         node["shop"="convenience"](bbox:${this.waBox.join(',')});
         node["shop"="general"](bbox:${this.waBox.join(',')});
         node["amenity"="marketplace"](bbox:${this.waBox.join(',')});
         way["amenity"="marketplace"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Specialty retail areas
      `[out:json][timeout:60];
       (
         node["shop"~"^(clothes|shoes|electronics|furniture|books|pharmacy)$"](bbox:${this.waBox.join(',')});
         way["shop"~"^(clothes|shoes|electronics|furniture|books|pharmacy)$"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Hardware and automotive
      `[out:json][timeout:60];
       (
         node["shop"~"^(hardware|car|car_repair|fuel)$"](bbox:${this.waBox.join(',')});
         way["shop"~"^(hardware|car|car_repair|fuel)$"](bbox:${this.waBox.join(',')});
         node["amenity"="fuel"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const allShopping: ConveniencePoint[] = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`  📦 Fetching shopping batch ${i + 1}/${queries.length}...`)

      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' }
        })

        if (!response.ok) {
          console.warn(`  ⚠️  Query ${i + 1} failed with status ${response.status}`)
          await this.delayBetweenRequests()
          continue
        }

        const data = await response.json() as OSMResponse
        const points = this.parseOSMResponse(data, 'shopping')
        allShopping.push(...points)

        console.log(`  ✅ Found ${points.length} shopping facilities in batch ${i + 1}`)

        // Rate limiting between queries
        await this.delayBetweenRequests()

      } catch (error) {
        console.warn(`  ❌ Error in shopping query ${i + 1}:`, error)
        await this.delayBetweenRequests()
      }
    }

    // Remove duplicates based on coordinates (same facility might appear in multiple queries)
    const uniqueShopping = this.removeDuplicates(allShopping)

    // Save to file
    const outputFile = join(this.outputDir, 'shopping.json')
    writeFileSync(outputFile, JSON.stringify(uniqueShopping, null, 2))
    console.log(`✅ Saved ${uniqueShopping.length} unique shopping facilities to ${outputFile}`)
  }

  /**
   * Collect ALL recreation facilities in WA
   */
  async collectAllRecreationFacilities(): Promise<void> {
    console.log('🏃 Starting comprehensive recreation data collection for WA...')

    const queries = [
      // Parks and open spaces
      `[out:json][timeout:60];
       (
         way["leisure"="park"](bbox:${this.waBox.join(',')});
         relation["leisure"="park"](bbox:${this.waBox.join(',')});
         way["leisure"="playground"](bbox:${this.waBox.join(',')});
         node["leisure"="playground"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Sports and fitness facilities
      `[out:json][timeout:60];
       (
         way["leisure"~"^(sports_centre|stadium|pitch|swimming_pool|fitness_centre)$"](bbox:${this.waBox.join(',')});
         node["leisure"~"^(sports_centre|stadium|pitch|swimming_pool|fitness_centre)$"](bbox:${this.waBox.join(',')});
         way["sport"](bbox:${this.waBox.join(',')});
         node["sport"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Community and cultural facilities
      `[out:json][timeout:60];
       (
         way["amenity"~"^(community_centre|library|theatre|cinema)$"](bbox:${this.waBox.join(',')});
         node["amenity"~"^(community_centre|library|theatre|cinema)$"](bbox:${this.waBox.join(',')});
         way["tourism"~"^(museum|gallery|zoo|attraction)$"](bbox:${this.waBox.join(',')});
         node["tourism"~"^(museum|gallery|zoo|attraction)$"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Natural recreation areas
      `[out:json][timeout:60];
       (
         way["natural"~"^(beach|coastline)$"](bbox:${this.waBox.join(',')});
         way["leisure"~"^(nature_reserve|garden)$"](bbox:${this.waBox.join(',')});
         relation["leisure"~"^(nature_reserve|garden)$"](bbox:${this.waBox.join(',')});
         way["boundary"="national_park"](bbox:${this.waBox.join(',')});
         relation["boundary"="national_park"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const allRecreation: ConveniencePoint[] = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`  🏃 Fetching recreation batch ${i + 1}/${queries.length}...`)

      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' }
        })

        if (!response.ok) {
          console.warn(`  ⚠️  Query ${i + 1} failed with status ${response.status}`)
          await this.delayBetweenRequests()
          continue
        }

        const data = await response.json() as OSMResponse
        const points = this.parseOSMResponse(data, 'recreation')
        allRecreation.push(...points)

        console.log(`  ✅ Found ${points.length} recreation facilities in batch ${i + 1}`)

        // Rate limiting between queries
        await this.delayBetweenRequests()

      } catch (error) {
        console.warn(`  ❌ Error in recreation query ${i + 1}:`, error)
        await this.delayBetweenRequests()
      }
    }

    // Remove duplicates
    const uniqueRecreation = this.removeDuplicates(allRecreation)

    // Save to file
    const outputFile = join(this.outputDir, 'recreation.json')
    writeFileSync(outputFile, JSON.stringify(uniqueRecreation, null, 2))
    console.log(`✅ Saved ${uniqueRecreation.length} unique recreation facilities to ${outputFile}`)
  }

  /**
   * Parse OSM response into convenience points
   */
  private parseOSMResponse(data: OSMResponse, category: 'recreation' | 'shopping'): ConveniencePoint[] {
    const points: ConveniencePoint[] = []

    for (const element of data.elements) {
      let lat: number, lon: number

      // Extract coordinates based on element type
      if (element.type === 'node' && element.lat && element.lon) {
        lat = element.lat
        lon = element.lon
      } else if ((element.type === 'way' || element.type === 'relation') && element.center) {
        lat = element.center.lat
        lon = element.center.lon
      } else {
        continue // Skip elements without coordinates
      }

      // Validate coordinates are in WA region
      if (lat < -40 || lat > -10 || lon < 110 || lon > 130) {
        continue
      }

      // Extract information from tags
      const tags = element.tags || {}
      const name = tags.name || tags.brand || this.generateFallbackName(tags, category)
      const type = this.determineType(tags, category)

      // Skip if we can't determine a meaningful name
      if (!name || name === 'Unknown') {
        continue
      }

      points.push({
        name,
        latitude: lat,
        longitude: lon,
        type,
        category,
        suburb: tags['addr:suburb'] || tags.suburb,
        postcode: tags['addr:postcode'] || tags.postcode
      })
    }

    return points
  }

  /**
   * Generate fallback name for facilities without explicit names
   */
  private generateFallbackName(tags: Record<string, string>, category: string): string {
    if (category === 'shopping') {
      if (tags.shop) return `${tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1)} Store`
      if (tags.amenity === 'shopping_centre') return 'Shopping Centre'
      if (tags.amenity === 'marketplace') return 'Marketplace'
    } else {
      if (tags.leisure) return `${tags.leisure.charAt(0).toUpperCase() + tags.leisure.slice(1)}`
      if (tags.sport) return `${tags.sport.charAt(0).toUpperCase() + tags.sport.slice(1)} Facility`
      if (tags.amenity) return `${tags.amenity.charAt(0).toUpperCase() + tags.amenity.slice(1)}`
    }
    return 'Unknown'
  }

  /**
   * Determine specific type from OSM tags
   */
  private determineType(tags: Record<string, string>, category: 'recreation' | 'shopping'): string {
    if (category === 'recreation') {
      return tags.leisure || tags.sport || tags.amenity || tags.tourism || tags.natural || 'recreation'
    } else {
      return tags.shop || tags.amenity || 'retail'
    }
  }

  /**
   * Remove duplicate facilities based on proximity (within 50 meters)
   */
  private removeDuplicates(points: ConveniencePoint[]): ConveniencePoint[] {
    const unique: ConveniencePoint[] = []
    const tolerance = 0.0005 // Approximately 50 meters

    for (const point of points) {
      const isDuplicate = unique.some(existing =>
        Math.abs(existing.latitude - point.latitude) < tolerance &&
        Math.abs(existing.longitude - point.longitude) < tolerance
      )

      if (!isDuplicate) {
        unique.push(point)
      }
    }

    return unique
  }

  /**
   * Rate limiting delay between requests
   */
  private async delayBetweenRequests(): Promise<void> {
    const delay = 3000 // 3 seconds between requests to be respectful
    console.log(`  ⏱️  Waiting ${delay/1000} seconds...`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Collect all OSM data
   */
  async collectAllData(): Promise<void> {
    console.log('🌍 Starting comprehensive OSM data collection for Western Australia...')
    console.log('This will collect ALL shopping centers and recreation facilities, including:')
    console.log('- Major shopping centers (Westfield, Garden City, etc.)')
    console.log('- Community shopping centers (Landsdale Forum, Wyatt Grove, etc.)')
    console.log('- Supermarkets, convenience stores, specialty retail')
    console.log('- Parks, sports facilities, community centers')
    console.log('- Natural recreation areas, beaches, attractions')

    try {
      await this.collectAllShoppingFacilities()
      await this.collectAllRecreationFacilities()

      console.log('🎉 Comprehensive OSM data collection completed successfully!')
      console.log(`📁 Data saved to: ${this.outputDir}`)

    } catch (error) {
      console.error('💥 OSM data collection failed:', error)
      throw error
    }
  }
}

// Export for use in other scripts
export const comprehensiveOSMCollector = new ComprehensiveOSMCollector()

// Allow running directly
if (require.main === module) {
  comprehensiveOSMCollector.collectAllData()
    .catch(console.error)
}
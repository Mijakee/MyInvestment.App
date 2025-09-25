/**
 * OSM Data Generation Script
 * Downloads recreation and shopping data from OSM once and saves to static files
 * This replaces real-time API calls with static data for better performance
 */

import fetch from 'node-fetch'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface OSMElement {
  type: string
  id: number
  lat?: number
  lon?: number
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
}

class OSMDataGenerator {
  private readonly baseURL = 'https://overpass-api.de/api/interpreter'
  private readonly outputDir = join(process.cwd(), 'src/data/convenience-data/osm-static')

  constructor() {
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true })
  }

  /**
   * Generate static recreation data for WA
   */
  async generateRecreationData(): Promise<void> {
    console.log('🏃 Generating recreation data from OSM...')

    const queries = [
      // Parks and recreational areas
      `[out:json][timeout:60];
       (
         way["leisure"="park"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="playground"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="sports_centre"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="fitness_centre"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="swimming_pool"](bbox:-35.0,113.0,-25.0,129.0);
         way["amenity"="community_centre"](bbox:-35.0,113.0,-25.0,129.0);
         relation["leisure"="park"](bbox:-35.0,113.0,-25.0,129.0);
       );
       out center;`,

      // Sports facilities
      `[out:json][timeout:60];
       (
         way["sport"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="stadium"](bbox:-35.0,113.0,-25.0,129.0);
         way["leisure"="pitch"](bbox:-35.0,113.0,-25.0,129.0);
         node["sport"](bbox:-35.0,113.0,-25.0,129.0);
       );
       out;`
    ]

    const allRecreation: ConveniencePoint[] = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`  Fetching recreation batch ${i + 1}/${queries.length}...`)

      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' }
        })

        if (!response.ok) {
          console.warn(`  Query ${i + 1} failed with status ${response.status}`)
          continue
        }

        const data = await response.json() as OSMResponse
        const points = this.parseOSMResponse(data, 'recreation')
        allRecreation.push(...points)

        console.log(`  Found ${points.length} recreation facilities in batch ${i + 1}`)

        // Rate limiting: wait 2 seconds between requests
        if (i < queries.length - 1) {
          console.log('  Waiting 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.warn(`  Error in recreation query ${i + 1}:`, error)
      }
    }

    // Save to file
    const outputFile = join(this.outputDir, 'recreation.json')
    writeFileSync(outputFile, JSON.stringify(allRecreation, null, 2))
    console.log(`✅ Saved ${allRecreation.length} recreation facilities to ${outputFile}`)
  }

  /**
   * Generate static shopping data for WA
   */
  async generateShoppingData(): Promise<void> {
    console.log('🛒 Generating shopping data from OSM...')

    const queries = [
      // Retail shops
      `[out:json][timeout:60];
       (
         way["shop"](bbox:-35.0,113.0,-25.0,129.0);
         way["amenity"="marketplace"](bbox:-35.0,113.0,-25.0,129.0);
         node["shop"="supermarket"](bbox:-35.0,113.0,-25.0,129.0);
         node["shop"="convenience"](bbox:-35.0,113.0,-25.0,129.0);
         node["shop"="mall"](bbox:-35.0,113.0,-25.0,129.0);
       );
       out;`,

      // Shopping centers and malls
      `[out:json][timeout:60];
       (
         way["shop"="mall"](bbox:-35.0,113.0,-25.0,129.0);
         way["amenity"="shopping_centre"](bbox:-35.0,113.0,-25.0,129.0);
         relation["shop"="mall"](bbox:-35.0,113.0,-25.0,129.0);
         node["amenity"="shopping_centre"](bbox:-35.0,113.0,-25.0,129.0);
       );
       out center;`
    ]

    const allShopping: ConveniencePoint[] = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`  Fetching shopping batch ${i + 1}/${queries.length}...`)

      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' }
        })

        if (!response.ok) {
          console.warn(`  Query ${i + 1} failed with status ${response.status}`)
          continue
        }

        const data = await response.json() as OSMResponse
        const points = this.parseOSMResponse(data, 'shopping')
        allShopping.push(...points)

        console.log(`  Found ${points.length} shopping facilities in batch ${i + 1}`)

        // Rate limiting: wait 2 seconds between requests
        if (i < queries.length - 1) {
          console.log('  Waiting 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.warn(`  Error in shopping query ${i + 1}:`, error)
      }
    }

    // Save to file
    const outputFile = join(this.outputDir, 'shopping.json')
    writeFileSync(outputFile, JSON.stringify(allShopping, null, 2))
    console.log(`✅ Saved ${allShopping.length} shopping facilities to ${outputFile}`)
  }

  /**
   * Parse OSM response into convenience points
   */
  private parseOSMResponse(data: OSMResponse, category: 'recreation' | 'shopping'): ConveniencePoint[] {
    const points: ConveniencePoint[] = []

    for (const element of data.elements) {
      let lat: number, lon: number

      if (element.type === 'node' && element.lat && element.lon) {
        lat = element.lat
        lon = element.lon
      } else if (element.type === 'way' && element.center) {
        lat = (element as any).center.lat
        lon = (element as any).center.lon
      } else {
        continue // Skip elements without coordinates
      }

      // Extract name and type from tags
      const tags = element.tags || {}
      const name = tags.name || tags.amenity || tags.shop || tags.leisure || 'Unknown'
      const type = this.determineType(tags, category)

      points.push({
        name,
        latitude: lat,
        longitude: lon,
        type,
        category
      })
    }

    return points
  }

  /**
   * Determine specific type from OSM tags
   */
  private determineType(tags: Record<string, string>, category: 'recreation' | 'shopping'): string {
    if (category === 'recreation') {
      return tags.leisure || tags.sport || tags.amenity || 'recreation'
    } else {
      return tags.shop || tags.amenity || 'retail'
    }
  }

  /**
   * Generate all OSM data
   */
  async generateAllData(): Promise<void> {
    console.log('🌍 Starting OSM data generation for Western Australia...')

    try {
      await this.generateRecreationData()
      await this.generateShoppingData()

      console.log('🎉 OSM data generation completed successfully!')
      console.log(`📁 Data saved to: ${this.outputDir}`)

    } catch (error) {
      console.error('💥 OSM data generation failed:', error)
      throw error
    }
  }
}

// Export for use in other scripts
export const osmDataGenerator = new OSMDataGenerator()

// Allow running directly
if (require.main === module) {
  osmDataGenerator.generateAllData()
    .catch(console.error)
}
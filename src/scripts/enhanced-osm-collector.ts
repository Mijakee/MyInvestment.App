/**
 * Enhanced OSM Data Collector
 * Comprehensive collection of ALL convenience facilities in Western Australia
 * Includes: Parks, Shopping Centres, Groceries, Health Care, Pharmacies, Leisure Centres
 * Uses rate limiting to respect OSM API limits
 */

import fetch from 'node-fetch'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
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
  subcategory: string
  suburb?: string
  postcode?: string
  metadata?: any
}

class EnhancedOSMCollector {
  private readonly baseURL = 'https://overpass-api.de/api/interpreter'
  private readonly outputDir = join(process.cwd(), 'src/data/convenience-data/osm-static')
  private readonly waBox = [-35.0, 113.0, -25.0, 129.0] // [south, west, north, east]
  private readonly rateLimit = 4000 // 4 seconds between requests for safety

  constructor() {
    mkdirSync(this.outputDir, { recursive: true })
  }

  /**
   * Collect ALL convenience facilities as requested
   */
  async collectAllConvenienceFacilities(): Promise<void> {
    console.log('🌍 Starting COMPLETE convenience facility collection for WA...')
    console.log('📋 Collecting:')
    console.log('   🏪 Shopping Centres (malls, shopping centers)')
    console.log('   🛒 Groceries (supermarkets, convenience stores)')
    console.log('   🏥 Health Care (hospitals, clinics, medical centers)')
    console.log('   💊 Pharmacies (chemists, pharmacies)')
    console.log('   🏃 Leisure Centres (gyms, sports centers, pools)')
    console.log('   🌳 Parks (parks, recreation areas, playgrounds)')
    console.log('')
    console.log('⚠️  Using 4-second delays between requests to respect OSM servers')
    console.log('')

    try {
      // Collect each category with detailed subcategories
      await this.collectShoppingCentres()
      await this.collectGroceries()
      await this.collectHealthCare()
      await this.collectPharmacies()
      await this.collectLeisureCentres()
      await this.collectParks()

      // Generate summary
      this.generateCollectionSummary()

      console.log('')
      console.log('🎉 Complete convenience facility collection finished!')
      console.log(`📁 All data saved to: ${this.outputDir}`)

    } catch (error) {
      console.error('💥 OSM data collection failed:', error)
      throw error
    }
  }

  /**
   * Collect Shopping Centres (malls, shopping centers, retail complexes)
   */
  private async collectShoppingCentres(): Promise<void> {
    console.log('🏪 Collecting Shopping Centres...')

    const queries = [
      // Major shopping malls and centres
      `[out:json][timeout:90];
       (
         way["shop"="mall"](bbox:${this.waBox.join(',')});
         relation["shop"="mall"](bbox:${this.waBox.join(',')});
         way["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
         node["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
         relation["amenity"="shopping_centre"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Department stores and retail complexes
      `[out:json][timeout:90];
       (
         way["shop"="department_store"](bbox:${this.waBox.join(',')});
         node["shop"="department_store"](bbox:${this.waBox.join(',')});
         way["building"="retail"](bbox:${this.waBox.join(',')});
         way["landuse"="retail"](bbox:${this.waBox.join(',')});
         relation["landuse"="retail"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'shopping_centres')
    this.saveFacilities(facilities, 'shopping-centres.json')
  }

  /**
   * Collect Groceries (supermarkets, convenience stores, food shops)
   */
  private async collectGroceries(): Promise<void> {
    console.log('🛒 Collecting Groceries...')

    const queries = [
      // Supermarkets and large grocers
      `[out:json][timeout:90];
       (
         way["shop"="supermarket"](bbox:${this.waBox.join(',')});
         node["shop"="supermarket"](bbox:${this.waBox.join(',')});
         way["shop"="hypermarket"](bbox:${this.waBox.join(',')});
         node["shop"="hypermarket"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Convenience stores and small grocers
      `[out:json][timeout:90];
       (
         node["shop"="convenience"](bbox:${this.waBox.join(',')});
         way["shop"="convenience"](bbox:${this.waBox.join(',')});
         node["shop"="general"](bbox:${this.waBox.join(',')});
         node["shop"="grocery"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Specialty food stores
      `[out:json][timeout:90];
       (
         node["shop"~"^(bakery|butcher|greengrocer|deli)$"](bbox:${this.waBox.join(',')});
         way["shop"~"^(bakery|butcher|greengrocer|deli)$"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'groceries')
    this.saveFacilities(facilities, 'groceries.json')
  }

  /**
   * Collect Health Care (hospitals, clinics, medical centers)
   */
  private async collectHealthCare(): Promise<void> {
    console.log('🏥 Collecting Health Care Facilities...')

    const queries = [
      // Hospitals and major medical centers
      `[out:json][timeout:90];
       (
         way["amenity"="hospital"](bbox:${this.waBox.join(',')});
         node["amenity"="hospital"](bbox:${this.waBox.join(',')});
         way["healthcare"="hospital"](bbox:${this.waBox.join(',')});
         node["healthcare"="hospital"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Medical clinics and practices
      `[out:json][timeout:90];
       (
         way["amenity"~"^(clinic|doctors)$"](bbox:${this.waBox.join(',')});
         node["amenity"~"^(clinic|doctors)$"](bbox:${this.waBox.join(',')});
         way["healthcare"~"^(clinic|doctor)$"](bbox:${this.waBox.join(',')});
         node["healthcare"~"^(clinic|doctor)$"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Specialized medical facilities
      `[out:json][timeout:90];
       (
         way["healthcare"~"^(dentist|physiotherapy|optometrist)$"](bbox:${this.waBox.join(',')});
         node["healthcare"~"^(dentist|physiotherapy|optometrist)$"](bbox:${this.waBox.join(',')});
         way["amenity"="dentist"](bbox:${this.waBox.join(',')});
         node["amenity"="dentist"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'health_care')
    this.saveFacilities(facilities, 'health-care.json')
  }

  /**
   * Collect Pharmacies (chemists, pharmacies, medical supply)
   */
  private async collectPharmacies(): Promise<void> {
    console.log('💊 Collecting Pharmacies...')

    const queries = [
      // Pharmacies and chemists
      `[out:json][timeout:90];
       (
         node["amenity"="pharmacy"](bbox:${this.waBox.join(',')});
         way["amenity"="pharmacy"](bbox:${this.waBox.join(',')});
         node["shop"="chemist"](bbox:${this.waBox.join(',')});
         way["shop"="chemist"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'pharmacies')
    this.saveFacilities(facilities, 'pharmacies.json')
  }

  /**
   * Collect Leisure Centres (gyms, sports centers, pools, fitness)
   */
  private async collectLeisureCentres(): Promise<void> {
    console.log('🏃 Collecting Leisure Centres...')

    const queries = [
      // Sports and fitness centres
      `[out:json][timeout:90];
       (
         way["leisure"~"^(sports_centre|fitness_centre|swimming_pool)$"](bbox:${this.waBox.join(',')});
         node["leisure"~"^(sports_centre|fitness_centre|swimming_pool)$"](bbox:${this.waBox.join(',')});
         way["sport"="fitness"](bbox:${this.waBox.join(',')});
         node["sport"="fitness"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Recreation and leisure facilities
      `[out:json][timeout:90];
       (
         way["amenity"~"^(community_centre|social_centre)$"](bbox:${this.waBox.join(',')});
         node["amenity"~"^(community_centre|social_centre)$"](bbox:${this.waBox.join(',')});
         way["leisure"~"^(stadium|sports_hall)$"](bbox:${this.waBox.join(',')});
         node["leisure"~"^(stadium|sports_hall)$"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'leisure_centres')
    this.saveFacilities(facilities, 'leisure-centres.json')
  }

  /**
   * Collect Parks (parks, recreation areas, playgrounds, gardens)
   */
  private async collectParks(): Promise<void> {
    console.log('🌳 Collecting Parks and Recreation Areas...')

    const queries = [
      // Parks and gardens
      `[out:json][timeout:90];
       (
         way["leisure"="park"](bbox:${this.waBox.join(',')});
         relation["leisure"="park"](bbox:${this.waBox.join(',')});
         way["leisure"="garden"](bbox:${this.waBox.join(',')});
         relation["leisure"="garden"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Playgrounds and recreation areas
      `[out:json][timeout:90];
       (
         way["leisure"="playground"](bbox:${this.waBox.join(',')});
         node["leisure"="playground"](bbox:${this.waBox.join(',')});
         way["leisure"="recreation_ground"](bbox:${this.waBox.join(',')});
         node["leisure"="recreation_ground"](bbox:${this.waBox.join(',')});
       );
       out center meta;`,

      // Natural areas and beaches
      `[out:json][timeout:90];
       (
         way["natural"="beach"](bbox:${this.waBox.join(',')});
         node["natural"="beach"](bbox:${this.waBox.join(',')});
         way["leisure"="nature_reserve"](bbox:${this.waBox.join(',')});
         relation["leisure"="nature_reserve"](bbox:${this.waBox.join(',')});
       );
       out center meta;`
    ]

    const facilities = await this.executeQueries(queries, 'parks')
    this.saveFacilities(facilities, 'parks.json')
  }

  /**
   * Execute a set of queries for a facility category
   */
  private async executeQueries(queries: string[], category: string): Promise<ConveniencePoint[]> {
    const allFacilities: ConveniencePoint[] = []

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`  📊 Query ${i + 1}/${queries.length} for ${category}...`)

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
        const points = this.parseOSMResponse(data, category)
        allFacilities.push(...points)

        console.log(`  ✅ Found ${points.length} facilities in ${category} query ${i + 1}`)

        // Rate limiting between queries
        await this.delayBetweenRequests()

      } catch (error) {
        console.warn(`  ❌ Error in ${category} query ${i + 1}:`, error)
        await this.delayBetweenRequests()
      }
    }

    // Remove duplicates
    const uniqueFacilities = this.removeDuplicates(allFacilities)
    console.log(`  🎯 Total unique ${category}: ${uniqueFacilities.length}`)

    return uniqueFacilities
  }

  /**
   * Parse OSM response into convenience points
   */
  private parseOSMResponse(data: OSMResponse, category: string): ConveniencePoint[] {
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
      const name = tags.name || tags.brand || tags.operator || this.generateFallbackName(tags, category)
      const type = this.determineType(tags, category)
      const subcategory = this.determineSubcategory(tags, category)

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
        subcategory,
        suburb: tags['addr:suburb'] || tags.suburb,
        postcode: tags['addr:postcode'] || tags.postcode,
        metadata: {
          osmType: element.type,
          osmId: element.id,
          tags: tags
        }
      })
    }

    return points
  }

  /**
   * Generate fallback names for facilities
   */
  private generateFallbackName(tags: Record<string, string>, category: string): string {
    switch (category) {
      case 'shopping_centres':
        if (tags.amenity === 'shopping_centre') return 'Shopping Centre'
        if (tags.shop === 'mall') return 'Shopping Mall'
        if (tags.shop === 'department_store') return 'Department Store'
        break

      case 'groceries':
        if (tags.shop === 'supermarket') return 'Supermarket'
        if (tags.shop === 'convenience') return 'Convenience Store'
        if (tags.shop === 'grocery') return 'Grocery Store'
        break

      case 'health_care':
        if (tags.amenity === 'hospital') return 'Hospital'
        if (tags.amenity === 'clinic') return 'Medical Clinic'
        if (tags.healthcare === 'dentist') return 'Dental Clinic'
        break

      case 'pharmacies':
        if (tags.amenity === 'pharmacy') return 'Pharmacy'
        if (tags.shop === 'chemist') return 'Chemist'
        break

      case 'leisure_centres':
        if (tags.leisure === 'sports_centre') return 'Sports Centre'
        if (tags.leisure === 'fitness_centre') return 'Fitness Centre'
        if (tags.leisure === 'swimming_pool') return 'Swimming Pool'
        break

      case 'parks':
        if (tags.leisure === 'park') return 'Park'
        if (tags.leisure === 'playground') return 'Playground'
        if (tags.natural === 'beach') return 'Beach'
        break
    }

    return 'Unknown'
  }

  /**
   * Determine facility type from OSM tags
   */
  private determineType(tags: Record<string, string>, category: string): string {
    return tags.amenity || tags.shop || tags.leisure || tags.healthcare || tags.natural || category
  }

  /**
   * Determine subcategory for more specific classification
   */
  private determineSubcategory(tags: Record<string, string>, category: string): string {
    // More specific classification
    if (tags.shop) return tags.shop
    if (tags.amenity) return tags.amenity
    if (tags.leisure) return tags.leisure
    if (tags.healthcare) return tags.healthcare
    if (tags.natural) return tags.natural
    return category
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
   * Save facilities to JSON file
   */
  private saveFacilities(facilities: ConveniencePoint[], filename: string): void {
    const outputFile = join(this.outputDir, filename)
    writeFileSync(outputFile, JSON.stringify(facilities, null, 2))
    console.log(`✅ Saved ${facilities.length} facilities to ${filename}`)
  }

  /**
   * Rate limiting delay between requests
   */
  private async delayBetweenRequests(): Promise<void> {
    console.log(`  ⏱️  Waiting ${this.rateLimit/1000} seconds...`)
    await new Promise(resolve => setTimeout(resolve, this.rateLimit))
  }

  /**
   * Generate collection summary
   */
  private generateCollectionSummary(): void {
    console.log('')
    console.log('📊 Collection Summary:')

    const files = [
      'shopping-centres.json',
      'groceries.json',
      'health-care.json',
      'pharmacies.json',
      'leisure-centres.json',
      'parks.json'
    ]

    let totalFacilities = 0
    for (const file of files) {
      try {
        const filePath = join(this.outputDir, file)
        if (existsSync(filePath)) {
          const data = JSON.parse(readFileSync(filePath, 'utf-8'))
          console.log(`   ${file}: ${data.length} facilities`)
          totalFacilities += data.length
        } else {
          console.log(`   ${file}: Not found`)
        }
      } catch (error) {
        console.log(`   ${file}: Error reading file`)
      }
    }

    console.log(`   ───────────────────────────────`)
    console.log(`   TOTAL: ${totalFacilities} convenience facilities`)
  }
}

// Export for use in other scripts
export const enhancedOSMCollector = new EnhancedOSMCollector()

// Allow running directly
if (require.main === module) {
  enhancedOSMCollector.collectAllConvenienceFacilities()
    .catch(console.error)
}
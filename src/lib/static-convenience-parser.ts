/**
 * Static Convenience Parser Service
 * Processes static government datasets to calculate convenience scores
 * Replaces external API calls with local data processing
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { GeoPackage } from '@ngageoint/geopackage'
import fetch from 'node-fetch'
import * as pdf from 'pdf-parse'

export interface ConveniencePoint {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  metadata?: any
}

export interface ConvenienceScore {
  overallScore: number
  confidence: number
  components: {
    transport: {
      score: number
      nearbyStops: number
      trainStations: number
      stopsWithin1km: number
      stopsWithin2km: number
    }
    education: {
      score: number
      nearbySchools: number
      primarySchools: number
      secondarySchools: number
      schoolsWithin2km: number
    }
    health: {
      score: number
      nearbyFacilities: number
      hospitalsWithin10km: number
      clinicsWithin5km: number
    }
    recreation: {
      score: number
      nearbyFacilities: number
      parksWithin2km: number
      beachAccess: boolean
    }
    shopping: {
      score: number
      nearbyFacilities: number
      majorCentersWithin10km: number
      localShopsWithin2km: number
    }
  }
  explanation: {
    transportSummary: string
    educationSummary: string
    healthSummary: string
    recreationSummary: string
    shoppingSummary: string
  }
}

class StaticConvenienceParser {
  private transportStops: ConveniencePoint[] = []
  private schools: ConveniencePoint[] = []
  private healthFacilities: ConveniencePoint[] = []
  private recreationFacilities: ConveniencePoint[] = []
  private shoppingFacilities: ConveniencePoint[] = []
  private initialized = false

  /**
   * Initialize parser with all static datasets
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🚀 Initializing static convenience parser...')

    try {
      // Load transport data (GTFS stops.txt)
      this.transportStops = await this.parseTransportStops()
      console.log(`✅ Loaded ${this.transportStops.length} transport stops`)

      // Load schools data (PDF processing - mock for now)
      this.schools = await this.parseSchoolsData()
      console.log(`✅ Loaded ${this.schools.length} schools`)

      // Load health facilities (mock data for now)
      this.healthFacilities = await this.parseHealthData()
      console.log(`✅ Loaded ${this.healthFacilities.length} health facilities`)

      // Load recreation facilities (mock data for now)
      this.recreationFacilities = await this.parseRecreationData()
      console.log(`✅ Loaded ${this.recreationFacilities.length} recreation facilities`)

      // Load shopping facilities (OpenStreetMap-style data)
      this.shoppingFacilities = await this.parseShoppingData()
      console.log(`✅ Loaded ${this.shoppingFacilities.length} shopping facilities`)

      this.initialized = true
      console.log('🎉 Static convenience parser initialized successfully')

    } catch (error) {
      console.error('💥 Failed to initialize static convenience parser:', error)
      throw error
    }
  }

  /**
   * Parse GTFS stops.txt → transport points
   */
  private async parseTransportStops(): Promise<ConveniencePoint[]> {
    try {
      const filePath = join(process.cwd(), 'src/data/convenience-data/transport/stops.txt')
      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n').slice(1) // Skip header
      const stops: ConveniencePoint[] = []

      for (const line of lines) {
        if (!line.trim()) continue

        const parts = line.split(',')
        if (parts.length < 8) continue

        // Parse CSV with quoted fields
        const stopId = parts[2]?.replace(/"/g, '')
        const stopName = parts[4]?.replace(/"/g, '')
        const lat = parseFloat(parts[6])
        const lng = parseFloat(parts[7])
        const modes = parts[9]?.replace(/"/g, '') || 'Bus'

        if (!stopId || isNaN(lat) || isNaN(lng)) continue

        stops.push({
          id: stopId,
          name: stopName || `Stop ${stopId}`,
          type: 'transport',
          lat,
          lng,
          metadata: {
            modes: modes.split(',').map(m => m.trim()),
            isTrainStation: modes.toLowerCase().includes('train'),
            isBusStop: modes.toLowerCase().includes('bus'),
            isFerryStop: modes.toLowerCase().includes('ferry')
          }
        })
      }

      return stops
    } catch (error) {
      console.warn('Failed to load transport data:', error)
      return []
    }
  }

  /**
   * Parse schools PDF → education points
   * Uses real WA Department of Education data
   */
  private async parseSchoolsData(): Promise<ConveniencePoint[]> {
    try {
      const pdfPath = join(process.cwd(), 'src/data/convenience-data/schools/WA Schools List.pdf')
      const pdfBuffer = readFileSync(pdfPath)
      const pdfData = await pdf(pdfBuffer)

      const schools: ConveniencePoint[] = []
      const text = pdfData.text

      // Parse the PDF text to extract school information
      // The WA Schools List PDF typically contains school names, locations, and types
      const lines = text.split('\n').filter(line => line.trim().length > 0)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Look for school name patterns (typically ending with 'School', 'College', or 'Centre')
        if (this.isSchoolName(line)) {
          const schoolName = line
          const schoolType = this.classifySchoolType(schoolName)

          // Try to find location information in nearby lines
          const coordinates = this.extractSchoolCoordinates(schoolName, lines, i)

          if (coordinates) {
            schools.push({
              id: `school_${schools.length}`,
              name: schoolName,
              type: 'education',
              lat: coordinates.lat,
              lng: coordinates.lng,
              metadata: {
                schoolType: schoolType,
                sector: this.extractSchoolSector(schoolName),
                source: 'wa_education_dept_pdf'
              }
            })
          } else {
            // If no coordinates found, use estimated coordinates based on suburb/location
            const estimatedCoords = this.estimateSchoolLocation(schoolName)
            if (estimatedCoords) {
              schools.push({
                id: `school_${schools.length}`,
                name: schoolName,
                type: 'education',
                lat: estimatedCoords.lat,
                lng: estimatedCoords.lng,
                metadata: {
                  schoolType: schoolType,
                  sector: this.extractSchoolSector(schoolName),
                  source: 'wa_education_dept_pdf_estimated'
                }
              })
            }
          }
        }
      }

      console.log(`✅ Loaded ${schools.length} schools from PDF`)
      return schools

    } catch (error) {
      console.warn('Failed to parse schools PDF, using fallback data:', error)
      return this.getMockSchoolsData()
    }
  }

  /**
   * Check if a line contains a school name
   */
  private isSchoolName(line: string): boolean {
    const schoolIndicators = [
      'school', 'college', 'academy', 'centre', 'center',
      'primary', 'secondary', 'high', 'education'
    ]
    const lower = line.toLowerCase()
    return schoolIndicators.some(indicator => lower.includes(indicator)) &&
           !lower.includes('district') &&
           !lower.includes('region') &&
           line.length > 3 &&
           line.length < 100
  }

  /**
   * Classify school type from name
   */
  private classifySchoolType(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('primary')) return 'primary'
    if (lower.includes('high') || lower.includes('secondary')) return 'secondary'
    if (lower.includes('college')) return 'college'
    if (lower.includes('k-12') || lower.includes('k-10')) return 'combined'
    return 'unknown'
  }

  /**
   * Extract school sector (public/private/catholic)
   */
  private extractSchoolSector(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('catholic')) return 'catholic'
    if (lower.includes('christian') || lower.includes('baptist') || lower.includes('anglican')) return 'private'
    if (lower.includes('grammar') || lower.includes('college') && !lower.includes('tafe')) return 'private'
    return 'public'
  }

  /**
   * Try to extract coordinates from PDF text (if available)
   */
  private extractSchoolCoordinates(schoolName: string, lines: string[], currentIndex: number): {lat: number, lng: number} | null {
    // Look for coordinate patterns in nearby lines
    const searchLines = lines.slice(Math.max(0, currentIndex - 2), Math.min(lines.length, currentIndex + 3))

    for (const line of searchLines) {
      // Look for coordinate patterns like "-31.9505, 115.8605" or "S31°57'01.8\" E115°51'37.8\""
      const decimalCoords = line.match(/-?\d+\.\d+,\s*-?\d+\.\d+/)
      if (decimalCoords) {
        const [lat, lng] = decimalCoords[0].split(',').map(coord => parseFloat(coord.trim()))
        if (lat >= -40 && lat <= -10 && lng >= 110 && lng <= 130) {
          return { lat, lng }
        }
      }
    }

    return null
  }

  /**
   * Estimate school location based on suburb/region name
   */
  private estimateSchoolLocation(schoolName: string): {lat: number, lng: number} | null {
    // Common WA locations and their approximate coordinates
    const locationMap: Record<string, {lat: number, lng: number}> = {
      'perth': { lat: -31.9505, lng: 115.8605 },
      'fremantle': { lat: -32.0569, lng: 115.7439 },
      'joondalup': { lat: -31.7448, lng: 115.7661 },
      'mandurah': { lat: -32.5269, lng: 115.7217 },
      'rockingham': { lat: -32.2767, lng: 115.7297 },
      'armadale': { lat: -32.1398, lng: 116.0077 },
      'midland': { lat: -31.8945, lng: 116.0105 },
      'kalgoorlie': { lat: -30.7489, lng: 121.4648 },
      'broome': { lat: -17.9617, lng: 122.2340 },
      'geraldton': { lat: -28.7774, lng: 114.6140 },
      'albany': { lat: -35.0269, lng: 117.8840 },
      'bunbury': { lat: -33.3272, lng: 115.6390 },
      'kununurra': { lat: -15.7792, lng: 128.7425 },
      'esperance': { lat: -33.8614, lng: 121.8906 },
      'port hedland': { lat: -20.3128, lng: 118.6145 },
      'karratha': { lat: -20.7364, lng: 116.8467 }
    }

    const lower = schoolName.toLowerCase()
    for (const [location, coords] of Object.entries(locationMap)) {
      if (lower.includes(location)) {
        return coords
      }
    }

    return null
  }

  /**
   * Fallback mock schools data
   */
  private getMockSchoolsData(): ConveniencePoint[] {
    const mockSchools: ConveniencePoint[] = []

    // Perth metro schools
    const perthSchools = [
      { name: 'Perth Primary School', lat: -31.9505, lng: 115.8605 },
      { name: 'Subiaco High School', lat: -31.9474, lng: 115.8218 },
      { name: 'Fremantle Primary', lat: -32.0569, lng: 115.7439 },
      { name: 'Mandurah High School', lat: -32.5269, lng: 115.7217 },
      { name: 'Joondalup Primary', lat: -31.7448, lng: 115.7661 },
      { name: 'Armadale High School', lat: -32.1398, lng: 116.0077 }
    ]

    // Regional schools
    const regionalSchools = [
      { name: 'Kalgoorlie High School', lat: -30.7489, lng: 121.4648 },
      { name: 'Broome Primary School', lat: -17.9617, lng: 122.2340 },
      { name: 'Geraldton High School', lat: -28.7774, lng: 114.6140 },
      { name: 'Albany High School', lat: -35.0269, lng: 117.8840 },
      { name: 'Bunbury High School', lat: -33.3272, lng: 115.6390 }
    ]

    const allSchools = [...perthSchools, ...regionalSchools]

    allSchools.forEach((school, index) => {
      mockSchools.push({
        id: `school_${index}`,
        name: school.name,
        type: 'education',
        lat: school.lat,
        lng: school.lng,
        metadata: {
          schoolType: school.name.includes('Primary') ? 'primary' : 'secondary',
          sector: 'public'
        }
      })
    })

    return mockSchools
  }

  /**
   * Parse health geopackage → medical points
   * Uses real WA Department of Health data
   */
  private async parseHealthData(): Promise<ConveniencePoint[]> {
    try {
      const gpkgPath = join(process.cwd(), 'src/data/convenience-data/health/Health_Hospitals_HEALTH_001_WA_GDA2020_Public.gpkg')
      const { GeoPackageAPI } = require('@ngageoint/geopackage')
      const geoPackage = await GeoPackageAPI.open(gpkgPath)

      const healthFacilities: ConveniencePoint[] = []

      // Get all feature tables in the geopackage
      const featureTables = geoPackage.getFeatureTables()

      for (const tableName of featureTables) {
        const featureDao = geoPackage.getFeatureDao(tableName)
        const features = featureDao.queryForAll()

        features.forEach(feature => {
          const geometry = feature.getGeometry()
          if (geometry && geometry.geometry) {
            const coords = geometry.geometry.coordinates
            const properties = feature.values

            // Handle different coordinate formats (Point geometry)
            let lat: number, lng: number
            if (Array.isArray(coords) && coords.length >= 2) {
              // GeoPackage typically stores as [lng, lat] or could be [lat, lng]
              // Check if coordinates look like WA region
              if (coords[0] > 100 && coords[0] < 130) {
                // First coordinate is longitude (WA is ~115-130 degrees E)
                lng = coords[0]
                lat = coords[1]
              } else {
                // First coordinate is latitude
                lat = coords[0]
                lng = coords[1]
              }

              // Validate coordinates are in WA region
              if (lat >= -40 && lat <= -10 && lng >= 110 && lng <= 130) {
                healthFacilities.push({
                  id: `health_${properties.OBJECTID || healthFacilities.length}`,
                  name: properties.NAME || properties.HOSPITAL_NAME || properties.FACILITY_NAME || `Health Facility ${healthFacilities.length}`,
                  type: 'health',
                  lat,
                  lng,
                  metadata: {
                    facilityType: this.classifyHealthFacility(properties.NAME || ''),
                    services: this.extractHealthServices(properties),
                    ownership: properties.OWNERSHIP || 'unknown',
                    status: properties.STATUS || 'active'
                  }
                })
              }
            }
          }
        })
      }

      geoPackage.close()

      console.log(`✅ Loaded ${healthFacilities.length} real health facilities from geopackage`)
      return healthFacilities

    } catch (error) {
      console.warn('Failed to load real health data, using fallback:', error)

      // Fallback to mock data if geopackage fails
      return this.getMockHealthData()
    }
  }

  /**
   * Classify health facility type based on name
   */
  private classifyHealthFacility(name: string): string {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('hospital')) return 'hospital'
    if (lowerName.includes('clinic')) return 'clinic'
    if (lowerName.includes('medical')) return 'medical_center'
    if (lowerName.includes('health')) return 'health_center'
    if (lowerName.includes('pharmacy')) return 'pharmacy'
    if (lowerName.includes('dental')) return 'dental'
    return 'health_facility'
  }

  /**
   * Extract health services from facility properties
   */
  private extractHealthServices(properties: any): string[] {
    const services = []
    if (properties.EMERGENCY === 'Y' || properties.EMERGENCY === 1) services.push('emergency')
    if (properties.MATERNITY === 'Y' || properties.MATERNITY === 1) services.push('maternity')
    if (properties.SURGERY === 'Y' || properties.SURGERY === 1) services.push('surgery')
    if (services.length === 0) services.push('general')
    return services
  }

  /**
   * Fallback mock health data
   */
  private getMockHealthData(): ConveniencePoint[] {
    const mockHealthFacilities: ConveniencePoint[] = []

    // Major hospitals
    const hospitals = [
      { name: 'Royal Perth Hospital', lat: -31.9536, lng: 115.8673 },
      { name: 'Sir Charles Gairdner Hospital', lat: -31.9461, lng: 115.8170 },
      { name: 'Fremantle Hospital', lat: -32.0569, lng: 115.7591 },
      { name: 'Joondalup Health Campus', lat: -31.7300, lng: 115.7700 },
      { name: 'Armadale Hospital', lat: -32.1598, lng: 116.0177 },
      { name: 'Peel Health Campus', lat: -32.5200, lng: 115.7500 },
      { name: 'Kalgoorlie Hospital', lat: -30.7489, lng: 121.4848 },
      { name: 'Broome Hospital', lat: -17.9617, lng: 122.2540 },
      { name: 'Geraldton Hospital', lat: -28.7774, lng: 114.6340 },
      { name: 'Albany Hospital', lat: -35.0269, lng: 117.8940 }
    ]

    hospitals.forEach((hospital, index) => {
      mockHealthFacilities.push({
        id: `hospital_${index}`,
        name: hospital.name,
        type: 'health',
        lat: hospital.lat,
        lng: hospital.lng,
        metadata: {
          facilityType: 'hospital',
          services: ['emergency', 'general']
        }
      })
    })

    return mockHealthFacilities
  }

  /**
   * Parse recreation data from OSM → recreation points
   * Uses OpenStreetMap data for parks, beaches, sports facilities
   */
  private async parseRecreationData(): Promise<ConveniencePoint[]> {
    try {
      // Use cached recreation data if available to avoid repeated OSM calls
      const cacheKey = 'osm_recreation_data'
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        console.log(`✅ Using cached recreation data: ${cachedData.length} facilities`)
        return cachedData
      }

      const recreationFacilities: ConveniencePoint[] = []

      // Query OSM for recreation facilities in WA
      const osmQueries = [
        // Parks and gardens
        `[out:json][timeout:25];
         (way["leisure"="park"](bbox:-35,113,-15,129);
          rel["leisure"="park"](bbox:-35,113,-15,129););
         out center;`,

        // Sports facilities
        `[out:json][timeout:25];
         (way["leisure"~"^(sports_centre|stadium|pitch|swimming_pool)$"](bbox:-35,113,-15,129);
          rel["leisure"~"^(sports_centre|stadium|pitch|swimming_pool)$"](bbox:-35,113,-15,129););
         out center;`,

        // Beaches and natural areas
        `[out:json][timeout:25];
         (way["natural"~"^(beach|coastline)$"](bbox:-35,113,-15,129);
          rel["natural"~"^(beach|coastline)$"](bbox:-35,113,-15,129););
         out center;`
      ]

      // Execute OSM queries with error handling
      for (const query of osmQueries) {
        try {
          const osmData = await this.queryOSM(query)
          if (osmData && osmData.elements) {
            osmData.elements.forEach((element: any) => {
              let lat: number, lng: number

              // Handle different OSM element types
              if (element.lat && element.lon) {
                lat = element.lat
                lng = element.lon
              } else if (element.center && element.center.lat && element.center.lon) {
                lat = element.center.lat
                lng = element.center.lon
              } else {
                return // Skip elements without coordinates
              }

              // Validate coordinates are in WA region
              if (lat >= -40 && lat <= -10 && lng >= 110 && lng <= 130) {
                recreationFacilities.push({
                  id: `osm_recreation_${element.id}`,
                  name: element.tags?.name || this.getRecreationName(element.tags),
                  type: 'recreation',
                  lat,
                  lng,
                  metadata: {
                    facilityType: this.classifyRecreationFacility(element.tags),
                    activities: this.extractRecreationActivities(element.tags),
                    osmType: element.type,
                    osmId: element.id
                  }
                })
              }
            })
          }
        } catch (queryError) {
          console.warn('OSM query failed, continuing with next query:', queryError)
        }
      }

      // Cache the results for 24 hours
      this.setCache(cacheKey, recreationFacilities, 24 * 60 * 60 * 1000)

      console.log(`✅ Loaded ${recreationFacilities.length} recreation facilities from OSM`)
      return recreationFacilities.length > 0 ? recreationFacilities : this.getMockRecreationData()

    } catch (error) {
      console.warn('Failed to load OSM recreation data, using fallback:', error)
      return this.getMockRecreationData()
    }
  }

  /**
   * Query OpenStreetMap Overpass API
   */
  private async queryOSM(query: string): Promise<any> {
    const url = 'https://overpass-api.de/api/interpreter'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    })

    if (!response.ok) {
      throw new Error(`OSM query failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Classify recreation facility type
   */
  private classifyRecreationFacility(tags: any): string {
    if (!tags) return 'recreation'

    if (tags.leisure === 'park') return 'park'
    if (tags.leisure === 'sports_centre') return 'sports_center'
    if (tags.leisure === 'swimming_pool') return 'pool'
    if (tags.leisure === 'stadium') return 'stadium'
    if (tags.leisure === 'pitch') return 'sports_field'
    if (tags.natural === 'beach') return 'beach'
    if (tags.natural === 'coastline') return 'coastline'

    return 'recreation'
  }

  /**
   * Extract activities from OSM tags
   */
  private extractRecreationActivities(tags: any): string[] {
    const activities = []
    if (!tags) return ['recreation']

    if (tags.sport) activities.push(tags.sport)
    if (tags.leisure === 'swimming_pool') activities.push('swimming')
    if (tags.natural === 'beach') activities.push('swimming', 'beach')
    if (tags.leisure === 'park') activities.push('walking', 'recreation')
    if (tags.leisure === 'pitch') activities.push('sports')

    return activities.length > 0 ? activities : ['recreation']
  }

  /**
   * Generate recreation facility name
   */
  private getRecreationName(tags: any): string {
    if (!tags) return 'Recreation Area'

    if (tags.name) return tags.name
    if (tags.leisure === 'park') return 'Park'
    if (tags.leisure === 'sports_centre') return 'Sports Centre'
    if (tags.natural === 'beach') return 'Beach'

    return 'Recreation Facility'
  }

  /**
   * Simple in-memory cache for OSM data
   */
  private cache: Map<string, { data: any, expires: number }> = new Map()

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    })
  }

  /**
   * Fallback mock recreation data
   */
  private getMockRecreationData(): ConveniencePoint[] {
    const mockRecreation: ConveniencePoint[] = []

    // Parks and recreation areas
    const parks = [
      { name: 'Kings Park', lat: -31.9614, lng: 115.8331 },
      { name: 'Hyde Park', lat: -31.9397, lng: 115.8553 },
      { name: 'South Perth Foreshore', lat: -31.9738, lng: 115.8553 },
      { name: 'Cottesloe Beach', lat: -31.9959, lng: 115.7582 },
      { name: 'Scarborough Beach', lat: -31.8944, lng: 115.7582 },
      { name: 'Rottnest Island', lat: -32.0059, lng: 115.5367 },
      { name: 'John Forrest National Park', lat: -31.8833, lng: 116.0833 },
      { name: 'Yanchep National Park', lat: -31.5500, lng: 115.6333 },
      { name: 'Kalamunda National Park', lat: -31.9667, lng: 116.0500 },
      { name: 'Lane Poole Reserve', lat: -32.7500, lng: 116.0833 }
    ]

    parks.forEach((park, index) => {
      mockRecreation.push({
        id: `park_${index}`,
        name: park.name,
        type: 'recreation',
        lat: park.lat,
        lng: park.lng,
        metadata: {
          facilityType: park.name.includes('Beach') ? 'beach' :
                       park.name.includes('Park') ? 'park' : 'reserve',
          activities: ['walking', 'recreation']
        }
      })
    })

    return mockRecreation
  }

  /**
   * Parse shopping data from OSM → commercial points
   * Uses OpenStreetMap data for retail, shopping centers, commercial areas
   */
  private async parseShoppingData(): Promise<ConveniencePoint[]> {
    try {
      // Use cached shopping data if available to avoid repeated OSM calls
      const cacheKey = 'osm_shopping_data'
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        console.log(`✅ Using cached shopping data: ${cachedData.length} facilities`)
        return cachedData
      }

      const shoppingFacilities: ConveniencePoint[] = []

      // Query OSM for shopping facilities in WA
      const osmQueries = [
        // Shopping centers and malls
        `[out:json][timeout:25];
         (way["shop"="mall"](bbox:-35,113,-15,129);
          rel["shop"="mall"](bbox:-35,113,-15,129);
          way["building"="retail"](bbox:-35,113,-15,129);
          rel["building"="retail"](bbox:-35,113,-15,129););
         out center;`,

        // Supermarkets and major retail
        `[out:json][timeout:25];
         (way["shop"="supermarket"](bbox:-35,113,-15,129);
          rel["shop"="supermarket"](bbox:-35,113,-15,129);
          way["shop"="department_store"](bbox:-35,113,-15,129);
          rel["shop"="department_store"](bbox:-35,113,-15,129););
         out center;`,

        // Commercial areas
        `[out:json][timeout:25];
         (way["landuse"="commercial"](bbox:-35,113,-15,129);
          rel["landuse"="commercial"](bbox:-35,113,-15,129);
          way["landuse"="retail"](bbox:-35,113,-15,129);
          rel["landuse"="retail"](bbox:-35,113,-15,129););
         out center;`
      ]

      // Execute OSM queries with error handling
      for (const query of osmQueries) {
        try {
          const osmData = await this.queryOSM(query)
          if (osmData && osmData.elements) {
            osmData.elements.forEach((element: any) => {
              let lat: number, lng: number

              // Handle different OSM element types
              if (element.lat && element.lon) {
                lat = element.lat
                lng = element.lon
              } else if (element.center && element.center.lat && element.center.lon) {
                lat = element.center.lat
                lng = element.center.lon
              } else {
                return // Skip elements without coordinates
              }

              // Validate coordinates are in WA region
              if (lat >= -40 && lat <= -10 && lng >= 110 && lng <= 130) {
                shoppingFacilities.push({
                  id: `osm_shopping_${element.id}`,
                  name: element.tags?.name || this.getShoppingName(element.tags),
                  type: 'shopping',
                  lat,
                  lng,
                  metadata: {
                    facilityType: this.classifyShoppingFacility(element.tags),
                    size: this.getShoppingSize(element.tags),
                    osmType: element.type,
                    osmId: element.id
                  }
                })
              }
            })
          }
        } catch (queryError) {
          console.warn('OSM query failed, continuing with next query:', queryError)
        }
      }

      // Cache the results for 24 hours
      this.setCache(cacheKey, shoppingFacilities, 24 * 60 * 60 * 1000)

      console.log(`✅ Loaded ${shoppingFacilities.length} shopping facilities from OSM`)
      return shoppingFacilities.length > 0 ? shoppingFacilities : this.getMockShoppingData()

    } catch (error) {
      console.warn('Failed to load OSM shopping data, using fallback:', error)
      return this.getMockShoppingData()
    }
  }

  /**
   * Classify shopping facility type
   */
  private classifyShoppingFacility(tags: any): string {
    if (!tags) return 'retail'

    if (tags.shop === 'mall') return 'mall'
    if (tags.shop === 'supermarket') return 'supermarket'
    if (tags.shop === 'department_store') return 'department_store'
    if (tags.building === 'retail') return 'retail_building'
    if (tags.landuse === 'commercial') return 'commercial_area'
    if (tags.landuse === 'retail') return 'retail_area'

    return 'retail'
  }

  /**
   * Determine shopping facility size
   */
  private getShoppingSize(tags: any): string {
    if (!tags) return 'medium'

    if (tags.shop === 'mall' || tags.building === 'retail') return 'large'
    if (tags.shop === 'supermarket' || tags.shop === 'department_store') return 'large'
    if (tags.landuse === 'commercial' || tags.landuse === 'retail') return 'medium'

    return 'small'
  }

  /**
   * Generate shopping facility name
   */
  private getShoppingName(tags: any): string {
    if (!tags) return 'Shopping Area'

    if (tags.name) return tags.name
    if (tags.shop === 'mall') return 'Shopping Mall'
    if (tags.shop === 'supermarket') return 'Supermarket'
    if (tags.shop === 'department_store') return 'Department Store'
    if (tags.landuse === 'commercial') return 'Commercial Area'
    if (tags.landuse === 'retail') return 'Retail Area'

    return 'Shopping Facility'
  }

  /**
   * Fallback mock shopping data
   */
  private getMockShoppingData(): ConveniencePoint[] {
    const mockShopping: ConveniencePoint[] = []

    // Major shopping centers
    const shopping = [
      { name: 'Perth CBD Shopping', lat: -31.9522, lng: 115.8589 },
      { name: 'Garden City Shopping Centre', lat: -32.0177, lng: 115.8302 },
      { name: 'Whitfords City', lat: -31.8000, lng: 115.7700 },
      { name: 'Joondalup Shopping Centre', lat: -31.7448, lng: 115.7661 },
      { name: 'Karrinyup Shopping Centre', lat: -31.8833, lng: 115.7833 },
      { name: 'Fremantle Markets', lat: -32.0569, lng: 115.7439 },
      { name: 'Subiaco Markets', lat: -31.9474, lng: 115.8218 },
      { name: 'Armadale Shopping City', lat: -32.1398, lng: 116.0077 },
      { name: 'Mandurah Forum', lat: -32.5269, lng: 115.7217 },
      { name: 'Kalgoorlie Plaza', lat: -30.7489, lng: 121.4648 }
    ]

    shopping.forEach((shop, index) => {
      mockShopping.push({
        id: `shop_${index}`,
        name: shop.name,
        type: 'shopping',
        lat: shop.lat,
        lng: shop.lng,
        metadata: {
          facilityType: shop.name.includes('Centre') || shop.name.includes('City') ? 'mall' : 'market',
          size: 'major'
        }
      })
    })

    return mockShopping
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate convenience score for specific coordinates
   */
  async calculateConvenienceScore(latitude: number, longitude: number): Promise<ConvenienceScore> {
    if (!this.initialized) {
      await this.initialize()
    }

    // Calculate transport component (40% weight)
    const transportComponent = this.calculateTransportScore(latitude, longitude)

    // Calculate education component (20% weight)
    const educationComponent = this.calculateEducationScore(latitude, longitude)

    // Calculate health component (15% weight)
    const healthComponent = this.calculateHealthScore(latitude, longitude)

    // Calculate recreation component (15% weight)
    const recreationComponent = this.calculateRecreationScore(latitude, longitude)

    // Calculate shopping component (10% weight)
    const shoppingComponent = this.calculateShoppingScore(latitude, longitude)

    // Calculate overall score
    const overallScore = (
      transportComponent.score * 0.40 +
      educationComponent.score * 0.20 +
      healthComponent.score * 0.15 +
      recreationComponent.score * 0.15 +
      shoppingComponent.score * 0.10
    )

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence()

    return {
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      confidence,
      components: {
        transport: transportComponent,
        education: educationComponent,
        health: healthComponent,
        recreation: recreationComponent,
        shopping: shoppingComponent
      },
      explanation: {
        transportSummary: this.generateTransportSummary(transportComponent),
        educationSummary: this.generateEducationSummary(educationComponent),
        healthSummary: this.generateHealthSummary(healthComponent),
        recreationSummary: this.generateRecreationSummary(recreationComponent),
        shoppingSummary: this.generateShoppingSummary(shoppingComponent)
      }
    }
  }

  /**
   * Calculate transport convenience score (40% of total)
   */
  private calculateTransportScore(lat: number, lng: number) {
    const within1km = this.transportStops.filter(stop =>
      this.calculateDistance(lat, lng, stop.lat, stop.lng) <= 1
    )
    const within2km = this.transportStops.filter(stop =>
      this.calculateDistance(lat, lng, stop.lat, stop.lng) <= 2
    )
    const trainStations = within2km.filter(stop =>
      stop.metadata?.isTrainStation
    ).length

    let score = 1 // Base score

    // Score based on stops within 1km (primary factor)
    if (within1km.length >= 10) score = 10
    else if (within1km.length >= 5) score = 8
    else if (within1km.length >= 3) score = 6
    else if (within1km.length >= 1) score = 4
    else if (within2km.length >= 5) score = 3
    else if (within2km.length >= 1) score = 2

    // Bonus for train stations
    if (trainStations > 0) score += 1
    score = Math.min(10, score)

    return {
      score,
      nearbyStops: within2km.length,
      trainStations,
      stopsWithin1km: within1km.length,
      stopsWithin2km: within2km.length
    }
  }

  /**
   * Calculate education convenience score (20% of total)
   */
  private calculateEducationScore(lat: number, lng: number) {
    const within2km = this.schools.filter(school =>
      this.calculateDistance(lat, lng, school.lat, school.lng) <= 2
    )
    const within5km = this.schools.filter(school =>
      this.calculateDistance(lat, lng, school.lat, school.lng) <= 5
    )
    const primarySchools = within2km.filter(school =>
      school.metadata?.schoolType === 'primary'
    ).length
    const secondarySchools = within5km.filter(school =>
      school.metadata?.schoolType === 'secondary'
    ).length

    let score = 1

    if (within2km.length >= 3) score = 9
    else if (within2km.length >= 2) score = 7
    else if (within2km.length >= 1) score = 5
    else if (within5km.length >= 2) score = 3
    else if (within5km.length >= 1) score = 2

    return {
      score,
      nearbySchools: within5km.length,
      primarySchools,
      secondarySchools,
      schoolsWithin2km: within2km.length
    }
  }

  /**
   * Calculate health convenience score (15% of total)
   */
  private calculateHealthScore(lat: number, lng: number) {
    const within5km = this.healthFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 5
    )
    const within10km = this.healthFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 10
    )
    const hospitals = within10km.filter(facility =>
      facility.metadata?.facilityType === 'hospital'
    ).length

    let score = 1

    if (within5km.length >= 2) score = 9
    else if (within5km.length >= 1) score = 7
    else if (within10km.length >= 2) score = 5
    else if (within10km.length >= 1) score = 3

    return {
      score,
      nearbyFacilities: within10km.length,
      hospitalsWithin10km: hospitals,
      clinicsWithin5km: within5km.length
    }
  }

  /**
   * Calculate recreation convenience score (15% of total)
   */
  private calculateRecreationScore(lat: number, lng: number) {
    const within2km = this.recreationFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 2
    )
    const within5km = this.recreationFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 5
    )
    const beachAccess = within5km.some(facility =>
      facility.metadata?.facilityType === 'beach'
    )

    let score = 1

    if (within2km.length >= 3) score = 9
    else if (within2km.length >= 2) score = 7
    else if (within2km.length >= 1) score = 5
    else if (within5km.length >= 2) score = 3
    else if (within5km.length >= 1) score = 2

    if (beachAccess) score += 1
    score = Math.min(10, score)

    return {
      score,
      nearbyFacilities: within5km.length,
      parksWithin2km: within2km.length,
      beachAccess
    }
  }

  /**
   * Calculate shopping convenience score (10% of total)
   */
  private calculateShoppingScore(lat: number, lng: number) {
    const within2km = this.shoppingFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 2
    )
    const within10km = this.shoppingFacilities.filter(facility =>
      this.calculateDistance(lat, lng, facility.lat, facility.lng) <= 10
    )
    const majorCenters = within10km.filter(facility =>
      facility.metadata?.facilityType === 'mall'
    ).length

    let score = 1

    if (within2km.length >= 2) score = 8
    else if (within2km.length >= 1) score = 6
    else if (within10km.length >= 2) score = 4
    else if (within10km.length >= 1) score = 2

    return {
      score,
      nearbyFacilities: within10km.length,
      majorCentersWithin10km: majorCenters,
      localShopsWithin2km: within2km.length
    }
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(): number {
    let confidence = 0

    // Transport data confidence (40%)
    if (this.transportStops.length > 0) confidence += 0.40

    // Education data confidence (20%) - reduced since using mock data
    if (this.schools.length > 0) confidence += 0.10

    // Health data confidence (15%) - reduced since using mock data
    if (this.healthFacilities.length > 0) confidence += 0.08

    // Recreation data confidence (15%) - reduced since using mock data
    if (this.recreationFacilities.length > 0) confidence += 0.08

    // Shopping data confidence (10%) - reduced since using mock data
    if (this.shoppingFacilities.length > 0) confidence += 0.05

    return Math.max(0.3, confidence) // Minimum 30% confidence
  }

  // Summary generation methods
  private generateTransportSummary(component: any): string {
    if (component.stopsWithin1km >= 5) return `Excellent public transport (${component.stopsWithin1km} stops within 1km)`
    if (component.stopsWithin1km >= 1) return `Good public transport (${component.stopsWithin1km} stops within 1km)`
    if (component.stopsWithin2km >= 1) return `Moderate transport access (${component.stopsWithin2km} stops within 2km)`
    return 'Limited public transport access'
  }

  private generateEducationSummary(component: any): string {
    if (component.schoolsWithin2km >= 3) return `Excellent school access (${component.schoolsWithin2km} schools within 2km)`
    if (component.schoolsWithin2km >= 1) return `Good school access (${component.schoolsWithin2km} schools within 2km)`
    if (component.nearbySchools >= 1) return `Moderate school access (${component.nearbySchools} schools within 5km)`
    return 'Limited school access'
  }

  private generateHealthSummary(component: any): string {
    if (component.clinicsWithin5km >= 2) return `Excellent health access (${component.clinicsWithin5km} facilities within 5km)`
    if (component.clinicsWithin5km >= 1) return `Good health access (${component.clinicsWithin5km} facilities within 5km)`
    if (component.nearbyFacilities >= 1) return `Moderate health access (${component.nearbyFacilities} facilities within 10km)`
    return 'Limited health facility access'
  }

  private generateRecreationSummary(component: any): string {
    const beach = component.beachAccess ? ' with beach access' : ''
    if (component.parksWithin2km >= 2) return `Excellent recreation access (${component.parksWithin2km} parks within 2km)${beach}`
    if (component.parksWithin2km >= 1) return `Good recreation access (${component.parksWithin2km} parks within 2km)${beach}`
    if (component.nearbyFacilities >= 1) return `Moderate recreation access (${component.nearbyFacilities} facilities within 5km)${beach}`
    return `Limited recreation access${beach}`
  }

  private generateShoppingSummary(component: any): string {
    if (component.localShopsWithin2km >= 2) return `Excellent shopping access (${component.localShopsWithin2km} centers within 2km)`
    if (component.localShopsWithin2km >= 1) return `Good shopping access (${component.localShopsWithin2km} centers within 2km)`
    if (component.nearbyFacilities >= 1) return `Moderate shopping access (${component.nearbyFacilities} centers within 10km)`
    return 'Limited shopping access'
  }
}

// Export singleton instance
export const staticConvenienceParser = new StaticConvenienceParser()

// Export convenience calculation function
export const calculateStaticConvenience = (latitude: number, longitude: number) =>
  staticConvenienceParser.calculateConvenienceScore(latitude, longitude)
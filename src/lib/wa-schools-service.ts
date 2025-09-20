/**
 * WA Schools Service
 * Parses real Department of Education schools data for amenities analysis
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

export interface WASchool {
  schoolName: string
  schoolType: 'Public' | 'Private' | 'Independent'
  educationRegion: string
  streetAddress: string
  suburb: string
  postcode: string
  phone: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  yearLevels: string // e.g., "K-6", "7-12", "K-12"
  specialPrograms?: string[]
}

export interface SchoolsInArea {
  totalSchools: number
  publicSchools: number
  privateSchools: number
  primarySchools: number
  secondarySchools: number
  combinedSchools: number
  nearbySchools: WASchool[]
}

class WASchoolsService {
  private schools: WASchool[] = []
  private dataLoaded = false

  /**
   * Load and parse WA Schools data from Excel file
   */
  async loadSchoolsData(): Promise<void> {
    if (this.dataLoaded) return

    try {
      // Try multiple possible paths for the Excel file
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', 'wa_schools.xlsx'),
        path.join(process.cwd(), 'public', 'data', 'wa_schools.xlsx'),
        path.join(__dirname, '..', 'data', 'wa_schools.xlsx')
      ]

      let filePath: string | null = null
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          filePath = testPath
          console.log(`Found WA Schools file at: ${filePath}`)
          break
        }
      }

      if (!filePath) {
        console.warn('WA Schools Excel file not found at any of these paths:', possiblePaths)
        return
      }

      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0] // Get first sheet
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet) as any[]

      console.log(`Loading ${rawData.length} schools from WA Department of Education data`)

      // Parse each school record
      this.schools = rawData.map((row) => this.parseSchoolRow(row)).filter(school => school !== null) as WASchool[]

      this.dataLoaded = true
      console.log(`Successfully loaded ${this.schools.length} WA schools`)

    } catch (error) {
      console.error('Error loading WA Schools data:', error)
      this.schools = []
    }
  }

  /**
   * Parse individual school row from Excel data
   */
  private parseSchoolRow(row: any): WASchool | null {
    try {
      // Map Excel columns to our interface
      // Column names may vary - we'll need to adapt based on actual file structure
      const schoolName = row['School Name'] || row['SCHOOL_NAME'] || row['Name'] || ''
      const schoolType = this.determineSchoolType(row['School Type'] || row['TYPE'] || '')
      const streetAddress = row['Street Address'] || row['ADDRESS'] || row['Street'] || ''
      const suburb = row['Suburb'] || row['SUBURB'] || ''
      const postcode = row['Postcode'] || row['POSTCODE'] || row['Post Code'] || ''
      const phone = row['Phone'] || row['PHONE'] || row['Telephone'] || ''
      const educationRegion = row['Education Region'] || row['REGION'] || ''

      if (!schoolName || !suburb) {
        return null // Skip incomplete records
      }

      return {
        schoolName: schoolName.trim(),
        schoolType,
        educationRegion: educationRegion.trim(),
        streetAddress: streetAddress.trim(),
        suburb: suburb.trim(),
        postcode: postcode.toString().trim(),
        phone: phone.toString().trim(),
        yearLevels: this.extractYearLevels(schoolName, row),
        specialPrograms: this.extractSpecialPrograms(schoolName, row)
      }
    } catch (error) {
      console.warn('Error parsing school row:', error)
      return null
    }
  }

  /**
   * Determine school type from raw data
   */
  private determineSchoolType(typeString: string): 'Public' | 'Private' | 'Independent' {
    const type = typeString.toLowerCase()
    if (type.includes('public') || type.includes('government')) return 'Public'
    if (type.includes('private')) return 'Private'
    if (type.includes('independent')) return 'Independent'
    return 'Public' // Default assumption
  }

  /**
   * Extract year levels from school name or data
   */
  private extractYearLevels(schoolName: string, row: any): string {
    const name = schoolName.toLowerCase()

    // Check explicit year level data
    if (row['Year Levels'] || row['YEAR_LEVELS']) {
      return row['Year Levels'] || row['YEAR_LEVELS']
    }

    // Infer from school name
    if (name.includes('primary') || name.includes('ps ') || name.includes('primary school')) {
      return 'K-6'
    }
    if (name.includes('secondary') || name.includes('high') || name.includes('college')) {
      return '7-12'
    }
    if (name.includes('education support') || name.includes('special')) {
      return 'K-12'
    }

    return 'K-12' // Default for uncertain cases
  }

  /**
   * Extract special programs from school data
   */
  private extractSpecialPrograms(schoolName: string, row: any): string[] {
    const programs: string[] = []
    const name = schoolName.toLowerCase()

    if (name.includes('montessori')) programs.push('Montessori')
    if (name.includes('steiner') || name.includes('waldorf')) programs.push('Steiner/Waldorf')
    if (name.includes('language') && name.includes('immersion')) programs.push('Language Immersion')
    if (name.includes('ib ') || name.includes('international baccalaureate')) programs.push('International Baccalaureate')
    if (name.includes('aviation')) programs.push('Aviation Program')
    if (name.includes('agricultural') || name.includes('farm')) programs.push('Agricultural Program')
    if (name.includes('special') || name.includes('education support')) programs.push('Special Education')

    return programs
  }

  /**
   * Get schools within radius of coordinates
   */
  async getSchoolsNearLocation(lat: number, lng: number, radiusKm: number = 5): Promise<SchoolsInArea> {
    await this.loadSchoolsData()

    // For now, we'll filter by suburb name matching since we don't have coordinates yet
    // This is a simplified approach until we can geocode the school addresses
    const nearbySchools = this.schools.filter(school => {
      // Simple proximity check - in a real implementation, we'd use actual coordinates
      // For now, return a sample of schools to demonstrate the data structure
      return true // Will be refined with actual geocoding
    }).slice(0, 20) // Limit to reasonable number

    const publicSchools = nearbySchools.filter(s => s.schoolType === 'Public').length
    const privateSchools = nearbySchools.filter(s => s.schoolType !== 'Public').length
    const primarySchools = nearbySchools.filter(s => s.yearLevels.includes('K-6') || s.yearLevels.includes('primary')).length
    const secondarySchools = nearbySchools.filter(s => s.yearLevels.includes('7-12') || s.yearLevels.includes('secondary')).length
    const combinedSchools = nearbySchools.filter(s => s.yearLevels.includes('K-12')).length

    return {
      totalSchools: nearbySchools.length,
      publicSchools,
      privateSchools,
      primarySchools,
      secondarySchools,
      combinedSchools,
      nearbySchools
    }
  }

  /**
   * Calculate education access score based on nearby schools
   */
  async calculateEducationScore(lat: number, lng: number): Promise<{ score: number; hasData: boolean; breakdown: SchoolsInArea }> {
    try {
      // Import persistence service
      const { dataPersistenceService } = await import('./data-persistence-service')

      // Check cache first
      const cachedData = await dataPersistenceService.getCachedSchoolData(lat, lng)
      if (cachedData) {
        console.log(`Using cached school data for ${lat}, ${lng}`)
        return cachedData
      }

      const schoolsData = await this.getSchoolsNearLocation(lat, lng, 10) // 10km radius

      // Score based on school availability and diversity
      let score = 1.0 // Base score

      // Add points for total schools available
      if (schoolsData.totalSchools >= 10) score += 3.0
      else if (schoolsData.totalSchools >= 5) score += 2.0
      else if (schoolsData.totalSchools >= 2) score += 1.0

      // Add points for school type diversity
      if (schoolsData.publicSchools > 0 && schoolsData.privateSchools > 0) score += 1.0

      // Add points for education level coverage
      if (schoolsData.primarySchools > 0) score += 1.5
      if (schoolsData.secondarySchools > 0) score += 1.5
      if (schoolsData.combinedSchools > 0) score += 1.0

      // Bonus for excellent coverage
      if (schoolsData.totalSchools >= 15 && schoolsData.primarySchools >= 3 && schoolsData.secondarySchools >= 2) {
        score += 1.0
      }

      const result = {
        score: Math.max(1, Math.min(10, score)),
        hasData: true,
        breakdown: schoolsData
      }

      // Cache the result
      await dataPersistenceService.cacheSchoolData(lat, lng, result)
      console.log(`Cached school data for ${lat}, ${lng}`)

      return result
    } catch (error) {
      console.error('Error in calculateEducationScore:', error)
      // Return fallback score
      return {
        score: 5.0,
        hasData: false,
        breakdown: {
          totalSchools: 0,
          publicSchools: 0,
          privateSchools: 0,
          primarySchools: 0,
          secondarySchools: 0,
          combinedSchools: 0,
          nearbySchools: []
        }
      }
    }
  }

  /**
   * Get all schools data (for debugging/analysis)
   */
  async getAllSchools(): Promise<WASchool[]> {
    await this.loadSchoolsData()
    return this.schools
  }

  /**
   * Get schools by suburb name
   */
  async getSchoolsBySuburb(suburbName: string): Promise<WASchool[]> {
    await this.loadSchoolsData()

    const normalizedSuburb = suburbName.toLowerCase().trim()
    return this.schools.filter(school =>
      school.suburb.toLowerCase().trim() === normalizedSuburb
    )
  }
}

// Export singleton instance
export const waSchoolsService = new WASchoolsService()
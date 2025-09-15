/**
 * WA Police Crime Data Excel Parser
 *
 * Handles downloading and parsing WA Police Crime Time Series Excel files
 * Data source: https://www.wa.gov.au/organisation/western-australia-police-force/crime-statistics
 */

import * as XLSX from 'xlsx'

/**
 * Raw crime data record from WA Police Excel files
 */
export interface RawCrimeDataRecord {
  location: string              // Police district or locality name
  offenceType: string          // Crime category (e.g., "Burglary", "Assault")
  offenceSubType?: string      // Sub-category if available
  year: number                 // Calendar year
  month?: number               // Month (if monthly data available)
  quarter?: number             // Quarter (Q1, Q2, Q3, Q4)
  offenceCount: number         // Number of reported offences
  rate?: number                // Rate per 100,000 population (if available)
  populationBase?: number      // Population base for rate calculation
}

/**
 * Processed crime data with geographic metadata
 */
export interface ProcessedCrimeData {
  id: string                   // Unique identifier
  location: string             // Police district/locality
  locationCode?: string        // Police district code (if available)
  locationLevel: 'state' | 'region' | 'district' | 'locality'

  // Crime statistics
  totalOffences: number        // Total offences in period
  offencesByCategory: {
    [category: string]: number // Offences by crime type
  }

  // Rate calculations
  crimeRate: number            // Overall crime rate per 100,000
  ratesByCategory: {
    [category: string]: number // Rates by crime type
  }

  // Temporal data
  reportPeriod: {
    startDate: string          // ISO date string
    endDate: string            // ISO date string
    periodType: 'monthly' | 'quarterly' | 'annual'
  }

  // Data quality
  dataQuality: {
    completeness: number       // 0-1 score for data completeness
    lastUpdated: string        // ISO timestamp
    sourceVersion: string      // Version of source Excel file
  }
}

/**
 * Crime data downloader and parser configuration
 */
export interface CrimeParserConfig {
  // Download settings
  downloadUrl?: string         // Override default WA Police URL
  userAgent?: string          // Custom user agent for requests
  timeout?: number            // Request timeout in milliseconds

  // Parsing settings
  expectedSheets?: string[]   // Expected sheet names in Excel file
  dateFormat?: string         // Expected date format in data
  locationMapping?: Map<string, string> // Custom location name mappings

  // Validation settings
  minExpectedRecords?: number // Minimum records for quality check
  validateColumns?: boolean   // Strict column validation
  skipEmptyRows?: boolean     // Skip rows with missing data
}

/**
 * Excel file parsing result
 */
export interface ExcelParseResult {
  success: boolean
  data?: RawCrimeDataRecord[]
  metadata?: {
    fileName: string
    fileSize: number
    sheetsFound: string[]
    recordCount: number
    dateRange: {
      earliest: string
      latest: string
    }
  }
  errors?: string[]
  warnings?: string[]
}

/**
 * Default configuration for WA Police crime data parsing
 */
const DEFAULT_CONFIG: CrimeParserConfig = {
  timeout: 30000,
  expectedSheets: ['Crime Time Series', 'Data', 'Sheet1'],
  minExpectedRecords: 100,
  validateColumns: true,
  skipEmptyRows: true,
  userAgent: 'MyInvestmentApp/1.0 (Crime Data Analysis)'
}

/**
 * Download WA Police crime data Excel file
 */
export async function downloadCrimeDataFile(
  config: CrimeParserConfig = {}
): Promise<ArrayBuffer> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // WA Police crime statistics download URL
  // Note: This URL may need to be updated based on actual WA Police website structure
  const downloadUrl = config.downloadUrl ||
    'https://www.wa.gov.au/system/files/2024-08/crime-time-series-data.xlsx'

  try {
    console.log('Downloading WA Police crime data from:', downloadUrl)

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': mergedConfig.userAgent!,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
      },
      signal: AbortSignal.timeout(mergedConfig.timeout!)
    })

    if (!response.ok) {
      throw new Error(`Failed to download crime data: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('excel') && !contentType.includes('spreadsheet')) {
      console.warn('Unexpected content type:', contentType)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log(`Downloaded ${arrayBuffer.byteLength} bytes of crime data`)

    return arrayBuffer

  } catch (error) {
    console.error('Error downloading crime data:', error)
    throw new Error(`Crime data download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse WA Police Excel file into structured crime data
 */
export async function parseExcelCrimeData(
  fileData: ArrayBuffer,
  config: CrimeParserConfig = {}
): Promise<ExcelParseResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    console.log('Parsing Excel crime data file...')

    // Read Excel file
    const workbook = XLSX.read(fileData, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    })

    const sheetNames = workbook.SheetNames
    console.log('Found Excel sheets:', sheetNames)

    // Find the main data sheet
    let targetSheet = null
    let targetSheetName = ''

    for (const expectedName of mergedConfig.expectedSheets!) {
      const foundSheet = sheetNames.find(name =>
        name.toLowerCase().includes(expectedName.toLowerCase())
      )
      if (foundSheet) {
        targetSheet = workbook.Sheets[foundSheet]
        targetSheetName = foundSheet
        break
      }
    }

    // If no expected sheet found, use the first sheet
    if (!targetSheet && sheetNames.length > 0) {
      targetSheetName = sheetNames[0]
      targetSheet = workbook.Sheets[targetSheetName]
      console.warn(`Using first sheet "${targetSheetName}" as no expected sheet found`)
    }

    if (!targetSheet) {
      throw new Error('No usable sheet found in Excel file')
    }

    console.log(`Parsing data from sheet: "${targetSheetName}"`)

    // Convert sheet to JSON
    const rawData = XLSX.utils.sheet_to_json(targetSheet, {
      header: 1,          // Use array of arrays format
      defval: '',         // Default value for empty cells
      blankrows: false,   // Skip blank rows
      raw: false          // Use formatted values
    }) as any[][]

    if (rawData.length === 0) {
      throw new Error('No data found in Excel sheet')
    }

    // Extract headers (first non-empty row)
    let headerRowIndex = 0
    let headers: string[] = []

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i]
      if (row && row.length > 0 && row.some(cell => cell && cell.toString().trim())) {
        // Check if this looks like a header row
        const nonEmptyCount = row.filter(cell => cell && cell.toString().trim()).length
        if (nonEmptyCount >= 3) { // At least 3 non-empty columns
          headers = row.map(cell => (cell || '').toString().trim())
          headerRowIndex = i
          break
        }
      }
    }

    if (headers.length === 0) {
      throw new Error('No valid header row found in Excel file')
    }

    console.log('Found headers:', headers)

    // Parse data rows
    const records: RawCrimeDataRecord[] = []
    const dataRows = rawData.slice(headerRowIndex + 1)

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row || row.length === 0) continue

      try {
        const record = parseDataRow(row, headers, mergedConfig)
        if (record) {
          records.push(record)
        }
      } catch (error) {
        console.warn(`Error parsing row ${i + headerRowIndex + 2}:`, error)
      }
    }

    // Calculate metadata
    const years = records.map(r => r.year).filter(y => y)
    const earliestYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear()
    const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear()

    const result: ExcelParseResult = {
      success: true,
      data: records,
      metadata: {
        fileName: 'crime-data.xlsx', // Would be actual filename in real implementation
        fileSize: fileData.byteLength,
        sheetsFound: sheetNames,
        recordCount: records.length,
        dateRange: {
          earliest: `${earliestYear}-01-01`,
          latest: `${latestYear}-12-31`
        }
      },
      warnings: []
    }

    // Validation
    if (mergedConfig.minExpectedRecords && records.length < mergedConfig.minExpectedRecords) {
      result.warnings?.push(`Only ${records.length} records found, expected at least ${mergedConfig.minExpectedRecords}`)
    }

    console.log(`Successfully parsed ${records.length} crime data records`)
    return result

  } catch (error) {
    console.error('Error parsing Excel crime data:', error)

    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown parsing error']
    }
  }
}

/**
 * Parse individual data row into crime record
 */
function parseDataRow(
  row: any[],
  headers: string[],
  config: CrimeParserConfig
): RawCrimeDataRecord | null {
  if (!row || row.length === 0) return null

  // Create object from headers and row data
  const rowData: { [key: string]: any } = {}
  for (let i = 0; i < headers.length && i < row.length; i++) {
    if (headers[i]) {
      rowData[headers[i].toLowerCase().trim()] = row[i]
    }
  }

  // Skip rows with insufficient data
  if (config.skipEmptyRows) {
    const nonEmptyCount = Object.values(rowData).filter(v =>
      v !== null && v !== undefined && v.toString().trim() !== ''
    ).length

    if (nonEmptyCount < 3) return null
  }

  try {
    // Extract location (try various possible column names)
    const location = findColumnValue(rowData, [
      'location', 'district', 'police district', 'area', 'region', 'locality'
    ]) || 'Unknown'

    // Extract offence type
    const offenceType = findColumnValue(rowData, [
      'offence', 'offence type', 'crime type', 'category', 'offence category'
    ]) || 'Unknown'

    // Extract year
    const yearValue = findColumnValue(rowData, [
      'year', 'calendar year', 'cy', 'date'
    ])

    let year = new Date().getFullYear()
    if (yearValue) {
      if (typeof yearValue === 'number') {
        year = yearValue
      } else if (yearValue instanceof Date) {
        year = yearValue.getFullYear()
      } else {
        const parsed = parseInt(yearValue.toString())
        if (!isNaN(parsed) && parsed > 2000 && parsed < 2030) {
          year = parsed
        }
      }
    }

    // Extract offence count
    const countValue = findColumnValue(rowData, [
      'count', 'offences', 'number', 'total', 'offence count'
    ])

    let offenceCount = 0
    if (countValue !== null && countValue !== undefined) {
      const parsed = typeof countValue === 'number' ? countValue : parseFloat(countValue.toString())
      if (!isNaN(parsed) && parsed >= 0) {
        offenceCount = Math.round(parsed)
      }
    }

    // Extract rate (if available)
    const rateValue = findColumnValue(rowData, [
      'rate', 'rate per 100000', 'crime rate', 'per 100k'
    ])

    let rate: number | undefined
    if (rateValue !== null && rateValue !== undefined) {
      const parsed = typeof rateValue === 'number' ? rateValue : parseFloat(rateValue.toString())
      if (!isNaN(parsed) && parsed >= 0) {
        rate = parsed
      }
    }

    // Extract quarter/month (if available)
    const quarterValue = findColumnValue(rowData, ['quarter', 'q'])
    const monthValue = findColumnValue(rowData, ['month', 'mon'])

    let quarter: number | undefined
    let month: number | undefined

    if (quarterValue) {
      const qParsed = parseInt(quarterValue.toString().replace(/[^\d]/g, ''))
      if (!isNaN(qParsed) && qParsed >= 1 && qParsed <= 4) {
        quarter = qParsed
      }
    }

    if (monthValue) {
      const mParsed = parseInt(monthValue.toString())
      if (!isNaN(mParsed) && mParsed >= 1 && mParsed <= 12) {
        month = mParsed
      }
    }

    const record: RawCrimeDataRecord = {
      location: location.toString().trim(),
      offenceType: offenceType.toString().trim(),
      year,
      offenceCount,
      ...(quarter && { quarter }),
      ...(month && { month }),
      ...(rate && { rate })
    }

    return record

  } catch (error) {
    console.warn('Error parsing data row:', error, rowData)
    return null
  }
}

/**
 * Find column value by trying multiple possible column names
 */
function findColumnValue(rowData: { [key: string]: any }, possibleNames: string[]): any {
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase()

    // Exact match
    if (rowData[lowerName] !== undefined) {
      return rowData[lowerName]
    }

    // Partial match
    for (const [key, value] of Object.entries(rowData)) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return value
      }
    }
  }

  return null
}

/**
 * Process raw crime data into application format
 */
export function processCrimeData(
  rawData: RawCrimeDataRecord[],
  config: CrimeParserConfig = {}
): ProcessedCrimeData[] {
  console.log(`Processing ${rawData.length} raw crime records...`)

  // Group data by location and time period
  const groupedData = new Map<string, RawCrimeDataRecord[]>()

  for (const record of rawData) {
    // Create grouping key: location + year + (quarter if available)
    const periodKey = record.quarter ? `${record.year}-Q${record.quarter}` : `${record.year}`
    const groupKey = `${record.location}|${periodKey}`

    if (!groupedData.has(groupKey)) {
      groupedData.set(groupKey, [])
    }
    groupedData.get(groupKey)!.push(record)
  }

  const processedData: ProcessedCrimeData[] = []

  for (const [groupKey, records] of groupedData) {
    try {
      const processed = processLocationGroup(groupKey, records)
      if (processed) {
        processedData.push(processed)
      }
    } catch (error) {
      console.warn(`Error processing group ${groupKey}:`, error)
    }
  }

  console.log(`Processed into ${processedData.length} location-period records`)
  return processedData
}

/**
 * Process a group of records for the same location and time period
 */
function processLocationGroup(
  groupKey: string,
  records: RawCrimeDataRecord[]
): ProcessedCrimeData | null {
  if (records.length === 0) return null

  const [location, period] = groupKey.split('|')
  const firstRecord = records[0]

  // Aggregate offences by category
  const offencesByCategory: { [category: string]: number } = {}
  let totalOffences = 0

  for (const record of records) {
    const category = normalizeOffenceCategory(record.offenceType)
    offencesByCategory[category] = (offencesByCategory[category] || 0) + record.offenceCount
    totalOffences += record.offenceCount
  }

  // Calculate rates (simplified - would need population data for accurate rates)
  const ratesByCategory: { [category: string]: number } = {}
  for (const [category, count] of Object.entries(offencesByCategory)) {
    // Placeholder rate calculation - would need actual population data
    ratesByCategory[category] = count * 100000 / 100000 // Simplified for now
  }

  // Determine location level
  const locationLevel = determineLocationLevel(location)

  // Create period information
  const year = firstRecord.year
  const quarter = firstRecord.quarter

  let startDate: string, endDate: string, periodType: 'monthly' | 'quarterly' | 'annual'

  if (quarter) {
    const quarterStart = new Date(year, (quarter - 1) * 3, 1)
    const quarterEnd = new Date(year, quarter * 3, 0) // Last day of quarter
    startDate = quarterStart.toISOString().split('T')[0]
    endDate = quarterEnd.toISOString().split('T')[0]
    periodType = 'quarterly'
  } else {
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
    periodType = 'annual'
  }

  const processed: ProcessedCrimeData = {
    id: `${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${period.toLowerCase()}`,
    location: location,
    locationLevel,
    totalOffences,
    offencesByCategory,
    crimeRate: totalOffences * 100000 / 100000, // Simplified - needs real population
    ratesByCategory,
    reportPeriod: {
      startDate,
      endDate,
      periodType
    },
    dataQuality: {
      completeness: calculateCompleteness(records),
      lastUpdated: new Date().toISOString(),
      sourceVersion: 'unknown' // Would be extracted from file metadata
    }
  }

  return processed
}

/**
 * Normalize offence category names for consistency
 */
function normalizeOffenceCategory(offenceType: string): string {
  const normalized = offenceType.toLowerCase().trim()

  // Map common variations to standard categories
  const categoryMappings: { [key: string]: string } = {
    'burglary': 'Property Crime',
    'break and enter': 'Property Crime',
    'stealing': 'Property Crime',
    'theft': 'Property Crime',
    'robbery': 'Property Crime',
    'motor vehicle theft': 'Property Crime',

    'assault': 'Violent Crime',
    'grievous bodily harm': 'Violent Crime',
    'sexual assault': 'Violent Crime',
    'homicide': 'Violent Crime',
    'threatening behaviour': 'Violent Crime',

    'drug offences': 'Drug Crime',
    'drug possession': 'Drug Crime',
    'drug trafficking': 'Drug Crime',

    'drink driving': 'Traffic Crime',
    'dangerous driving': 'Traffic Crime',
    'traffic offences': 'Traffic Crime',

    'public order': 'Other Crime',
    'disorderly conduct': 'Other Crime',
    'weapons offences': 'Other Crime'
  }

  // Try exact match first
  if (categoryMappings[normalized]) {
    return categoryMappings[normalized]
  }

  // Try partial matches
  for (const [pattern, category] of Object.entries(categoryMappings)) {
    if (normalized.includes(pattern)) {
      return category
    }
  }

  // Default to original if no mapping found
  return offenceType.trim()
}

/**
 * Determine geographic level of location
 */
function determineLocationLevel(location: string): 'state' | 'region' | 'district' | 'locality' {
  const lower = location.toLowerCase()

  if (lower.includes('western australia') || lower.includes('wa state')) {
    return 'state'
  }

  if (lower.includes('metropolitan') || lower.includes('regional')) {
    return 'region'
  }

  if (lower.includes('district') || lower.includes('police district')) {
    return 'district'
  }

  return 'locality'
}

/**
 * Calculate data completeness score
 */
function calculateCompleteness(records: RawCrimeDataRecord[]): number {
  if (records.length === 0) return 0

  let totalFields = 0
  let completedFields = 0

  for (const record of records) {
    totalFields += 5 // location, offenceType, year, offenceCount, + one optional

    if (record.location && record.location.trim()) completedFields++
    if (record.offenceType && record.offenceType.trim()) completedFields++
    if (record.year && record.year > 2000) completedFields++
    if (record.offenceCount >= 0) completedFields++
    if (record.rate !== undefined || record.quarter !== undefined || record.month !== undefined) {
      completedFields++
    }
  }

  return completedFields / totalFields
}

/**
 * Validate parsed crime data quality
 */
export function validateCrimeData(data: ProcessedCrimeData[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  qualityScore: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (data.length === 0) {
    errors.push('No crime data found')
    return { isValid: false, errors, warnings, qualityScore: 0 }
  }

  // Check for data coverage
  const locations = new Set(data.map(d => d.location))
  const years = new Set(data.map(d => new Date(d.reportPeriod.startDate).getFullYear()))

  if (locations.size < 5) {
    warnings.push(`Only ${locations.size} locations found, expected more geographic coverage`)
  }

  if (years.size < 2) {
    warnings.push(`Only ${years.size} years of data found, limited temporal coverage`)
  }

  // Check data quality scores
  const qualityScores = data.map(d => d.dataQuality.completeness)
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length

  if (avgQuality < 0.7) {
    warnings.push(`Average data quality score is ${(avgQuality * 100).toFixed(1)}%, below recommended 70%`)
  }

  // Check for suspicious data patterns
  const suspiciousRecords = data.filter(d => d.totalOffences > 10000 || d.crimeRate > 50000)
  if (suspiciousRecords.length > 0) {
    warnings.push(`${suspiciousRecords.length} records have unusually high crime counts, please verify`)
  }

  const qualityScore = Math.min(1.0, avgQuality * (1 - errors.length * 0.2) * (1 - warnings.length * 0.05))

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore
  }
}
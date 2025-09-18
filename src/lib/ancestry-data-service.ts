/**
 * Ancestry and Demographics Data Service
 * Loads and processes G09A (Country of Birth) census data
 */

export interface AncestryData {
  australia: number
  england: number
  china: number
  india: number
  italy: number
  ireland: number
  scotland: number
  germany: number
  philippines: number
  vietnam: number
  other: number
}

export interface CrimeTrendData {
  period: string
  totalCrime: number
  violentCrime: number
  propertyCrime: number
  drugCrime: number
  trafficCrime: number
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  percentage: number
  confidence: number
  reason: string
}

/**
 * Parse ancestry data from G09A census table for a specific SA2 code
 */
export function parseAncestryData(sa2Code: string, headers: string[], dataRow: string[]): AncestryData | null {
  if (!headers || !dataRow || dataRow[0] !== sa2Code) return null

  // Find total columns for each country (sum male and female)
  const getCountryTotal = (country: string): number => {
    const maleIndex = headers.findIndex(h => h === `M_${country}_Tot`)
    const femaleIndex = headers.findIndex(h => h === `F_${country}_Tot`)

    const maleTotal = maleIndex >= 0 ? parseInt(dataRow[maleIndex]) || 0 : 0
    const femaleTotal = femaleIndex >= 0 ? parseInt(dataRow[femaleIndex]) || 0 : 0

    return maleTotal + femaleTotal
  }

  // Map major ancestry groups
  const ancestryData: AncestryData = {
    australia: getCountryTotal('Australia'),
    england: getCountryTotal('England'),
    china: getCountryTotal('China'),
    india: getCountryTotal('India'),
    italy: getCountryTotal('Italy'),
    ireland: getCountryTotal('Ireland'),
    scotland: getCountryTotal('Scotland'),
    germany: getCountryTotal('Germany'),
    philippines: getCountryTotal('Philippines'),
    vietnam: getCountryTotal('Vietnam'),
    other: 0 // Will calculate as remainder
  }

  // Calculate "other" as remainder from total population
  const knownTotal = Object.values(ancestryData).reduce((sum, val) => sum + val, 0) - ancestryData.other
  const totalPopulation = knownTotal > 0 ? knownTotal * 1.3 : 0 // Estimate including other countries
  ancestryData.other = Math.max(0, Math.round(totalPopulation - knownTotal))

  return ancestryData
}

/**
 * Generate mock crime trend data (until real historical data is integrated)
 */
export function generateMockCrimeTrends(baseRating: number): CrimeTrendData[] {
  const periods = ['2019', '2020', '2021', '2022', '2023']
  const trends: CrimeTrendData[] = []

  // Base crime rate (inversely related to safety rating)
  const baseCrimeRate = Math.round(50 - (baseRating * 4))

  for (let i = 0; i < periods.length; i++) {
    // Add some variation and trend
    const variation = (Math.random() - 0.5) * 10
    const trendFactor = baseRating >= 7 ? -0.5 * i : baseRating <= 4 ? 0.5 * i : 0
    const totalCrime = Math.max(5, Math.round(baseCrimeRate + variation + trendFactor))

    trends.push({
      period: periods[i],
      totalCrime,
      violentCrime: Math.round(totalCrime * 0.15),
      propertyCrime: Math.round(totalCrime * 0.45),
      drugCrime: Math.round(totalCrime * 0.20),
      trafficCrime: Math.round(totalCrime * 0.20)
    })
  }

  return trends
}

/**
 * Analyze crime trend direction and generate explanation
 */
export function analyzeCrimeTrend(trendData: CrimeTrendData[]): TrendAnalysis {
  if (trendData.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      confidence: 0.5,
      reason: 'Insufficient data for trend analysis'
    }
  }

  const firstYear = trendData[0].totalCrime
  const lastYear = trendData[trendData.length - 1].totalCrime
  const change = lastYear - firstYear
  const percentage = firstYear > 0 ? (change / firstYear) * 100 : 0

  let direction: 'increasing' | 'decreasing' | 'stable'
  let reason: string

  if (Math.abs(percentage) < 5) {
    direction = 'stable'
    reason = 'Crime rates have remained relatively stable over the analysis period'
  } else if (percentage > 0) {
    direction = 'increasing'
    reason = `Crime rates have increased over the ${trendData.length} year period`
  } else {
    direction = 'decreasing'
    reason = `Crime rates have decreased over the ${trendData.length} year period`
  }

  // Calculate confidence based on data consistency
  const consistency = calculateTrendConsistency(trendData)
  const confidence = Math.min(0.9, 0.5 + consistency * 0.4)

  return {
    direction,
    percentage,
    confidence,
    reason
  }
}

/**
 * Calculate how consistent the trend is (0-1 scale)
 */
function calculateTrendConsistency(data: CrimeTrendData[]): number {
  if (data.length < 3) return 0.5

  const changes = []
  for (let i = 1; i < data.length; i++) {
    const change = data[i].totalCrime - data[i-1].totalCrime
    changes.push(change)
  }

  // Check if changes are in the same direction
  const positiveChanges = changes.filter(c => c > 0).length
  const negativeChanges = changes.filter(c => c < 0).length
  const totalChanges = changes.length

  const consistency = Math.max(positiveChanges, negativeChanges) / totalChanges
  return consistency
}

/**
 * Load ancestry data for a specific SA2 code (optimized for large files)
 */
export async function loadAncestryDataForSA2(sa2Code: string): Promise<AncestryData | null> {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const readline = await import('readline')

    const csvPath = path.join(process.cwd(), 'src/data/2021 Census GCP All Geographies for WA/SA2/WA/2021Census_G09A_WA_SA2.csv')

    if (!fs.existsSync(csvPath)) {
      console.log('G09A ancestry data file not found')
      return null
    }

    // Use readline for efficient processing of large files
    const fileStream = fs.createReadStream(csvPath)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    let headers: string[] = []
    let targetRow: string[] | null = null
    let lineNumber = 0

    for await (const line of rl) {
      if (lineNumber === 0) {
        headers = line.split(',')
      } else {
        const cols = line.split(',')
        if (cols[0] === sa2Code) {
          targetRow = cols
          break
        }
      }
      lineNumber++
    }

    rl.close()

    if (!targetRow) {
      return null
    }

    return parseAncestryData(sa2Code, headers, targetRow)
  } catch (error) {
    console.error('Failed to load ancestry data:', error)
    return null
  }
}

/**
 * Quick test to check if ancestry data is available
 */
export async function testAncestryDataAccess(): Promise<{success: boolean, info?: any, error?: string}> {
  try {
    const fs = await import('fs')
    const path = await import('path')

    const csvPath = path.join(process.cwd(), 'src/data/2021 Census GCP All Geographies for WA/SA2/WA/2021Census_G09A_WA_SA2.csv')

    if (!fs.existsSync(csvPath)) {
      return {
        success: false,
        error: 'G09A ancestry data file not found'
      }
    }

    const stats = fs.statSync(csvPath)

    // Read just the first few lines for testing
    const firstChunk = fs.readFileSync(csvPath, { encoding: 'utf-8', start: 0, end: 1000 })
    const firstLines = firstChunk.split('\n').slice(0, 3)
    const headers = firstLines[0].split(',')

    return {
      success: true,
      info: {
        file_size: stats.size,
        sample_headers: headers.slice(0, 10),
        countries_available: headers.filter(h => h.endsWith('_Tot')).length / 2, // Divide by 2 for male/female
        sample_sa2: firstLines[1]?.split(',')[0] || 'None'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Convert safety rating trend score to meaningful explanation
 */
export function explainTrendScore(score: number, trendData?: CrimeTrendData[]): {
  description: string,
  analysis: TrendAnalysis | null
} {
  const analysis = trendData ? analyzeCrimeTrend(trendData) : null

  let description: string

  if (score >= 8) {
    description = analysis?.direction === 'decreasing' ?
      'Excellent trend - crime rates are actively improving in this area' :
      'Very good trend - this area maintains consistently low crime rates'
  } else if (score >= 6) {
    description = 'Stable trend - crime rates are relatively consistent with minor fluctuations'
  } else if (score >= 4) {
    description = analysis?.direction === 'increasing' ?
      'Monitoring required - crime rates are showing an upward trend' :
      'Mixed signals - crime data shows some concerning patterns'
  } else {
    description = 'Declining trend - this area is experiencing increasing crime rates and requires attention'
  }

  return { description, analysis }
}
/**
 * ABS (Australian Bureau of Statistics) API Integration
 *
 * Provides utilities for fetching real Australian Census data
 * from the ABS Data API (Beta) - Updated Nov 2024
 */

const ABS_BASE_URL = 'https://data.api.abs.gov.au/rest'

/**
 * Discovered ABS Dataflow IDs from API testing (2025-09-15)
 */
export const ABS_DATAFLOWS = {
  census2021: {
    // Demographics (Person Characteristics by Sex) at different geographic levels
    g01: {
      sa2: 'C21_G01_SA2',  // Statistical Area 2 (suburb level)
      sa3: 'C21_G01_SA3',  // Statistical Area 3 (region level)
      lga: 'C21_G01_LGA',  // Local Government Area
      poa: 'C21_G01_POA',  // Postcode Area
      ced: 'C21_G01_CED',  // Commonwealth Electoral Division
    },
    // Economics (Selected Medians and Averages) at different geographic levels
    g02: {
      sa2: 'C21_G02_SA2',  // Statistical Area 2 (suburb level)
      sa3: 'C21_G02_SA3',  // Statistical Area 3 (region level)
      lga: 'C21_G02_LGA',  // Local Government Area
      poa: 'C21_G02_POA',  // Postcode Area
      ced: 'C21_G02_CED',  // Commonwealth Electoral Division
    }
  },
  census2016: {
    // Legacy format for 2016 census (different naming pattern)
    g01: {
      sa2: 'ABS_C16_G01_SA',
      lga: 'ABS_C16_G01_LGA',
    },
    g02: {
      sa2: 'ABS_C16_G02_SA',
      lga: 'ABS_C16_G02_LGA',
    }
  }
} as const

export interface ABSDataflowResponse {
  success: boolean
  data?: any
  error?: string
}

export interface ABSCensusDataPoint {
  geography: string
  geographyCode: string
  measure: string
  value: number
  year: number
}

/**
 * Get list of all available dataflows from ABS API
 */
export async function getABSDataflows(): Promise<ABSDataflowResponse> {
  try {
    const response = await fetch(`${ABS_BASE_URL}/dataflow/all`, {
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`ABS API Error: ${response.status} ${response.statusText}`)
    }

    // ABS API returns XML by default
    const xmlData = await response.text()

    // Count dataflows as a simple validation
    const dataflowCount = (xmlData.match(/<structure:Dataflow/g) || []).length

    return {
      success: true,
      data: {
        format: 'xml',
        content: xmlData,
        dataflowCount,
        responseSize: xmlData.length,
        timestamp: new Date().toISOString(),
        endpoint: `${ABS_BASE_URL}/dataflow/all`
      }
    }
  } catch (error) {
    console.error('Error fetching ABS dataflows:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get Census G01 data (Selected Person Characteristics by Sex)
 * This includes demographics like age groups, education, birthplace, etc.
 *
 * @param geographyFilter Optional geographic filter
 * @param year Census year (default: 2021)
 * @param timeout Request timeout in milliseconds (default: 30000)
 */
export async function getCensusG01Data(
  geographyFilter?: string,
  year: string = '2021',
  timeout: number = 30000
): Promise<ABSDataflowResponse> {
  try {
    // Real dataflow ID discovered from ABS API testing
    const dataflowId = 'C21_G01_SA2' // 2021 Census G01 at SA2 level

    let url = `${ABS_BASE_URL}/data/${dataflowId}`

    // Add year filter
    url += `?startPeriod=${year}&endPeriod=${year}`

    // Add geography filter if specified
    if (geographyFilter) {
      url += `&dimensionAtObservation=${geographyFilter}`
    }

    console.log('Fetching Census G01 data from:', url)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      throw new Error(`ABS API Error: ${response.status} ${response.statusText}`)
    }

    // Note: ABS API returns XML by default, not JSON
    // For now, we'll return the raw XML text and parse it later
    const xmlData = await response.text()

    return {
      success: true,
      data: {
        format: 'xml',
        content: xmlData,
        dataflowId,
        requestUrl: url,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching Census G01 data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get Census G02 data (Selected Medians and Averages)
 * This includes median income, rent, mortgage, age, etc.
 *
 * @param geographyFilter Optional geographic filter
 * @param year Census year (default: 2021)
 * @param timeout Request timeout in milliseconds (default: 30000)
 */
export async function getCensusG02Data(
  geographyFilter?: string,
  year: string = '2021',
  timeout: number = 30000
): Promise<ABSDataflowResponse> {
  try {
    // Real dataflow ID discovered from ABS API testing
    const dataflowId = 'C21_G02_SA2' // 2021 Census G02 at SA2 level

    let url = `${ABS_BASE_URL}/data/${dataflowId}`

    // Add year filter
    url += `?startPeriod=${year}&endPeriod=${year}`

    // Add geography filter if specified
    if (geographyFilter) {
      url += `&dimensionAtObservation=${geographyFilter}`
    }

    console.log('Fetching Census G02 data from:', url)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      throw new Error(`ABS API Error: ${response.status} ${response.statusText}`)
    }

    // Note: ABS API returns XML by default, not JSON
    // For now, we'll return the raw XML text and parse it later
    const xmlData = await response.text()

    return {
      success: true,
      data: {
        format: 'xml',
        content: xmlData,
        dataflowId,
        requestUrl: url,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching Census G02 data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Search for specific dataflows by keyword
 */
export async function searchABSDataflows(keyword: string): Promise<ABSDataflowResponse> {
  try {
    const dataflows = await getABSDataflows()

    if (!dataflows.success || !dataflows.data?.content) {
      return dataflows
    }

    const xmlContent = dataflows.data.content

    // Simple XML search for dataflow IDs and descriptions containing keyword
    const lines = xmlContent.split('\n')
    const matchingLines = lines.filter(line =>
      line.toLowerCase().includes(keyword.toLowerCase())
    )

    // Extract dataflow IDs from matching lines
    const dataflowIds: string[] = []
    matchingLines.forEach(line => {
      const match = line.match(/structure:Dataflow.*?id="([^"]*)"/)
      if (match && match[1]) {
        dataflowIds.push(match[1])
      }
    })

    // Remove duplicates
    const uniqueIds = [...new Set(dataflowIds)]

    return {
      success: true,
      data: {
        keyword,
        matchingDataflows: uniqueIds,
        matchCount: uniqueIds.length,
        totalMatchingLines: matchingLines.length,
        timestamp: new Date().toISOString(),
        // Include sample of matching content for debugging
        sampleMatches: matchingLines.slice(0, 5)
      }
    }
  } catch (error) {
    console.error('Error searching ABS dataflows:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get data for a specific dataflow with custom parameters
 */
export async function getABSData(
  dataflowId: string,
  parameters: {
    geography?: string
    startPeriod?: string
    endPeriod?: string
    timeout?: number
    [key: string]: any
  } = {}
): Promise<ABSDataflowResponse> {
  try {
    let url = `${ABS_BASE_URL}/data/${dataflowId}`

    // Build query parameters
    const queryParams: string[] = []

    // Add period filters (most common)
    if (parameters.startPeriod) {
      queryParams.push(`startPeriod=${encodeURIComponent(parameters.startPeriod)}`)
    }
    if (parameters.endPeriod) {
      queryParams.push(`endPeriod=${encodeURIComponent(parameters.endPeriod)}`)
    }

    // Add other parameters (excluding our internal ones)
    Object.entries(parameters).forEach(([key, value]) => {
      if (!['startPeriod', 'endPeriod', 'timeout'].includes(key) && value !== undefined) {
        queryParams.push(`${key}=${encodeURIComponent(value)}`)
      }
    })

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }

    console.log('Fetching ABS data from:', url)

    const timeout = parameters.timeout || 30000
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      throw new Error(`ABS API Error: ${response.status} ${response.statusText}`)
    }

    // ABS API returns XML by default
    const xmlData = await response.text()

    return {
      success: true,
      data: {
        format: 'xml',
        content: xmlData,
        dataflowId,
        requestUrl: url,
        responseSize: xmlData.length,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching ABS data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test ABS API connectivity
 */
export async function testABSConnection(): Promise<ABSDataflowResponse> {
  try {
    // Use the basic dataflow endpoint that we know works
    const response = await fetch(`${ABS_BASE_URL}/dataflow/ABS`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout for connection test
    })

    if (!response.ok) {
      throw new Error(`ABS API Connection Test Failed: ${response.status}`)
    }

    // Response will be XML, but we just want to confirm connectivity
    const xmlData = await response.text()

    // Count dataflow elements as a simple validation
    const dataflowCount = (xmlData.match(/<structure:Dataflow/g) || []).length

    return {
      success: true,
      data: {
        message: 'ABS API connection successful',
        format: 'xml',
        dataflowCount,
        responseSize: xmlData.length,
        timestamp: new Date().toISOString(),
        endpoint: `${ABS_BASE_URL}/dataflow/ABS`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    }
  }
}
/**
 * CSV Parser for ABS Census DataPacks
 *
 * Handles parsing and processing of ABS Census CSV files
 * including G01, G02 tables and geographic mappings
 */

export interface CSVRow {
  [key: string]: string
}

export interface ParsedCensusData {
  geography: string
  geographyCode: string
  data: Record<string, number>
  year: number
}

/**
 * Parse CSV content into rows
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index].replace(/"/g, '').trim()
      })
      rows.push(row)
    }
  }

  return rows
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

/**
 * Parse ABS G01 Census data (Selected Person Characteristics by Sex)
 */
export function parseG01CensusData(csvRows: CSVRow[]): ParsedCensusData[] {
  const results: ParsedCensusData[] = []

  for (const row of csvRows) {
    // Skip header rows or invalid data
    if (!row['region_id'] || !row['Tot_P_P']) continue

    const parsedData: ParsedCensusData = {
      geography: row['region_name'] || '',
      geographyCode: row['region_id'] || '',
      year: 2021, // Assuming 2021 census data
      data: {
        // Total Population
        totalPopulation: parseInt(row['Tot_P_P'] || '0'),
        totalMales: parseInt(row['Tot_P_M'] || '0'),
        totalFemales: parseInt(row['Tot_P_F'] || '0'),

        // Age Groups
        age0to4: parseInt(row['Age_0_4_yr_P'] || '0'),
        age5to14: parseInt(row['Age_5_14_yr_P'] || '0'),
        age15to19: parseInt(row['Age_15_19_yr_P'] || '0'),
        age20to24: parseInt(row['Age_20_24_yr_P'] || '0'),
        age25to34: parseInt(row['Age_25_34_yr_P'] || '0'),
        age35to44: parseInt(row['Age_35_44_yr_P'] || '0'),
        age45to54: parseInt(row['Age_45_54_yr_P'] || '0'),
        age55to64: parseInt(row['Age_55_64_yr_P'] || '0'),
        age65to74: parseInt(row['Age_65_74_yr_P'] || '0'),
        age75to84: parseInt(row['Age_75_84_yr_P'] || '0'),
        age85plus: parseInt(row['Age_85ov_P'] || '0'),

        // Indigenous Status
        aboriginalTorresStrait: parseInt(row['Indigenous_P_Tot_P'] || '0'),

        // Birthplace
        bornAustralia: parseInt(row['Birthplace_Australia_P'] || '0'),
        bornOverseas: parseInt(row['Birthplace_OS_P'] || '0'),

        // Language at home
        englishOnly: parseInt(row['Lang_spoken_home_Eng_only_P'] || '0'),
        otherLanguage: parseInt(row['Lang_spoken_home_Oth_Lang_P'] || '0'),

        // Education
        stillAtSchool: parseInt(row['P_Tot_Attend_educ_inst_P'] || '0'),

        // Household composition
        occupiedPrivateDwellings: parseInt(row['P_Tot_Priv_Dwell_occupied_P'] || '0'),
      }
    }

    results.push(parsedData)
  }

  return results
}

/**
 * Parse ABS G02 Census data (Selected Medians and Averages)
 */
export function parseG02CensusData(csvRows: CSVRow[]): ParsedCensusData[] {
  const results: ParsedCensusData[] = []

  for (const row of csvRows) {
    // Skip header rows or invalid data
    if (!row['region_id']) continue

    const parsedData: ParsedCensusData = {
      geography: row['region_name'] || '',
      geographyCode: row['region_id'] || '',
      year: 2021,
      data: {
        // Median Age
        medianAge: parseFloat(row['Median_age_persons'] || '0'),
        medianAgeMale: parseFloat(row['Median_age_males'] || '0'),
        medianAgeFemale: parseFloat(row['Median_age_females'] || '0'),

        // Median Income
        medianPersonalIncome: parseInt(row['Median_tot_prsnl_inc_weekly'] || '0'),
        medianHouseholdIncome: parseInt(row['Median_tot_hhd_inc_weekly'] || '0'),
        medianFamilyIncome: parseInt(row['Median_tot_fam_inc_weekly'] || '0'),

        // Median Rent
        medianRent: parseInt(row['Median_rent_weekly'] || '0'),

        // Median Mortgage
        medianMortgage: parseInt(row['Median_mortgage_repay_monthly'] || '0'),

        // Average household size
        avgHouseholdSize: parseFloat(row['Average_household_size'] || '0'),

        // Average number of children per family
        avgChildrenPerFamily: parseFloat(row['Average_num_psns_per_bedroom'] || '0'),
      }
    }

    results.push(parsedData)
  }

  return results
}

/**
 * Convert parsed census data to our application's suburb format
 */
export function convertToSuburbData(g01Data: ParsedCensusData[], g02Data: ParsedCensusData[]) {
  const suburbs = []

  // Create a map of G02 data by geography code for quick lookup
  const g02Map = new Map<string, ParsedCensusData>()
  g02Data.forEach(item => {
    g02Map.set(item.geographyCode, item)
  })

  for (const g01Item of g01Data) {
    const g02Item = g02Map.get(g01Item.geographyCode)

    if (!g02Item) continue // Skip if no matching G02 data

    const suburb = {
      id: g01Item.geographyCode.toLowerCase().replace(/\s+/g, '-'),
      name: g01Item.geography,
      state: extractStateFromGeography(g01Item.geography),
      postcode: extractPostcodeFromGeography(g01Item.geography),
      population: g01Item.data.totalPopulation || 0,
      lastUpdated: new Date(),

      // Census data
      censusData: {
        id: `${g01Item.geographyCode}-2021`,
        suburbId: g01Item.geographyCode.toLowerCase().replace(/\s+/g, '-'),
        year: 2021 as const,
        population: g01Item.data.totalPopulation || 0,
        medianAge: g02Item.data.medianAge || 0,
        medianHouseholdIncome: (g02Item.data.medianHouseholdIncome || 0) * 52, // Convert weekly to annual
        medianRent: g02Item.data.medianRent || 0,
        medianMortgage: (g02Item.data.medianMortgage || 0) * 12, // Convert monthly to annual
        unemploymentRate: 0, // Will need to calculate from other data sources

        educationLevel: {
          highSchool: calculatePercentage(g01Item.data.stillAtSchool, g01Item.data.totalPopulation),
          bachelor: 0, // Need to extract from detailed education data
          postgraduate: 0, // Need to extract from detailed education data
        },

        householdComposition: {
          couples: 0, // Need to extract from detailed household data
          singleParent: 0, // Need to extract from detailed household data
          singlePerson: 0, // Need to extract from detailed household data
        },

        dwellingTypes: {
          houses: 0, // Need dwelling type data
          apartments: 0,
          townhouses: 0,
          other: 0,
        }
      }
    }

    suburbs.push(suburb)
  }

  return suburbs
}

/**
 * Calculate percentage with safe division
 */
function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return (numerator / denominator) * 100
}

/**
 * Extract state from geography name
 */
function extractStateFromGeography(geography: string): string {
  // This would need to be implemented based on ABS geography naming conventions
  // For now, return a placeholder
  return 'NSW' // Placeholder
}

/**
 * Extract postcode from geography name
 */
function extractPostcodeFromGeography(geography: string): string {
  // This would need to be implemented based on ABS geography naming conventions
  // For now, return a placeholder
  return '2000' // Placeholder
}

/**
 * Validate CSV structure for G01 data
 */
export function validateG01Structure(headers: string[]): boolean {
  const requiredColumns = ['region_id', 'region_name', 'Tot_P_P', 'Tot_P_M', 'Tot_P_F']
  return requiredColumns.every(col => headers.includes(col))
}

/**
 * Validate CSV structure for G02 data
 */
export function validateG02Structure(headers: string[]): boolean {
  const requiredColumns = ['region_id', 'region_name', 'Median_age_persons', 'Median_tot_hhd_inc_weekly']
  return requiredColumns.every(col => headers.includes(col))
}
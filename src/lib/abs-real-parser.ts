/**
 * Real ABS Census DataPack Parser
 *
 * Handles the actual structure of ABS Census 2021 DataPacks
 * - T01: Selected Person Characteristics by Sex
 * - T02: Selected Medians and Averages
 */

import { parseCSV, type CSVRow } from './csv-parser'
import type { CensusData } from '../types'

export interface RealABSSuburbData {
  sa2Code: string
  name: string // This will need to be looked up from SA2 name mapping
  state: string // This will need to be derived from SA2 code
  postcode?: string // This will need to be looked up

  // Demographics from T01
  demographics: {
    totalPopulation2021: number
    totalMales2021: number
    totalFemales2021: number

    // Age groups (2021 data)
    age0to4: number
    age5to14: number
    age15to19: number
    age20to24: number
    age25to34: number
    age35to44: number
    age45to54: number
    age55to64: number
    age65to74: number
    age75to84: number
    age85plus: number

    // Indigenous status
    aboriginalTorresStrait2021: number

    // Birthplace
    bornAustralia2021: number
    bornElsewhere2021: number

    // Language
    englishOnly2021: number
    otherLanguage2021: number

    // Citizenship
    australianCitizen2021: number
  }

  // Economic data from T02
  economics: {
    medianAge2021: number
    medianPersonalIncome2021: number
    medianHouseholdIncome2021: number
    medianFamilyIncome2021: number
    medianRent2021: number
    medianMortgage2021: number
    avgHouseholdSize2021: number
    avgPersonsPerBedroom2021: number
  }
}

/**
 * Parse real ABS T01 file (demographics)
 */
export function parseRealT01Data(csvContent: string): Map<string, RealABSSuburbData['demographics']> {
  const rows = parseCSV(csvContent)
  const result = new Map<string, RealABSSuburbData['demographics']>()

  for (const row of rows) {
    if (!row['SA2_CODE_2021']) continue

    const sa2Code = row['SA2_CODE_2021']

    const demographics: RealABSSuburbData['demographics'] = {
      totalPopulation2021: parseInt(row['Tot_persons_C21_P'] || '0'),
      totalMales2021: parseInt(row['Tot_persons_C21_M'] || '0'),
      totalFemales2021: parseInt(row['Tot_persons_C21_F'] || '0'),

      // Age groups for 2021
      age0to4: parseInt(row['Age_0_4_C21_P'] || '0'),
      age5to14: parseInt(row['Age_5_14_C21_P'] || '0'),
      age15to19: parseInt(row['Age_15_19_C21_P'] || '0'),
      age20to24: parseInt(row['Age_20_24_C21_P'] || '0'),
      age25to34: parseInt(row['Age_25_34_C21_P'] || '0'),
      age35to44: parseInt(row['Age_35_44_C21_P'] || '0'),
      age45to54: parseInt(row['Age_45_54_C21_P'] || '0'),
      age55to64: parseInt(row['Age_55_64_C21_P'] || '0'),
      age65to74: parseInt(row['Age_65_74_C21_P'] || '0'),
      age75to84: parseInt(row['Age_75_84_C21_P'] || '0'),
      age85plus: parseInt(row['Age_grp_85over_C21_P'] || '0'),

      // Indigenous status
      aboriginalTorresStrait2021: parseInt(row['IP_Tot_2021_Ce_P'] || '0'),

      // Birthplace
      bornAustralia2021: parseInt(row['Brthplace_Aust_2021_Ce_P'] || '0'),
      bornElsewhere2021: parseInt(row['Brthplace_Elsewhere_2021_Ce_P'] || '0'),

      // Language
      englishOnly2021: parseInt(row['LSH_Eng_only_2021_Ce_P'] || '0'),
      otherLanguage2021: parseInt(row['LSH_Oth_Lan_2021_Ce_P'] || '0'),

      // Citizenship
      australianCitizen2021: parseInt(row['Aust_citiz_C21_P'] || '0'),
    }

    result.set(sa2Code, demographics)
  }

  return result
}

/**
 * Parse real ABS T02 file (economics)
 */
export function parseRealT02Data(csvContent: string): Map<string, RealABSSuburbData['economics']> {
  const rows = parseCSV(csvContent)
  const result = new Map<string, RealABSSuburbData['economics']>()

  for (const row of rows) {
    if (!row['SA2_CODE_2021']) continue

    const sa2Code = row['SA2_CODE_2021']

    const economics: RealABSSuburbData['economics'] = {
      medianAge2021: parseFloat(row['Med_age_persns_C2021'] || '0'),
      medianPersonalIncome2021: parseInt(row['Med_person_inc_we_C2021'] || '0'),
      medianHouseholdIncome2021: parseInt(row['Med_tot_hh_inc_wee_C2021'] || '0'),
      medianFamilyIncome2021: parseInt(row['Med_Famly_inc_we_C2021'] || '0'),
      medianRent2021: parseInt(row['Med_rent_weekly_C2021'] || '0'),
      medianMortgage2021: parseInt(row['Med_mortg_rep_mon_C2021'] || '0'),
      avgHouseholdSize2021: parseFloat(row['Average_hh_size_C2021'] || '0'),
      avgPersonsPerBedroom2021: parseFloat(row['Avg_num_p_per_brm_C2021'] || '0'),
    }

    result.set(sa2Code, economics)
  }

  return result
}

/**
 * Combine T01 and T02 data into our suburb format
 */
export function combineRealABSData(
  t01Data: Map<string, RealABSSuburbData['demographics']>,
  t02Data: Map<string, RealABSSuburbData['economics']>,
  sa2Names?: Map<string, string> // SA2 code to name mapping
): RealABSSuburbData[] {
  const result: RealABSSuburbData[] = []

  for (const [sa2Code, demographics] of t01Data) {
    const economics = t02Data.get(sa2Code)
    if (!economics) continue // Skip if no matching economics data

    const suburbData: RealABSSuburbData = {
      sa2Code,
      name: sa2Names?.get(sa2Code) || `SA2 ${sa2Code}`,
      state: deriveStateFromSA2Code(sa2Code),
      demographics,
      economics
    }

    result.push(suburbData)
  }

  return result
}

/**
 * Convert real ABS data to our application's CensusData format
 */
export function convertRealABSToAppFormat(realData: RealABSSuburbData[]): CensusData[] {
  return realData.map(item => {
    const censusData: CensusData = {
      id: `${item.sa2Code}-2021`,
      suburbId: item.sa2Code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      year: 2021,
      population: item.demographics.totalPopulation2021,
      medianAge: item.economics.medianAge2021,
      medianHouseholdIncome: item.economics.medianHouseholdIncome2021 * 52, // Convert weekly to annual
      medianRent: item.economics.medianRent2021,
      medianMortgage: item.economics.medianMortgage2021,
      unemploymentRate: 0, // Not available in basic T01/T02, would need employment tables

      educationLevel: {
        highSchool: 0, // Would need education tables
        bachelor: 0,   // Would need education tables
        postgraduate: 0, // Would need education tables
      },

      householdComposition: {
        couples: 0,      // Would need household composition tables
        singleParent: 0, // Would need household composition tables
        singlePerson: 0, // Would need household composition tables
      },

      dwellingTypes: {
        houses: 0,      // Would need dwelling tables
        apartments: 0,  // Would need dwelling tables
        townhouses: 0,  // Would need dwelling tables
        other: 0,       // Would need dwelling tables
      }
    }

    return censusData
  })
}

/**
 * Derive state from SA2 code
 * SA2 codes start with state identifier:
 * 1 = NSW, 2 = VIC, 3 = QLD, 4 = SA, 5 = WA, 6 = TAS, 7 = NT, 8 = ACT, 9 = Other
 */
function deriveStateFromSA2Code(sa2Code: string): string {
  const firstDigit = sa2Code.charAt(0)

  switch (firstDigit) {
    case '1': return 'NSW'
    case '2': return 'VIC'
    case '3': return 'QLD'
    case '4': return 'SA'
    case '5': return 'WA'
    case '6': return 'TAS'
    case '7': return 'NT'
    case '8': return 'ACT'
    case '9': return 'OTH'
    default: return 'UNKNOWN'
  }
}

/**
 * Calculate safety rating placeholder based on demographics
 * This is a simplified calculation - in reality you'd use crime data
 */
export function calculateSafetyRatingFromDemographics(data: RealABSSuburbData): number {
  const { demographics, economics } = data

  // Simple scoring based on income, age, and population density
  let score = 5.0 // Base score

  // Higher income areas tend to be safer
  if (economics.medianHouseholdIncome2021 > 2000) score += 1.5
  if (economics.medianHouseholdIncome2021 > 3000) score += 1.0

  // Areas with higher median age tend to be more stable
  if (economics.medianAge2021 > 35) score += 0.5
  if (economics.medianAge2021 > 40) score += 0.5

  // Higher education correlates with lower crime (we don't have this data yet)
  // Placeholder: assume education level based on income
  if (economics.medianHouseholdIncome2021 > 2500) score += 0.5

  // Ensure score is between 1 and 10
  return Math.max(1.0, Math.min(10.0, score))
}

/**
 * Validate real ABS T01 file structure
 */
export function validateRealT01Structure(headers: string[]): boolean {
  const requiredColumns = [
    'SA2_CODE_2021',
    'Tot_persons_C21_P',
    'Tot_persons_C21_M',
    'Tot_persons_C21_F',
    'Age_0_4_C21_P',
    'Brthplace_Aust_2021_Ce_P',
    'LSH_Eng_only_2021_Ce_P'
  ]
  return requiredColumns.every(col => headers.includes(col))
}

/**
 * Validate real ABS T02 file structure
 */
export function validateRealT02Structure(headers: string[]): boolean {
  const requiredColumns = [
    'SA2_CODE_2021',
    'Med_age_persns_C2021',
    'Med_tot_hh_inc_wee_C2021',
    'Med_rent_weekly_C2021',
    'Med_mortg_rep_mon_C2021'
  ]
  return requiredColumns.every(col => headers.includes(col))
}
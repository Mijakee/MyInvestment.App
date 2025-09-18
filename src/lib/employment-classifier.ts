/**
 * Employment Classification System
 * Uses ABS Census G54A table data to classify suburbs by actual employment patterns
 */

export interface EmploymentData {
  sal_code: string
  industries: {
    agriculture: number
    mining: number
    manufacturing: number
    utilities: number
    construction: number
    wholesale: number
    retail: number
    accommodation: number
    transport: number
    information: number
    finance: number
    realEstate: number
    professional: number
    administrative: number
    publicAdmin: number
    education: number
    healthcare: number
    arts: number
    other: number
  }
  totalEmployed: number
  primaryIndustry: string
  secondaryIndustry: string | null
  classification: 'Mining' | 'Manufacturing' | 'Professional Services' | 'Healthcare' | 'Education' | 'Retail' | 'Construction' | 'Agriculture' | 'Mixed Services' | 'Residential'
}

/**
 * Parse G54A employment data for a specific SAL code
 */
export function parseEmploymentData(salCode: string, headers: string[], row: string[]): EmploymentData | null {
  if (!row || row[0] !== salCode) return null

  // Extract totals for each industry (this dataset only has male data)
  const getIndustryTotal = (prefix: string): number => {
    const maleIndex = headers.findIndex(h => h === `M_${prefix}_Tot`)
    return maleIndex >= 0 ? parseInt(row[maleIndex]) || 0 : 0
  }

  const industries = {
    agriculture: getIndustryTotal('Ag_For_Fshg'),
    mining: getIndustryTotal('Mining'),
    manufacturing: getIndustryTotal('Manufact'),
    utilities: getIndustryTotal('El_Gas_Wt_Waste'),
    construction: getIndustryTotal('Constru'),
    wholesale: getIndustryTotal('WhlesaleTde'),
    retail: getIndustryTotal('RetTde'),
    accommodation: getIndustryTotal('Accom_food'),
    transport: getIndustryTotal('Trans_post_wrehsg'),
    information: getIndustryTotal('Info_media_teleco'),
    finance: getIndustryTotal('Fin_Insur'),
    realEstate: getIndustryTotal('RtnHir_REst'),
    professional: getIndustryTotal('Pro_scien_tec'),
    administrative: getIndustryTotal('Admin_supp'),
    publicAdmin: getIndustryTotal('Public_admin_sfty'),
    education: getIndustryTotal('Educ_trng'),
    healthcare: getIndustryTotal('HlthCare_SocAs'),
    arts: getIndustryTotal('Art_recn'),
    other: getIndustryTotal('Oth_scs')
  }

  const totalEmployed = Object.values(industries).reduce((sum, count) => sum + count, 0)

  if (totalEmployed === 0) {
    return {
      sal_code: salCode,
      industries,
      totalEmployed: 0,
      primaryIndustry: 'Unknown',
      secondaryIndustry: null,
      classification: 'Residential'
    }
  }

  // Find primary and secondary industries
  const industriesList = Object.entries(industries)
    .map(([name, count]) => ({ name, count, percentage: (count / totalEmployed) * 100 }))
    .sort((a, b) => b.count - a.count)

  const primaryIndustry = industriesList[0]?.name || 'Unknown'
  const secondaryIndustry = industriesList[1]?.count > 0 ? industriesList[1].name : null

  // Classify suburb based on employment patterns
  const classification = classifyByEmployment(industriesList)

  return {
    sal_code: salCode,
    industries,
    totalEmployed,
    primaryIndustry: formatIndustryName(primaryIndustry),
    secondaryIndustry: secondaryIndustry ? formatIndustryName(secondaryIndustry) : null,
    classification
  }
}

/**
 * Classify suburb based on employment distribution
 */
function classifyByEmployment(industries: Array<{name: string, count: number, percentage: number}>): EmploymentData['classification'] {
  const [primary, secondary] = industries

  // Single industry dominance (>40%)
  if (primary.percentage >= 40) {
    switch (primary.name) {
      case 'mining': return 'Mining'
      case 'manufacturing': return 'Manufacturing'
      case 'healthcare': return 'Healthcare'
      case 'education': return 'Education'
      case 'retail': return 'Retail'
      case 'construction': return 'Construction'
      case 'agriculture': return 'Agriculture'
      case 'professional':
      case 'finance':
      case 'information': return 'Professional Services'
    }
  }

  // Service sector dominance (professional + finance + information + retail >50%)
  const serviceTotal = industries
    .filter(i => ['professional', 'finance', 'information', 'retail', 'accommodation'].includes(i.name))
    .reduce((sum, i) => sum + i.percentage, 0)

  if (serviceTotal >= 50) {
    return 'Professional Services'
  }

  // Mixed employment or residential areas
  if (primary.percentage < 30) {
    return 'Residential'
  }

  return 'Mixed Services'
}

/**
 * Format industry names for display
 */
function formatIndustryName(industryKey: string): string {
  const nameMap: Record<string, string> = {
    agriculture: 'Agriculture & Forestry',
    mining: 'Mining',
    manufacturing: 'Manufacturing',
    utilities: 'Utilities',
    construction: 'Construction',
    wholesale: 'Wholesale Trade',
    retail: 'Retail Trade',
    accommodation: 'Accommodation & Food',
    transport: 'Transport & Logistics',
    information: 'Information & Technology',
    finance: 'Financial Services',
    realEstate: 'Real Estate',
    professional: 'Professional Services',
    administrative: 'Administrative Services',
    publicAdmin: 'Public Administration',
    education: 'Education',
    healthcare: 'Healthcare',
    arts: 'Arts & Recreation',
    other: 'Other Services'
  }

  return nameMap[industryKey] || industryKey
}

/**
 * Load and parse G54A employment data from CSV
 */
export async function loadEmploymentData(): Promise<EmploymentData[]> {
  try {
    const fs = await import('fs')
    const path = await import('path')

    const csvPath = path.join(process.cwd(), 'src/data/2021 Census GCP All Geographies for WA/SAL/WA/2021Census_G54A_WA_SAL.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    const dataRows = lines.slice(1).map(line => line.split(','))

    const employmentData: EmploymentData[] = []

    for (const row of dataRows) {
      if (row[0]) { // SAL code exists
        const employment = parseEmploymentData(row[0], headers, row)
        if (employment) {
          employmentData.push(employment)
        }
      }
    }

    return employmentData
  } catch (error) {
    console.error('Failed to load employment data:', error)
    return []
  }
}

/**
 * Get employment classification for a specific SAL code
 */
export async function getEmploymentClassification(salCode: string): Promise<EmploymentData | null> {
  const allData = await loadEmploymentData()
  return allData.find(emp => emp.sal_code === salCode) || null
}
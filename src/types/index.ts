// WA Suburb data structure
export interface WASuburb {
  sal_code: string
  sal_name: string
  state: string
  latitude: number
  longitude: number
  classification_type: string
  economic_base: string[]
  sa2_mappings: any[]
  police_district?: string
  population?: number
  area?: number // in km²
}

// Legacy suburb interface for backward compatibility
export interface Suburb extends WASuburb {
  id: string
  name: string
  postcode: string
  safetyRating: number
  lastUpdated: Date
}

// ABS Census data structure (with backward compatibility)
export interface CensusData {
  sal_code: string
  sal_name: string
  year: 2021
  population: number // backward compatibility
  medianAge: number
  medianHouseholdIncome: number
  unemploymentRate: number
  educationLevel: {
    bachelor: number
    postgraduate: number
    trade: number
    highSchool: number
    other: number
  }
  householdComposition: {
    couples: number
    families: number
    singles: number
    group: number
  }
  dwellingTypes: {
    separateHouse: number
    semiDetached: number
    townhouse: number
    apartment: number
    other: number
    houses?: number // backward compatibility
  }
  ancestry: {
    australian: number
    english: number
    irish: number
    chinese: number
    italian: number
    other: number
  }
  seifa: {
    score: number
    decile: number
  }
}

// WA Police crime data structure (with backward compatibility)
export interface CrimeData {
  sal_code: string
  sal_name: string
  police_district: string
  totalOffenses: number
  crimeRate: number // per 1000 population
  categories: {
    violentCrime: number
    propertyCrime: number
    drugOffenses: number
    publicOrder: number
    trafficOffenses: number
    otherOffenses: number
    // backward compatibility
    assault?: number
    burglary?: number
    theft?: number
    property?: number
    vehicleCrime?: number
    other?: number
  }
  severity: {
    high: number // homicide, sexual assault
    medium: number // assault, burglary
    low: number // theft, public order
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
}

// User types
export interface User {
  id: string
  email: string
  displayName: string
  preferences: {
    maxBudget?: number
    preferredStates: string[]
    safetyPriority: 1 | 2 | 3 | 4 | 5 // 1 = not important, 5 = very important
    investmentType: 'rental' | 'family' | 'development' | 'commercial'
  }
  savedSearches: string[]
  createdAt: Date
  lastLoginAt: Date
}

// Crime score system (higher = worse crime)
export interface CrimeScore {
  overallScore: number // 1-10 scale (10 = highest crime)
  confidence: number // 0-1 scale
  components: {
    directCrimeScore: number // 70% weight - WA Police crime data
    neighborhoodCrimeScore: number // 30% weight - neighboring area crime influence
  }
  explanation: {
    crimeSummary: string
    neighborhoodSummary: string
  }
}

// Legacy safety rating interface for backward compatibility
export interface SafetyRating extends CrimeScore {
  overallRating: number
  components: {
    crimeRating: number
    demographicRating: number
    neighborhoodRating: number
    trendRating: number
  }
}

// Convenience scoring system (higher = better convenience)
export interface ConvenienceScore {
  overallScore: number // 1-10 scale (10 = most convenient)
  confidence: number
  components: {
    transportScore: number // 25% weight
    shoppingScore: number // 25% weight
    educationScore: number // 25% weight
    recreationScore: number // 25% weight
  }
}

// Overall suburb rating system
export interface SuburbRating {
  suburb: WASuburb
  crimeScore: CrimeScore // 1-10 (higher = more crime)
  convenienceScore: ConvenienceScore // 1-10 (higher = more convenient)
  investmentScore: number // 1-10 (higher = better investment)
  overallRating: number // 1-10 (higher = better overall)
  lastUpdated: Date
}

// Investment analysis (higher = better investment)
export interface InvestmentAnalysis {
  suburb: WASuburb
  crimeScore: CrimeScore
  convenienceScore: ConvenienceScore
  investmentScore: number // 1-10 scale (10 = best investment)
  recommendation: 'excellent' | 'good' | 'fair' | 'poor'
  explanation: string
}

// Legacy compatibility - keep until refactoring complete
export interface SuburbAnalysis {
  suburb: Suburb
  latestCensus: CensusData
  latestCrime: CrimeData
  investmentScore: number
  recommendations: string[]
  riskFactors: string[]
  growthPotential: 'low' | 'medium' | 'high'
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// Heat map data types
export interface HeatMapData {
  sal_code: string
  sal_name: string
  latitude: number
  longitude: number
  value: number
  metric: 'crime' | 'convenience' | 'investment'
  color: string
  label: string
}

// Component prop types
export interface SuburbCardProps {
  suburb: WASuburb
  safetyRating?: SafetyRating
  convenienceScore?: ConvenienceScore
  onSelect?: (salCode: string) => void
  compact?: boolean
}

export interface SafetyRatingBadgeProps {
  rating: number
  confidence?: number
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

// Geographic types
export interface NeighboringArea {
  sal_code: string
  distance: number
  influence: number
}

export interface CorrespondenceMapping {
  sal_code: string
  sa2_code: string
  police_district: string
  confidence: number
}
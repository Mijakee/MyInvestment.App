// Suburb and location types
export interface Suburb {
  id: string
  name: string
  state: string
  postcode: string
  latitude?: number
  longitude?: number
  safetyRating: number // 1-10 scale
  lastUpdated: Date
  population?: number
  area?: number // in km²
}

// Census data types
export interface CensusData {
  id: string
  suburbId: string
  year: 2011 | 2016 | 2021
  population: number
  medianAge: number
  medianHouseholdIncome: number
  medianRent: number
  medianMortgage: number
  unemploymentRate: number
  educationLevel: {
    highSchool: number
    bachelor: number
    postgraduate: number
  }
  householdComposition: {
    couples: number
    singleParent: number
    singlePerson: number
  }
  dwellingTypes: {
    houses: number
    apartments: number
    townhouses: number
    other: number
  }
}

// Crime data types
export interface CrimeData {
  id: string
  suburbId: string
  year: number // 2007-2025
  totalOffenses: number
  crimeRate: number // per 1000 population
  categories: {
    assault: number
    burglary: number
    theft: number
    drugOffenses: number
    publicOrder: number
    property: number
    vehicleCrime: number
    other: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
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

// Search and analysis types
export interface SearchCriteria {
  states?: string[]
  minSafetyRating?: number
  maxBudget?: number
  minPopulation?: number
  maxPopulation?: number
  investmentType?: string
  sortBy?: 'safetyRating' | 'population' | 'crimeRate' | 'medianIncome'
  sortOrder?: 'asc' | 'desc'
}

export interface SuburbAnalysis {
  suburb: Suburb
  latestCensus: CensusData
  latestCrime: CrimeData
  historicalCrime: CrimeData[]
  investmentScore: number // Calculated score based on various factors
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

// Component prop types
export interface SuburbCardProps {
  suburb: Suburb
  analysis?: SuburbAnalysis
  onSelect?: (suburbId: string) => void
  compact?: boolean
}

export interface SafetyRatingProps {
  rating: number
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
}

export interface ChartDataPoint {
  year: number
  value: number
  category?: string
}

// Filter and state types
export interface FilterState {
  search: SearchCriteria
  isLoading: boolean
  results: SuburbAnalysis[]
  error?: string
}
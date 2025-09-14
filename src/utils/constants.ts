// Australian states and territories
export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
] as const

export type StateCode = typeof AUSTRALIAN_STATES[number]['code']

// Census years available
export const CENSUS_YEARS = [2011, 2016, 2021] as const

// Crime data range
export const CRIME_DATA_START_YEAR = 2007
export const CRIME_DATA_END_YEAR = 2025

// Safety rating scale
export const SAFETY_RATING = {
  MIN: 1,
  MAX: 10,
  LABELS: {
    1: 'Very High Risk',
    2: 'High Risk',
    3: 'High Risk',
    4: 'Moderate Risk',
    5: 'Moderate Risk',
    6: 'Moderate Risk',
    7: 'Low Risk',
    8: 'Low Risk',
    9: 'Very Low Risk',
    10: 'Very Low Risk',
  },
  COLORS: {
    1: '#ef4444', // red-500
    2: '#f97316', // orange-500
    3: '#f97316',
    4: '#eab308', // yellow-500
    5: '#eab308',
    6: '#84cc16', // lime-500
    7: '#22c55e', // green-500
    8: '#22c55e',
    9: '#10b981', // emerald-500
    10: '#10b981',
  }
} as const

// Investment types
export const INVESTMENT_TYPES = [
  { value: 'rental', label: 'Rental Property' },
  { value: 'family', label: 'Family Home' },
  { value: 'development', label: 'Development Site' },
  { value: 'commercial', label: 'Commercial Property' },
] as const

// Crime categories
export const CRIME_CATEGORIES = [
  'assault',
  'burglary',
  'theft',
  'drugOffenses',
  'publicOrder',
  'property',
  'vehicleCrime',
  'other',
] as const

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  SUBURBS: 'suburbs',
  CENSUS: 'census',
  CRIME: 'crime',
  USER_SEARCHES: 'user-searches',
} as const

// API endpoints
export const API_ENDPOINTS = {
  SUBURBS: '/api/suburbs',
  SEARCH: '/api/search',
  ANALYSIS: '/api/analysis',
  USER_PREFERENCES: '/api/user/preferences',
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const
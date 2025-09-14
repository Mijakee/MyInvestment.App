import { SAFETY_RATING } from './constants'
import type { CrimeData, CensusData, SuburbAnalysis } from '../types'

/**
 * Format currency values for Australian dollars
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Get safety rating label and color
 */
export function getSafetyRatingInfo(rating: number) {
  const clampedRating = Math.max(1, Math.min(10, Math.round(rating))) as keyof typeof SAFETY_RATING.LABELS

  return {
    rating: clampedRating,
    label: SAFETY_RATING.LABELS[clampedRating],
    color: SAFETY_RATING.COLORS[clampedRating],
  }
}

/**
 * Calculate investment score based on various factors
 */
export function calculateInvestmentScore(
  suburb: { safetyRating: number },
  census: CensusData,
  crime: CrimeData
): number {
  const safetyWeight = 0.3
  const incomeWeight = 0.2
  const crimeWeight = 0.2
  const growthWeight = 0.15
  const unemploymentWeight = 0.15

  // Safety score (1-10 scale)
  const safetyScore = suburb.safetyRating

  // Income score (normalized to 1-10 scale, assuming median income range 30k-150k)
  const incomeScore = Math.min(10, Math.max(1, (census.medianHouseholdIncome - 30000) / 12000))

  // Crime score (lower crime rate = higher score)
  const crimeScore = Math.min(10, Math.max(1, 10 - (crime.crimeRate / 10)))

  // Growth potential (based on population and development indicators)
  const growthScore = Math.min(10, Math.max(1, (census.population / 1000)))

  // Employment score (lower unemployment = higher score)
  const employmentScore = Math.min(10, Math.max(1, 10 - census.unemploymentRate))

  const totalScore =
    (safetyScore * safetyWeight) +
    (incomeScore * incomeWeight) +
    (crimeScore * crimeWeight) +
    (growthScore * growthWeight) +
    (employmentScore * unemploymentWeight)

  return Math.round(totalScore * 10) / 10 // Round to 1 decimal place
}

/**
 * Generate investment recommendations based on suburb analysis
 */
export function generateRecommendations(analysis: SuburbAnalysis): string[] {
  const recommendations: string[] = []
  const { suburb, latestCensus, latestCrime } = analysis

  // Safety-based recommendations
  if (suburb.safetyRating >= 8) {
    recommendations.push('Excellent safety rating makes this ideal for family investments')
  } else if (suburb.safetyRating >= 6) {
    recommendations.push('Good safety levels suitable for most investment types')
  } else if (suburb.safetyRating <= 4) {
    recommendations.push('Consider additional security measures for rental properties')
  }

  // Income-based recommendations
  if (latestCensus.medianHouseholdIncome >= 80000) {
    recommendations.push('High income area suggests strong rental demand')
  } else if (latestCensus.medianHouseholdIncome <= 50000) {
    recommendations.push('Lower income area - consider affordable housing options')
  }

  // Crime trend recommendations
  if (latestCrime.trend === 'decreasing') {
    recommendations.push('Improving crime trends indicate growing desirability')
  } else if (latestCrime.trend === 'increasing') {
    recommendations.push('Monitor crime trends closely before long-term investment')
  }

  // Unemployment recommendations
  if (latestCensus.unemploymentRate <= 3) {
    recommendations.push('Low unemployment suggests economic stability')
  } else if (latestCensus.unemploymentRate >= 8) {
    recommendations.push('High unemployment may affect rental market stability')
  }

  return recommendations
}

/**
 * Generate risk factors based on suburb analysis
 */
export function generateRiskFactors(analysis: SuburbAnalysis): string[] {
  const risks: string[] = []
  const { suburb, latestCensus, latestCrime } = analysis

  // Safety risks
  if (suburb.safetyRating <= 4) {
    risks.push('Low safety rating may impact property values and rental demand')
  }

  // Crime risks
  if (latestCrime.trend === 'increasing') {
    risks.push('Rising crime rates could deter potential tenants or buyers')
  }

  if (latestCrime.crimeRate > 50) {
    risks.push('High crime rate compared to national average')
  }

  // Economic risks
  if (latestCensus.unemploymentRate >= 8) {
    risks.push('High unemployment rate may affect rental payment reliability')
  }

  if (latestCensus.medianHouseholdIncome <= 40000) {
    risks.push('Low median income may limit rental pricing potential')
  }

  // Market risks
  if (latestCensus.population <= 1000) {
    risks.push('Small population may limit resale opportunities')
  }

  return risks
}

/**
 * Determine growth potential based on various factors
 */
export function determineGrowthPotential(
  census: CensusData,
  crime: CrimeData
): 'low' | 'medium' | 'high' {
  let score = 0

  // Population growth indicator (if available)
  if (census.population > 10000) score += 2
  else if (census.population > 5000) score += 1

  // Income indicator
  if (census.medianHouseholdIncome > 70000) score += 2
  else if (census.medianHouseholdIncome > 50000) score += 1

  // Employment indicator
  if (census.unemploymentRate < 4) score += 2
  else if (census.unemploymentRate < 7) score += 1

  // Safety indicator
  if (crime.trend === 'decreasing') score += 2
  else if (crime.trend === 'stable') score += 1

  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}
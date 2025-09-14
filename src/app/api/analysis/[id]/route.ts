import { NextRequest, NextResponse } from 'next/server'
import { mockSuburbs } from '@/data/mock-suburbs'
import { mockCensusData } from '@/data/mock-census'
import { mockCrimeData } from '@/data/mock-crime'
import {
  calculateInvestmentScore,
  generateRecommendations,
  generateRiskFactors,
  determineGrowthPotential,
} from '@/utils/helpers'
import type { ApiResponse, SuburbAnalysis } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: suburbId } = await params

    // Find suburb
    const suburb = mockSuburbs.find(s => s.id === suburbId)
    if (!suburb) {
      const notFoundResponse: ApiResponse<null> = {
        success: false,
        error: 'Suburb not found',
      }
      return NextResponse.json(notFoundResponse, { status: 404 })
    }

    // Find latest census data
    const censusData = mockCensusData
      .filter(c => c.suburbId === suburbId)
      .sort((a, b) => b.year - a.year)

    const latestCensus = censusData[0]
    if (!latestCensus) {
      const noCensusResponse: ApiResponse<null> = {
        success: false,
        error: 'Census data not available for this suburb',
      }
      return NextResponse.json(noCensusResponse, { status: 404 })
    }

    // Find crime data
    const crimeData = mockCrimeData
      .filter(c => c.suburbId === suburbId)
      .sort((a, b) => b.year - a.year)

    const latestCrime = crimeData[0]
    if (!latestCrime) {
      const noCrimeResponse: ApiResponse<null> = {
        success: false,
        error: 'Crime data not available for this suburb',
      }
      return NextResponse.json(noCrimeResponse, { status: 404 })
    }

    // Calculate investment score
    const investmentScore = calculateInvestmentScore(suburb, latestCensus, latestCrime)

    // Generate analysis
    const analysis: SuburbAnalysis = {
      suburb,
      latestCensus,
      latestCrime,
      historicalCrime: crimeData.slice(0, 5), // Last 5 years
      investmentScore,
      recommendations: [],
      riskFactors: [],
      growthPotential: determineGrowthPotential(latestCensus, latestCrime),
    }

    // Generate recommendations and risk factors
    analysis.recommendations = generateRecommendations(analysis)
    analysis.riskFactors = generateRiskFactors(analysis)

    const response: ApiResponse<SuburbAnalysis> = {
      success: true,
      data: analysis,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating suburb analysis:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to generate suburb analysis',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
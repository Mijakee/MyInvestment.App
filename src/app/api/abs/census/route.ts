import { NextRequest, NextResponse } from 'next/server'

// Mock census data generator to demonstrate charts
function generateMockCensusData(sa2Code: string) {
  // Generate semi-realistic data based on SA2 code for consistency
  const seed = parseInt(sa2Code.slice(-3)) % 100

  return {
    sa2_code: sa2Code,
    year: 2021,
    medianAge: 35 + (seed % 30),
    medianHouseholdIncome: 65000 + (seed * 800),
    unemploymentRate: 2.5 + (seed % 10),
    educationLevel: {
      bachelor: 25 + (seed % 30),
      postgraduate: 15 + (seed % 20),
      trade: 20 + (seed % 25),
      highSchool: 30 + (seed % 20),
      other: 10 + (seed % 15)
    },
    householdComposition: {
      couples: 45 + (seed % 25),
      families: 35 + (seed % 20),
      singles: 15 + (seed % 15),
      group: 5 + (seed % 10)
    },
    dwellingTypes: {
      houses: 60 + (seed % 30),
      apartments: 25 + (seed % 20),
      townhouses: 10 + (seed % 15),
      other: 5 + (seed % 10)
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sa2Code = searchParams.get('sa2_code')
  const year = searchParams.get('year')

  if (!sa2Code) {
    return NextResponse.json({
      success: false,
      error: 'SA2 code is required'
    }, { status: 400 })
  }

  if (!year || year !== '2021') {
    return NextResponse.json({
      success: false,
      error: 'Only 2021 census data is currently available'
    }, { status: 400 })
  }

  try {
    // For now, return mock data to demonstrate the charts
    // TODO: Replace with real ABS Census data integration
    const censusData = generateMockCensusData(sa2Code)

    return NextResponse.json({
      success: true,
      data: censusData,
      metadata: {
        source: 'Mock ABS Census Data - Demo',
        note: 'This is generated mock data to demonstrate chart functionality. Real ABS Census integration pending.',
        sa2_code: sa2Code,
        year: parseInt(year),
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching census data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch census data'
    }, { status: 500 })
  }
}
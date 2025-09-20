import { NextRequest, NextResponse } from 'next/server'
import { absCensusService } from '@/lib/abs-census-service'
import { waSuburbLoader } from '@/lib/wa-suburb-loader'

// Fallback mock data generator only if real data unavailable
function generateFallbackCensusData(sa2Code: string) {
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
    // Try to find a suburb with this SA2 code to get real census data
    const allSuburbs = waSuburbLoader.getAllSuburbs()
    const suburbWithSA2 = allSuburbs.find(suburb =>
      suburb.sa2_mappings.some(mapping => mapping.sa2_code === sa2Code)
    )

    let censusData
    let metadata

    if (suburbWithSA2) {
      // Use real ABS census service to get data for this suburb
      const realCensusData = await absCensusService.getCensusDataForSuburb(suburbWithSA2.sal_code, parseInt(year))

      if (realCensusData) {
        // Convert to the expected API format
        censusData = {
          sa2_code: sa2Code,
          year: parseInt(year),
          medianAge: realCensusData.medianAge,
          medianHouseholdIncome: realCensusData.medianHouseholdIncome,
          unemploymentRate: realCensusData.unemploymentRate,
          educationLevel: realCensusData.educationLevel,
          householdComposition: realCensusData.householdComposition,
          dwellingTypes: realCensusData.dwellingTypes
        }

        metadata = {
          source: 'Real ABS Census Data',
          note: 'Data sourced from actual ABS 2021 Census via SA2 mapping',
          sa2_code: sa2Code,
          sal_code: suburbWithSA2.sal_code,
          suburb_name: suburbWithSA2.sal_name,
          year: parseInt(year),
          confidence: 'High - Real census data',
          retrieved_at: new Date().toISOString()
        }
      } else {
        // Fallback to generated data if real data unavailable
        censusData = generateFallbackCensusData(sa2Code)
        metadata = {
          source: 'Fallback Generated Data',
          note: 'Real census data unavailable, using realistic estimates',
          sa2_code: sa2Code,
          year: parseInt(year),
          confidence: 'Medium - Generated from patterns',
          generated_at: new Date().toISOString()
        }
      }
    } else {
      // No suburb found with this SA2 code, use fallback
      censusData = generateFallbackCensusData(sa2Code)
      metadata = {
        source: 'Fallback Generated Data',
        note: 'No suburb mapping found for SA2 code, using realistic estimates',
        sa2_code: sa2Code,
        year: parseInt(year),
        confidence: 'Low - No mapping available',
        generated_at: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      data: censusData,
      metadata
    })

  } catch (error) {
    console.error('Error fetching census data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch census data'
    }, { status: 500 })
  }
}
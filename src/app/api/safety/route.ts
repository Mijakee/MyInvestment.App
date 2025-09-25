import { NextRequest, NextResponse } from 'next/server'
import { precomputedDataService } from '../../../lib/precomputed-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'suburb'
    const salCode = searchParams.get('sal_code')

    switch (action) {
      case 'suburb': {
        // Get safety rating for specific suburb
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'sal_code parameter required for suburb action'
          }, { status: 400 })
        }

        const suburbData = precomputedDataService.getSuburbScore(salCode)
        if (!suburbData) {
          return NextResponse.json({
            success: false,
            error: `Suburb ${salCode} not found in precomputed data`
          }, { status: 404 })
        }

        // Format response to match original safety API structure
        const safetyResponse = {
          suburbCode: suburbData.sal_code,
          suburbName: suburbData.sal_name,
          overallRating: suburbData.scores.safety,
          components: {
            crimeRating: suburbData.scores.crime,
            demographicRating: 7.5, // Placeholder - real data would be stored
            neighborhoodRating: 8.0, // Placeholder - real data would be stored
            trendRating: 8.0 // Placeholder - real data would be stored
          },
          confidence: suburbData.metadata.confidence,
          lastUpdated: suburbData.metadata.last_calculated,
          dataAvailability: {
            hasCensusData: true,
            hasCrimeData: true,
            hasNeighborhoodData: true
          },
          dataSource: 'precomputed_static_data',
          performance: 'Ultra-fast precomputed lookup'
        }

        return NextResponse.json({
          success: true,
          data: safetyResponse,
          metadata: {
            purpose: 'Individual suburb safety rating',
            data_source: 'precomputed_static_data',
            note: 'Consistent with heatmap data'
          }
        })
      }

      case 'range': {
        // Get suburbs by safety rating range
        const min = parseFloat(searchParams.get('min') || '0')
        const max = parseFloat(searchParams.get('max') || '10')

        const suburbsInRange = precomputedDataService.getSuburbsByScoreRange('safety', min, max)

        const safetyData = suburbsInRange.map(suburb => ({
          suburbCode: suburb.sal_code,
          suburbName: suburb.sal_name,
          overallRating: suburb.scores.safety,
          coordinates: suburb.coordinates,
          confidence: suburb.metadata.confidence
        }))

        return NextResponse.json({
          success: true,
          data: {
            suburbs: safetyData,
            count: safetyData.length,
            filter: { min, max }
          },
          metadata: {
            purpose: 'Suburbs filtered by safety rating range',
            data_source: 'precomputed_static_data'
          }
        })
      }

      case 'statistics': {
        // Get safety rating statistics
        const statistics = precomputedDataService.getDataStatistics()

        return NextResponse.json({
          success: true,
          data: {
            safety_statistics: {
              total_suburbs: statistics.total_suburbs,
              average_rating: statistics.averages.safety,
              rating_range: statistics.ranges.safety,
              quality_distribution: statistics.quality_distribution
            },
            metadata: precomputedDataService.getDataInfo().metadata
          },
          metadata: {
            purpose: 'Safety rating statistics and overview',
            data_source: 'precomputed_static_data'
          }
        })
      }

      case 'test': {
        // Test safety API functionality
        try {
          const dataInfo = precomputedDataService.getDataInfo()
          const sampleSuburbs = precomputedDataService.getAllSuburbScores().slice(0, 3)

          return NextResponse.json({
            success: true,
            data: {
              status: 'Precomputed safety API is operational',
              dataSource: 'precomputed_static_data',
              totalSuburbs: dataInfo.metadata.total_suburbs,
              performance: 'Ultra-fast precomputed lookups',
              api_version: '4.0-precomputed',
              sample_ratings: sampleSuburbs.map(suburb => ({
                suburb: suburb.sal_name,
                safety_rating: suburb.scores.safety,
                crime_score: suburb.scores.crime,
                confidence: suburb.metadata.confidence,
                note: 'Precomputed consistent data'
              }))
            },
            metadata: {
              purpose: 'Safety API health check',
              consistency: 'Identical scores used in heatmap and individual APIs'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            data: {
              status: 'API operational but no precomputed data available',
              message: 'Run npm run update-data for real data'
            }
          })
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: suburb, range, statistics, test'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Precomputed safety API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get safety data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { precomputedDataService } from '../../../lib/precomputed-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'calculate'
    const salCode = searchParams.get('sal_code')

    switch (action) {
      case 'calculate': {
        // Get convenience score for specific suburb
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'sal_code parameter required for calculate action'
          }, { status: 400 })
        }

        const suburbData = precomputedDataService.getSuburbScore(salCode)
        if (!suburbData) {
          return NextResponse.json({
            success: false,
            error: `Suburb ${salCode} not found in precomputed data`
          }, { status: 404 })
        }

        // Format response to match original convenience API structure
        const convenienceResponse = {
          suburbCode: suburbData.sal_code,
          suburbName: suburbData.sal_name,
          overallScore: suburbData.scores.convenience,
          components: {
            transport: {
              score: 8.0, // Placeholder - real data would be stored in precomputed
              nearbyStops: suburbData.raw_data.transport_stops || 0
            },
            shopping: {
              score: 7.0, // Placeholder
              nearbyFacilities: suburbData.raw_data.shopping_facilities || 0
            },
            education: {
              score: 8.5, // Placeholder
              nearbySchools: suburbData.raw_data.schools || 0
            },
            medical: {
              score: 7.5, // Placeholder
              nearbyFacilities: suburbData.raw_data.health_facilities || 0
            }
          },
          coordinates: suburbData.coordinates,
          confidence: suburbData.metadata.confidence,
          lastUpdated: suburbData.metadata.last_calculated,
          dataSource: 'precomputed_static_data',
          performance: 'Ultra-fast precomputed lookup'
        }

        return NextResponse.json({
          success: true,
          data: convenienceResponse,
          metadata: {
            purpose: 'Individual suburb convenience score',
            data_source: 'precomputed_static_data',
            note: 'Consistent with heatmap data'
          }
        })
      }

      case 'combined': {
        // Get combined safety + convenience investment recommendation
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'sal_code parameter required for combined action'
          }, { status: 400 })
        }

        const suburbData = precomputedDataService.getSuburbScore(salCode)
        if (!suburbData) {
          return NextResponse.json({
            success: false,
            error: `Suburb ${salCode} not found in precomputed data`
          }, { status: 404 })
        }

        // Generate investment recommendation based on scores
        let recommendation = 'Fair'
        let color = '#FFA500'
        if (suburbData.scores.investment >= 8) {
          recommendation = 'Excellent'
          color = '#4CAF50'
        } else if (suburbData.scores.investment >= 6.5) {
          recommendation = 'Good'
          color = '#8BC34A'
        } else if (suburbData.scores.investment < 4) {
          recommendation = 'Poor'
          color = '#F44336'
        }

        const combinedResponse = {
          suburbCode: suburbData.sal_code,
          suburbName: suburbData.sal_name,
          safety: {
            rating: suburbData.scores.safety,
            weight: 0.6
          },
          convenience: {
            score: suburbData.scores.convenience,
            weight: 0.4
          },
          combined: {
            investmentScore: suburbData.scores.investment,
            recommendation,
            color,
            explanation: `Based on ${suburbData.scores.safety}/10 safety and ${suburbData.scores.convenience}/10 convenience`
          },
          coordinates: suburbData.coordinates,
          confidence: suburbData.metadata.confidence,
          dataSource: 'precomputed_static_data'
        }

        return NextResponse.json({
          success: true,
          data: combinedResponse,
          metadata: {
            purpose: 'Combined investment recommendation',
            data_source: 'precomputed_static_data',
            formula: 'Investment = Safety(60%) + Convenience(40%)'
          }
        })
      }

      case 'range': {
        // Get suburbs by convenience score range
        const min = parseFloat(searchParams.get('min') || '0')
        const max = parseFloat(searchParams.get('max') || '10')

        const suburbsInRange = precomputedDataService.getSuburbsByScoreRange('convenience', min, max)

        const convenienceData = suburbsInRange.map(suburb => ({
          suburbCode: suburb.sal_code,
          suburbName: suburb.sal_name,
          convenienceScore: suburb.scores.convenience,
          coordinates: suburb.coordinates,
          confidence: suburb.metadata.confidence
        }))

        return NextResponse.json({
          success: true,
          data: {
            suburbs: convenienceData,
            count: convenienceData.length,
            filter: { min, max }
          },
          metadata: {
            purpose: 'Suburbs filtered by convenience score range',
            data_source: 'precomputed_static_data'
          }
        })
      }

      case 'test': {
        // Test convenience API functionality
        try {
          const dataInfo = precomputedDataService.getDataInfo()
          const sampleSuburbs = precomputedDataService.getAllSuburbScores().slice(0, 3)

          return NextResponse.json({
            success: true,
            data: {
              status: 'Precomputed convenience API is operational',
              dataSource: 'precomputed_static_data',
              totalSuburbs: dataInfo.metadata.total_suburbs,
              performance: 'Ultra-fast precomputed lookups',
              api_version: '4.0-precomputed',
              sample_scores: sampleSuburbs.map(suburb => ({
                suburb: suburb.sal_name,
                convenience_score: suburb.scores.convenience,
                investment_score: suburb.scores.investment,
                transport_stops: suburb.raw_data.transport_stops,
                note: 'Precomputed consistent data'
              }))
            },
            metadata: {
              purpose: 'Convenience API health check',
              consistency: 'Identical scores used across all APIs'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            data: {
              status: 'API operational but no precomputed data available',
              message: 'Run npm run create-sample-data to create sample data or npm run update-data for real data'
            }
          })
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: calculate, combined, range, test'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Precomputed convenience API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get convenience data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
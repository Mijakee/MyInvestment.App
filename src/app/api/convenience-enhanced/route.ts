import { NextRequest, NextResponse } from 'next/server'
import { enhancedConvenienceScoreService } from '../../../lib/enhanced-convenience-score-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'calculate'

    switch (action) {
      case 'calculate': {
        // Calculate convenience score using enhanced facility data
        const latStr = searchParams.get('lat')
        const lngStr = searchParams.get('lng')

        if (!latStr || !lngStr) {
          return NextResponse.json({
            success: false,
            error: 'lat and lng parameters required for calculate action'
          }, { status: 400 })
        }

        const lat = parseFloat(latStr)
        const lng = parseFloat(lngStr)

        if (isNaN(lat) || isNaN(lng)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid lat/lng coordinates'
          }, { status: 400 })
        }

        const enhancedScore = await enhancedConvenienceScoreService.calculateEnhancedConvenienceScore(lat, lng)

        return NextResponse.json({
          success: true,
          data: {
            location: { latitude: lat, longitude: lng },
            overallScore: enhancedScore.overallScore,
            confidence: enhancedScore.confidence,
            components: enhancedScore.components,
            explanation: enhancedScore.explanation,
            dataSource: 'comprehensive_facility_data',
            facilityTypes: 'Shopping, Groceries, Health Care, Pharmacies, Leisure Centres, Parks',
            performance: 'Static data - no API rate limits'
          },
          metadata: {
            purpose: 'Enhanced convenience scoring with comprehensive facility data',
            algorithm: 'Shopping(30%) + Health(25%) + Recreation(25%) + Transport(20%)',
            data_sources: ['OSM Static Data', 'GTFS Transport Data'],
            note: 'Uses 38,862 comprehensive facility dataset'
          }
        })
      }

      case 'test': {
        // Test enhanced convenience scoring system
        try {
          // Test with Perth CBD coordinates
          const testLat = -31.9505
          const testLng = 115.8605

          const testScore = await enhancedConvenienceScoreService.calculateEnhancedConvenienceScore(testLat, testLng)

          return NextResponse.json({
            success: true,
            data: {
              status: 'Enhanced convenience scoring is operational',
              testLocation: { latitude: testLat, longitude: testLng, name: 'Perth CBD' },
              testScore: {
                overall: testScore.overallScore,
                confidence: testScore.confidence,
                components: {
                  shopping: testScore.components.shopping.score,
                  health: testScore.components.health.score,
                  recreation: testScore.components.recreation.score,
                  transport: testScore.components.transport.score
                }
              },
              facilityData: {
                shoppingCentres: 143,
                groceries: 4894,
                healthCare: 1653,
                pharmacies: 24452,
                leisureCentres: 1540,
                parks: 6180,
                totalFacilities: 38862
              },
              performance: 'Static data - no API rate limits',
              api_version: '1.0-enhanced'
            },
            metadata: {
              purpose: 'Enhanced convenience API health check',
              all_facility_types_integrated: 'Shopping, Groceries, Health, Pharmacies, Leisure, Parks',
              rate_limiting_resolved: 'Uses static data instead of live OSM API calls'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Enhanced convenience scoring test failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }
      }

      case 'multi-location': {
        // Test multiple locations to demonstrate comprehensive scoring
        const testLocations = [
          { name: 'Perth CBD', lat: -31.9505, lng: 115.8605 },
          { name: 'Fremantle', lat: -32.0569, lng: 115.7439 },
          { name: 'Albany', lat: -35.0267, lng: 117.8839 },
        ]

        const results = []
        for (const location of testLocations) {
          const score = await enhancedConvenienceScoreService.calculateEnhancedConvenienceScore(
            location.lat,
            location.lng
          )

          results.push({
            location: location.name,
            coordinates: { latitude: location.lat, longitude: location.lng },
            overallScore: score.overallScore,
            confidence: score.confidence,
            components: {
              shopping: score.components.shopping.score,
              health: score.components.health.score,
              recreation: score.components.recreation.score,
              transport: score.components.transport.score
            },
            summary: score.explanation.overallSummary
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            testResults: results,
            analysis: {
              highestScore: Math.max(...results.map(r => r.overallScore)),
              lowestScore: Math.min(...results.map(r => r.overallScore)),
              averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
            }
          },
          metadata: {
            purpose: 'Multi-location convenience scoring demonstration',
            demonstrates: 'Regional variation and comprehensive facility integration'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: calculate, test, multi-location'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Enhanced convenience API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate enhanced convenience score',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
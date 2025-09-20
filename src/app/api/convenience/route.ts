import { NextRequest, NextResponse } from 'next/server'
import { convenienceScoreService } from '../../../lib/convenience-score-service'
import { safetyRatingService } from '../../../lib/safety-rating-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'test'
    const salCode = searchParams.get('sal_code')

    switch (action) {
      case 'calculate': {
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'sal_code parameter is required'
          }, { status: 400 })
        }

        const convenienceScore = await convenienceScoreService.calculateConvenienceScore(salCode)
        if (!convenienceScore) {
          return NextResponse.json({
            success: false,
            error: `Convenience score not found for SAL code: ${salCode}`
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: convenienceScore
        })
      }

      case 'investment': {
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'sal_code parameter is required'
          }, { status: 400 })
        }

        // Get both safety rating and convenience score
        const [safetyRating, convenienceScore] = await Promise.all([
          safetyRatingService.calculateSafetyRating(salCode),
          convenienceScoreService.calculateConvenienceScore(salCode)
        ])

        if (!safetyRating || !convenienceScore) {
          return NextResponse.json({
            success: false,
            error: `Complete data not available for SAL code: ${salCode}`
          }, { status: 404 })
        }

        const combinedRating = await convenienceScoreService.calculateCombinedRating(
          salCode,
          safetyRating.overallRating
        )

        return NextResponse.json({
          success: true,
          data: {
            safety_rating: safetyRating,
            convenience_score: convenienceScore,
            combined_rating: combinedRating,
            explanation: {
              methodology: '60% safety rating + 40% convenience score',
              safety_components: 'Crime (50%) + Demographics (25%) + Neighborhood (15%) + Trends (10%)',
              convenience_components: 'Transport (40%) + Shopping (25%) + Education (20%) + Recreation (15%)'
            }
          }
        })
      }

      case 'test': {
        // Test the convenience scoring system with sample suburbs
        const testSuburbs = [
          'SAL50686', // Perth CBD
          'SAL50884', // Cottesloe (coastal, affluent)
          'SAL51019', // Fremantle (historic port city)
          'SAL51156', // Joondalup (northern suburban center)
          'SAL50739', // Armadale (southeastern suburban)
          'SAL51234'  // Mandurah (regional coastal)
        ]

        const results = []
        for (const testSalCode of testSuburbs) {
          try {
            // Calculate both safety and convenience
            const [safetyRating, convenienceScore] = await Promise.all([
              safetyRatingService.calculateSafetyRating(testSalCode),
              convenienceScoreService.calculateConvenienceScore(testSalCode)
            ])

            if (safetyRating && convenienceScore) {
              const combinedRating = await convenienceScoreService.calculateCombinedRating(
                testSalCode,
                safetyRating.overallRating
              )

              results.push({
                sal_code: testSalCode,
                suburb_name: safetyRating.suburbName,
                safety_rating: safetyRating.overallRating,
                convenience_score: convenienceScore.overallScore,
                combined_score: combinedRating?.overallInvestmentScore || 0,
                recommendation: combinedRating?.recommendation.level || 'Unknown',
                transport_score: convenienceScore.components.transportAccessibility,
                shopping_score: convenienceScore.components.shoppingServices,
                education_score: convenienceScore.components.educationAccess,
                recreation_score: convenienceScore.components.recreationFacilities
              })
            }
          } catch (error) {
            console.warn(`Error testing suburb ${testSalCode}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            test_results: results,
            methodology: {
              dual_metric_system: {
                safety_rating: {
                  purpose: 'Measures actual safety and security risk',
                  components: 'Crime (50%) + Demographics (25%) + Neighborhood (15%) + Trends (10%)',
                  use_case: 'Investment risk assessment, family safety considerations'
                },
                convenience_score: {
                  purpose: 'Measures daily life convenience and accessibility',
                  components: 'Transport (40%) + Shopping (25%) + Education (20%) + Recreation (15%)',
                  use_case: 'Lifestyle assessment, commuter-focused decisions'
                },
                combined_investment_index: {
                  formula: 'Safety (60%) + Convenience (40%) = Overall Investment Score',
                  purpose: 'Holistic investment recommendation for property buyers'
                }
              }
            },
            note: 'Dual metric system correctly separates safety from convenience as per architectural requirements'
          }
        })
      }

      case 'batch': {
        const salCodesParam = searchParams.get('sal_codes')
        if (!salCodesParam) {
          return NextResponse.json({
            success: false,
            error: 'sal_codes parameter is required (comma-separated)'
          }, { status: 400 })
        }

        const salCodes = salCodesParam.split(',').map(code => code.trim())
        const convenienceScores = await convenienceScoreService.calculateBatchConvenienceScores(salCodes)

        return NextResponse.json({
          success: true,
          data: {
            convenience_scores: convenienceScores,
            processed_count: convenienceScores.length,
            requested_count: salCodes.length
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: calculate, investment, test, batch'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Convenience API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process convenience score request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
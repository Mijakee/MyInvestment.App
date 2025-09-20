import { NextRequest, NextResponse } from 'next/server'
import { safetyRatingService, crimeScoreService } from '../../../lib/safety-rating-service'
import { waSuburbLoader } from '../../../lib/wa-suburb-loader'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'suburb'

    switch (action) {
      case 'suburb': {
        const salCode = searchParams.get('sal_code')

        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required'
          }, { status: 400 })
        }

        console.log(`Calculating safety rating for suburb ${salCode}...`)
        const startTime = Date.now()

        const safetyRating = await safetyRatingService.calculateSafetyRating(salCode)

        if (!safetyRating) {
          return NextResponse.json({
            success: false,
            error: 'Unable to calculate safety rating for this suburb'
          }, { status: 404 })
        }

        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: safetyRating,
          metadata: {
            processingTimeMs: duration,
            algorithm: 'Crime Score: Direct Crime 70% + Neighborhood Crime 30% (Higher score = worse crime)'
          }
        })
      }

      case 'batch': {
        const salCodes = searchParams.get('sal_codes')?.split(',') || []
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

        if (salCodes.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'At least one SAL code required'
          }, { status: 400 })
        }

        const limitedCodes = salCodes.slice(0, limit)

        console.log(`Calculating safety ratings for ${limitedCodes.length} suburbs...`)
        const startTime = Date.now()

        const safetyRatings = await safetyRatingService.calculateBatchSafetyRatings(limitedCodes)
        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: safetyRatings,
          metadata: {
            total: safetyRatings.length,
            requested: limitedCodes.length,
            processingTimeMs: duration,
            averageTimePerSuburb: Math.round(duration / safetyRatings.length)
          }
        })
      }

      case 'test': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

        // Get a sample of different suburb types for testing
        const allSuburbs = waSuburbLoader.getAllSuburbs()
        const testSuburbs = [
          ...allSuburbs.filter(s => s.classification_type === 'Urban').slice(0, limit/5),
          ...allSuburbs.filter(s => s.classification_type === 'Suburban').slice(0, limit/5),
          ...allSuburbs.filter(s => s.classification_type === 'Coastal').slice(0, limit/5),
          ...allSuburbs.filter(s => s.classification_type === 'Remote').slice(0, limit/5),
          ...allSuburbs.filter(s => s.classification_type === 'Mining').slice(0, limit/5)
        ].slice(0, limit)

        const testCodes = testSuburbs.map(s => s.sal_code)

        console.log(`Running safety rating test on ${testCodes.length} diverse suburbs...`)
        const startTime = Date.now()

        const safetyRatings = await safetyRatingService.calculateBatchSafetyRatings(testCodes)
        const duration = Date.now() - startTime

        // Calculate test statistics
        const ratings = safetyRatings.map(r => r.overallRating)
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
        const minRating = Math.min(...ratings)
        const maxRating = Math.max(...ratings)

        const confidenceScores = safetyRatings.map(r => r.confidence)
        const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length

        return NextResponse.json({
          success: true,
          data: safetyRatings,
          testResults: {
            totalSuburbsTested: safetyRatings.length,
            processingTimeMs: duration,
            averageTimePerSuburb: Math.round(duration / safetyRatings.length),
            ratingStatistics: {
              average: Math.round(avgRating * 10) / 10,
              minimum: Math.round(minRating * 10) / 10,
              maximum: Math.round(maxRating * 10) / 10,
              range: Math.round((maxRating - minRating) * 10) / 10
            },
            confidenceStatistics: {
              average: Math.round(avgConfidence * 100) / 100,
              dataAvailability: {
                withCensusData: safetyRatings.filter(r => r.dataAvailability.hasCensusData).length,
                withCrimeData: safetyRatings.filter(r => r.dataAvailability.hasCrimeData).length,
                withNeighborData: safetyRatings.filter(r => r.dataAvailability.hasNeighborData).length
              }
            }
          }
        })
      }

      case 'stats': {
        const stats = waSuburbLoader.getStatistics()

        return NextResponse.json({
          success: true,
          data: {
            totalSuburbs: stats.total_suburbs,
            classifications: stats.classifications,
            economicBases: stats.economic_bases,
            dataIntegration: {
              censusMapping: stats.with_sa2_mapping,
              censusCoverage: Math.round(stats.mapping_coverage.sa2_percentage * 10) / 10,
              policeCoverage: Math.round(stats.mapping_coverage.police_percentage * 10) / 10,
              note: 'Using synthetic crime data pending WA Police integration'
            },
            algorithm: {
              components: [
                'Crime Data (85%): Crime rate, severity, violent crime ratio',
                'Demographics (0%): Moved to separate livability score',
                'Neighborhood (15%): Nearby suburb crime influence',
                'Trends (0%): Moved to separate trend analysis'
              ],
              scale: '1-10 (1 = highest concern, 10 = safest)',
              confidence: 'Based on data availability and quality'
            }
          }
        })
      }

      case 'crime': {
        const salCode = searchParams.get('sal_code')

        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required'
          }, { status: 400 })
        }

        console.log(`Calculating crime score for suburb ${salCode}...`)
        const startTime = Date.now()

        const crimeScore = await crimeScoreService.calculateCrimeScore(salCode)

        if (!crimeScore) {
          return NextResponse.json({
            success: false,
            error: 'Unable to calculate crime score for this suburb'
          }, { status: 404 })
        }

        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: crimeScore,
          metadata: {
            processingTimeMs: duration,
            algorithm: 'Crime Score: Direct Crime 70% + Neighborhood Crime 30% (Higher score = worse crime)',
            note: 'This is the new crime-focused scoring system'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported: suburb, batch, test, stats, crime'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Safety Rating API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
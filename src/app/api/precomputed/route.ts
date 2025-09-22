import { NextRequest, NextResponse } from 'next/server'
import { precomputedDataService } from '../../../lib/precomputed-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'info'
    const salCode = searchParams.get('sal_code')
    const metric = searchParams.get('metric') as 'safety' | 'crime' | 'convenience' | 'investment'
    const min = parseFloat(searchParams.get('min') || '0')
    const max = parseFloat(searchParams.get('max') || '10')
    const query = searchParams.get('query')

    switch (action) {
      case 'info': {
        // Get data freshness and statistics
        const dataInfo = precomputedDataService.getDataInfo()
        const statistics = precomputedDataService.getDataStatistics()

        return NextResponse.json({
          success: true,
          data: {
            info: dataInfo,
            statistics
          },
          metadata: {
            purpose: 'Precomputed data overview and freshness check'
          }
        })
      }

      case 'suburb': {
        // Get specific suburb scores
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

        return NextResponse.json({
          success: true,
          data: suburbData,
          metadata: {
            purpose: 'Individual suburb precomputed scores',
            data_source: 'static_precomputed',
            performance: 'Ultra-fast lookup'
          }
        })
      }

      case 'all': {
        // Get all suburb scores
        const allSuburbs = precomputedDataService.getAllSuburbScores()

        return NextResponse.json({
          success: true,
          data: {
            suburbs: allSuburbs,
            count: allSuburbs.length
          },
          metadata: {
            purpose: 'All precomputed suburb scores',
            data_source: 'static_precomputed'
          }
        })
      }

      case 'range': {
        // Get suburbs by score range
        if (!metric) {
          return NextResponse.json({
            success: false,
            error: 'metric parameter required for range action. Use: safety, crime, convenience, investment'
          }, { status: 400 })
        }

        const suburbsInRange = precomputedDataService.getSuburbsByScoreRange(metric, min, max)

        return NextResponse.json({
          success: true,
          data: {
            suburbs: suburbsInRange,
            count: suburbsInRange.length,
            filter: { metric, min, max }
          },
          metadata: {
            purpose: 'Suburbs filtered by score range',
            data_source: 'static_precomputed'
          }
        })
      }

      case 'search': {
        // Search suburbs by name
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'query parameter required for search action'
          }, { status: 400 })
        }

        const searchResults = precomputedDataService.searchSuburbs(query)

        return NextResponse.json({
          success: true,
          data: {
            suburbs: searchResults,
            count: searchResults.length,
            query
          },
          metadata: {
            purpose: 'Suburb name search results',
            data_source: 'static_precomputed'
          }
        })
      }

      case 'heatmap': {
        // Get heatmap-optimized data
        const allSuburbs = precomputedDataService.getAllSuburbScores()
        const selectedMetric = metric || 'investment'

        const heatmapPoints = allSuburbs.map(suburb => ({
          lat: suburb.coordinates.latitude,
          lng: suburb.coordinates.longitude,
          intensity: suburb.scores[selectedMetric] / 10, // Normalize to 0-1
          suburbName: suburb.sal_name,
          salCode: suburb.sal_code,
          score: suburb.scores[selectedMetric]
        }))

        return NextResponse.json({
          success: true,
          data: {
            points: heatmapPoints,
            metric: selectedMetric,
            count: heatmapPoints.length
          },
          metadata: {
            purpose: 'Heatmap visualization data',
            data_source: 'static_precomputed',
            performance: 'Instant generation from precomputed scores'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: info, suburb, all, range, search, heatmap'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Precomputed data API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to access precomputed data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
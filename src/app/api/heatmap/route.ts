import { NextRequest, NextResponse } from 'next/server'
import { precomputedDataService } from '../../../lib/precomputed-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'optimized'
    const metric = searchParams.get('metric') as 'safety' | 'crime' | 'convenience' | 'investment' || 'investment'
    const bounds = searchParams.get('bounds')

    switch (action) {
      case 'status': {
        // Check precomputed data status
        const dataInfo = precomputedDataService.getDataInfo()

        return NextResponse.json({
          success: true,
          data: {
            cacheExists: true,
            cachedSuburbs: dataInfo.metadata.total_suburbs,
            cacheStatus: 'Available',
            lastUpdated: dataInfo.metadata.last_updated,
            dataSource: 'precomputed_static_data',
            performance: 'Ultra-fast precomputed lookups',
            recommendations: dataInfo.freshness.is_stale ? [
              'Precomputed data is stale',
              'Run npm run update-data to refresh with latest external data',
              `Next update due: ${dataInfo.freshness.next_update_due}`
            ] : [
              `Precomputed data contains ${dataInfo.metadata.total_suburbs} suburbs`,
              'Heat map will load instantly using static data',
              `Next update due: ${dataInfo.freshness.next_update_due.toISOString().split('T')[0]}`
            ]
          },
          metadata: {
            purpose: 'Precomputed data status and recommendations'
          }
        })
      }

      case 'full':
      case 'optimized': {
        // Return heatmap data from precomputed scores (DEFAULT)
        try {
          const allSuburbs = precomputedDataService.getAllSuburbScoresWithFallback()

          const heatmapPoints = allSuburbs.map(suburb => ({
            lat: suburb.coordinates.latitude,
            lng: suburb.coordinates.longitude,
            intensity: suburb.scores[metric] / 10, // Normalize to 0-1
            suburbName: suburb.sal_name,
            safetyRating: suburb.scores.safety,
            convenienceScore: suburb.scores.convenience,
            combinedScore: suburb.scores.investment
          }))

          return NextResponse.json({
            success: true,
            data: {
              points: heatmapPoints
            },
            metadata: {
              metric: metric,
              dataSize: heatmapPoints.length,
              source: 'precomputed_static_data',
              performance: 'Ultra-fast (precomputed data)',
              note: 'Optimized for Leaflet.js, Google Maps, or Mapbox integration'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'No precomputed data available',
            message: 'npm run update-data to generate precomputed scores',
            quickStart: {
              
              updateRealData: 'npm run update-data'
            }
          }, { status: 404 })
        }
      }

      case 'bounded': {
        // Return heat map data within specific geographic bounds
        if (!bounds) {
          return NextResponse.json({
            success: false,
            error: 'bounds parameter required. Format: "north,south,east,west"'
          }, { status: 400 })
        }

        const [north, south, east, west] = bounds.split(',').map(Number)
        if ([north, south, east, west].some(isNaN)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid bounds format. Use: "north,south,east,west" with numeric values'
          }, { status: 400 })
        }

        try {
          const allSuburbs = precomputedDataService.getAllSuburbScoresWithFallback()

          // Filter by bounds
          const boundedSuburbs = allSuburbs.filter(suburb =>
            suburb.coordinates.latitude >= south &&
            suburb.coordinates.latitude <= north &&
            suburb.coordinates.longitude >= west &&
            suburb.coordinates.longitude <= east
          )

          const heatmapPoints = boundedSuburbs.map(suburb => ({
            lat: suburb.coordinates.latitude,
            lng: suburb.coordinates.longitude,
            intensity: suburb.scores[metric] / 10,
            suburbName: suburb.sal_name
          }))

          return NextResponse.json({
            success: true,
            data: {
              points: heatmapPoints,
              bounds: { north, south, east, west },
              filteredCount: heatmapPoints.length,
              totalCount: allSuburbs.length
            },
            metadata: {
              metric: metric,
              source: 'precomputed_static_data',
              viewport: 'Filtered by geographic bounds',
              note: 'Optimized for specific map viewport'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'No precomputed data available for bounded query'
          }, { status: 404 })
        }
      }

      case 'statistics': {
        // Return heat map statistics and metadata without points
        try {
          const dataInfo = precomputedDataService.getDataInfo()
          const statistics = precomputedDataService.getDataStatistics()

          return NextResponse.json({
            success: true,
            data: {
              statistics: statistics,
              bounds: {
                // Calculate bounds from all suburbs
                north: Math.max(...precomputedDataService.getAllSuburbScores().map(s => s.coordinates.latitude)),
                south: Math.min(...precomputedDataService.getAllSuburbScores().map(s => s.coordinates.latitude)),
                east: Math.max(...precomputedDataService.getAllSuburbScores().map(s => s.coordinates.longitude)),
                west: Math.min(...precomputedDataService.getAllSuburbScores().map(s => s.coordinates.longitude))
              },
              lastUpdated: dataInfo.metadata.last_updated,
              source: 'precomputed_static_data'
            },
            metadata: {
              purpose: 'Heat map overview and bounds information',
              note: 'Use for map initialization and legend configuration'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'No precomputed statistics available'
          }, { status: 404 })
        }
      }

      case 'export': {
        // Export complete heat map data as JSON
        try {
          const allSuburbs = precomputedDataService.getAllSuburbScoresWithFallback()
          const exportData = JSON.stringify({
            metadata: precomputedDataService.getDataInfo(),
            heatmap_data: allSuburbs.map(suburb => ({
              sal_code: suburb.sal_code,
              name: suburb.sal_name,
              coordinates: suburb.coordinates,
              scores: suburb.scores
            }))
          }, null, 2)

          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="wa_suburbs_heatmap_precomputed.json"'
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'No precomputed data available for export'
          }, { status: 404 })
        }
      }

      case 'test': {
        // Fast test to check if precomputed heat map is working
        try {
          const dataInfo = precomputedDataService.getDataInfo()
          const sampleSuburbs = precomputedDataService.getAllSuburbScores().slice(0, 3)

          return NextResponse.json({
            success: true,
            data: {
              status: 'Precomputed heat map API is operational',
              dataSource: 'precomputed_static_data',
              totalSuburbs: dataInfo.metadata.total_suburbs,
              performance: 'Ultra-fast precomputed data',
              api_version: '4.0-precomputed',
              sample_data: sampleSuburbs.map(suburb => ({
                suburb: suburb.sal_name,
                safety: suburb.scores.safety,
                investment: suburb.scores.investment,
                note: 'Real precomputed data'
              }))
            },
            metadata: {
              purpose: 'Fast API health check',
              recommendations: [
                `Precomputed data contains ${dataInfo.metadata.total_suburbs} suburbs`,
                'All scores are consistent across heatmap and individual APIs',
                'Data refresh available with npm run update-data'
              ]
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
          error: 'Invalid action. Use: status, full, optimized, bounded, statistics, export, test'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Precomputed heat map API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate heat map data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
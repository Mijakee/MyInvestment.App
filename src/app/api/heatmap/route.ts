import { NextRequest, NextResponse } from 'next/server'
import { heatMapDataService } from '../../../lib/heatmap-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'optimized'
    const metric = searchParams.get('metric') as 'crime' | 'convenience' | 'investment' || 'investment'
    const bounds = searchParams.get('bounds') // Format: "north,south,east,west"

    switch (action) {
      case 'full': {
        // Return complete heat map dataset with all suburb details
        const fullData = await heatMapDataService.generateHeatMapData()

        return NextResponse.json({
          success: true,
          data: fullData,
          metadata: {
            dataSize: fullData.points.length,
            lastUpdated: fullData.lastUpdated,
            coverage: 'All 1,701 WA suburbs',
            note: 'Complete dataset with safety, convenience, and combined ratings'
          }
        })
      }

      case 'optimized': {
        // Return optimized data for web visualization (smaller payload)
        const optimizedData = await heatMapDataService.getOptimizedHeatMapData(metric)

        return NextResponse.json({
          success: true,
          data: optimizedData,
          metadata: {
            metric: metric,
            dataSize: optimizedData.points.length,
            optimization: 'Reduced payload for web visualization',
            note: 'Optimized for Leaflet.js, Google Maps, or Mapbox integration'
          }
        })
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

        const fullData = await heatMapDataService.generateHeatMapData()
        const boundedPoints = heatMapDataService.filterByBounds(fullData.points, {
          north, south, east, west
        })

        const heatPoints = heatMapDataService.getHeatMapForMetric(boundedPoints, metric)

        return NextResponse.json({
          success: true,
          data: {
            points: heatPoints,
            bounds: { north, south, east, west },
            filteredCount: heatPoints.length,
            totalCount: fullData.points.length
          },
          metadata: {
            metric: metric,
            viewport: 'Filtered by geographic bounds',
            note: 'Optimized for specific map viewport'
          }
        })
      }

      case 'statistics': {
        // Return heat map statistics and metadata without points
        const fullData = await heatMapDataService.generateHeatMapData()

        return NextResponse.json({
          success: true,
          data: {
            statistics: fullData.statistics,
            bounds: fullData.bounds,
            lastUpdated: fullData.lastUpdated
          },
          metadata: {
            purpose: 'Heat map overview and bounds information',
            note: 'Use for map initialization and legend configuration'
          }
        })
      }

      case 'export': {
        // Export complete heat map data as JSON (for static hosting)
        const exportData = await heatMapDataService.exportHeatMapData()

        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="wa_suburbs_heatmap.json"'
          }
        })
      }

      case 'test': {
        // Test heat map generation with sample data
        const sampleSuburbs = [
          '50008', // Alexander Heights
          '50022', // Applecross
          '50026', // Armadale
          '50006', // Albany
          '50038'  // Augusta
        ]

        const testPoints = []
        for (const salCode of sampleSuburbs) {
          try {
            const fullData = await heatMapDataService.generateHeatMapData()
            const suburbPoint = fullData.points.find(p => p.salCode === salCode)
            if (suburbPoint) {
              testPoints.push(suburbPoint)
            }
          } catch (error) {
            console.warn(`Test failed for suburb ${salCode}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            test_points: testPoints,
            sample_size: testPoints.length,
            requested_size: sampleSuburbs.length,
            heat_map_demo: testPoints.map(point => ({
              suburb: point.suburbName,
              safety_heat: point.safetyIntensity,
              convenience_heat: point.convenienceIntensity,
              combined_heat: point.combinedIntensity,
              coordinates: [point.lat, point.lng]
            }))
          },
          metadata: {
            purpose: 'Heat map system testing',
            note: 'Sample data for development and testing'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: full, optimized, bounded, statistics, export, test'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Heat map API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate heat map data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
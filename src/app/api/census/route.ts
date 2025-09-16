import { NextRequest, NextResponse } from 'next/server'
import { absCensusService, getCensusAvailabilityStats } from '../../../lib/abs-census-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats': {
        const stats = getCensusAvailabilityStats()

        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            message: 'Census data available via SA2 mappings',
            dataSource: 'ABS 2021 Census (synthetic baseline until API configured)'
          }
        })
      }

      case 'suburb': {
        const salCode = searchParams.get('sal_code')
        const year = parseInt(searchParams.get('year') || '2021')

        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required'
          }, { status: 400 })
        }

        const censusData = await absCensusService.getCensusDataForSuburb(salCode, year)

        if (!censusData) {
          return NextResponse.json({
            success: false,
            error: 'No Census data available for this suburb'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: censusData
        })
      }

      case 'batch': {
        const salCodes = searchParams.get('sal_codes')?.split(',') || []
        const year = parseInt(searchParams.get('year') || '2021')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

        if (salCodes.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'At least one SAL code required'
          }, { status: 400 })
        }

        const limitedCodes = salCodes.slice(0, limit)
        const censusDataMap = await absCensusService.getCensusDataBatch(limitedCodes, year)
        const results = Array.from(censusDataMap.values())

        return NextResponse.json({
          success: true,
          data: results,
          total: results.length,
          requested: limitedCodes.length
        })
      }

      case 'all': {
        const year = parseInt(searchParams.get('year') || '2021')
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

        console.log(`Fetching Census data for up to ${limit} suburbs...`)
        const startTime = Date.now()

        // Get limited subset for performance
        const allCensusData = await absCensusService.getAllWACensusData(year)
        const limitedData = allCensusData.slice(0, limit)

        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: limitedData,
          metadata: {
            total: limitedData.length,
            year,
            processingTimeMs: duration,
            note: 'Using synthetic Census data pending full ABS API integration'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported: stats, suburb, batch, all'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Census API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { waPoliceCrimeService, getCrimeStatistics } from '../../../lib/wa-police-crime-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats': {
        const stats = getCrimeStatistics()

        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            message: 'Real WA Police crime data integrated with district-level analysis'
          }
        })
      }

      case 'suburb': {
        const salCode = searchParams.get('sal_code')

        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required'
          }, { status: 400 })
        }

        const crimeData = await waPoliceCrimeService.getCrimeDataForSuburb(salCode)

        if (!crimeData) {
          return NextResponse.json({
            success: false,
            error: 'No crime data available for this suburb'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: crimeData
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

        console.log(`Fetching crime data for ${limitedCodes.length} suburbs...`)
        const startTime = Date.now()

        const crimeDataPromises = limitedCodes.map(async (salCode) => {
          const data = await waPoliceCrimeService.getCrimeDataForSuburb(salCode)
          return { salCode, data }
        })

        const results = await Promise.all(crimeDataPromises)
        const validResults = results.filter(r => r.data !== null).map(r => r.data!)

        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: validResults,
          metadata: {
            total: validResults.length,
            requested: limitedCodes.length,
            processingTimeMs: duration,
            averageTimePerSuburb: Math.round(duration / validResults.length)
          }
        })
      }

      case 'test': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

        // Test with known Perth suburbs
        const testCodes = ['51230', '50464', '51147', '51381', '50321'] // Perth CBD, East Perth, North Perth, South Perth, Cottesloe

        console.log(`Testing crime data integration for ${testCodes.length} Perth suburbs...`)
        const startTime = Date.now()

        const crimeDataPromises = testCodes.slice(0, limit).map(async (salCode) => {
          const data = await waPoliceCrimeService.getCrimeDataForSuburb(salCode)
          return data
        })

        const results = await Promise.all(crimeDataPromises)
        const validResults = results.filter(r => r !== null)

        const duration = Date.now() - startTime

        // Calculate test statistics
        const crimeRates = validResults.map(r => r!.crimeRate)
        const totalOffenses = validResults.map(r => r!.totalOffenses)

        const avgCrimeRate = crimeRates.reduce((a, b) => a + b, 0) / crimeRates.length
        const avgOffenses = totalOffenses.reduce((a, b) => a + b, 0) / totalOffenses.length

        return NextResponse.json({
          success: true,
          data: validResults,
          testResults: {
            totalSuburbsTested: validResults.length,
            processingTimeMs: duration,
            averageTimePerSuburb: Math.round(duration / validResults.length),
            crimeStatistics: {
              averageCrimeRate: Math.round(avgCrimeRate * 10) / 10,
              averageTotalOffenses: Math.round(avgOffenses),
              rateRange: {
                min: Math.min(...crimeRates),
                max: Math.max(...crimeRates)
              }
            },
            dataQuality: {
              dataAvailability: (validResults.length / limit) * 100,
              trendsAvailable: validResults.filter(r => r!.trend !== 'stable').length,
              categoriesComplete: validResults.filter(r =>
                Object.values(r!.categories).reduce((a, b) => a + b, 0) > 0
              ).length
            }
          }
        })
      }

      case 'districts': {
        const availableDistricts = waPoliceCrimeService.getAvailableDistricts()

        return NextResponse.json({
          success: true,
          data: {
            totalDistricts: availableDistricts.length,
            districts: availableDistricts,
            note: 'WA Police districts available for crime data mapping'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported: stats, suburb, batch, test, districts'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Crime API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
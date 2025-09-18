import { NextRequest, NextResponse } from 'next/server'
import { loadAncestryDataForSA2, testAncestryDataAccess } from '../../../lib/ancestry-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sa2Code = searchParams.get('sa2_code')
    const action = searchParams.get('action') || 'ancestry'

    if (!sa2Code) {
      return NextResponse.json({
        success: false,
        error: 'SA2 code required'
      }, { status: 400 })
    }

    switch (action) {
      case 'ancestry': {
        const ancestryData = await loadAncestryDataForSA2(sa2Code)

        if (!ancestryData) {
          return NextResponse.json({
            success: false,
            error: 'Ancestry data not found for this SA2 code'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: {
            sa2_code: sa2Code,
            ancestry: ancestryData,
            source: '2021 ABS Census G09A - Country of Birth',
            note: 'Data represents country of birth demographics for this statistical area'
          }
        })
      }

      case 'test': {
        const testResult = await testAncestryDataAccess()

        if (!testResult.success) {
          return NextResponse.json({
            success: false,
            error: testResult.error
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: testResult.info
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: ancestry, test'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Demographics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load demographic data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
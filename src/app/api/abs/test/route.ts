import { NextRequest, NextResponse } from 'next/server'
import { testABSConnection, getABSDataflows, searchABSDataflows } from '@/lib/abs-api'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'test'
    const search = searchParams.get('search')

    switch (action) {
      case 'test':
        const connectionTest = await testABSConnection()
        return NextResponse.json({
          success: connectionTest.success,
          data: connectionTest.data,
          error: connectionTest.error
        })

      case 'dataflows':
        const dataflows = await getABSDataflows()
        return NextResponse.json({
          success: dataflows.success,
          data: dataflows.success ? {
            message: 'Dataflows retrieved successfully',
            format: dataflows.data?.format || 'xml',
            dataflowCount: dataflows.data?.dataflowCount || 0,
            responseSize: dataflows.data?.responseSize || 0,
            timestamp: dataflows.data?.timestamp || new Date().toISOString(),
            endpoint: dataflows.data?.endpoint,
            // Don't return the actual XML content - too large for JSON response
            contentPreview: dataflows.data?.content?.substring?.(0, 500) + '...',
          } : dataflows.data,
          error: dataflows.error
        })

      case 'search':
        if (!search) {
          return NextResponse.json({
            success: false,
            error: 'Search parameter required'
          }, { status: 400 })
        }

        const searchResults = await searchABSDataflows(search)
        return NextResponse.json({
          success: searchResults.success,
          data: searchResults.data,
          error: searchResults.error
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: test, dataflows, or search'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in ABS test endpoint:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to test ABS API',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
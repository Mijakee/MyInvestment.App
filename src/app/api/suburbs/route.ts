import { NextRequest, NextResponse } from 'next/server'
import { waSuburbLoader } from '../../../lib/wa-suburb-loader'
import type { ApiResponse, PaginatedResponse } from '../../../types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 2000)
        const state = searchParams.get('state')
        const classification = searchParams.get('classification')
        const economicBase = searchParams.get('economicBase')

        let suburbs = waSuburbLoader.getAllSuburbs()

        // Apply filters
        if (state && state.toLowerCase() !== 'wa') {
          // Only WA suburbs available
          suburbs = []
        }
        if (classification) {
          suburbs = suburbs.filter(s => s.classification_type === classification)
        }
        if (economicBase) {
          suburbs = suburbs.filter(s => s.economic_base.includes(economicBase))
        }

        // Pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedSuburbs = suburbs.slice(startIndex, endIndex)

        const response: PaginatedResponse<any> = {
          success: true,
          data: paginatedSuburbs,
          pagination: {
            page,
            limit,
            total: suburbs.length,
            hasMore: endIndex < suburbs.length
          }
        }

        return NextResponse.json(response)
      }

      case 'search': {
        const query = searchParams.get('q')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Search query required'
          }, { status: 400 })
        }

        const results = waSuburbLoader.searchSuburbsByName(query, limit)

        return NextResponse.json({
          success: true,
          data: results,
          total: results.length
        })
      }

      case 'stats': {
        const stats = waSuburbLoader.getStatistics()

        return NextResponse.json({
          success: true,
          data: stats
        })
      }

      case 'sal': {
        const salCode = searchParams.get('code')

        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required'
          }, { status: 400 })
        }

        const suburb = waSuburbLoader.getSuburbBySALCode(salCode)

        if (!suburb) {
          return NextResponse.json({
            success: false,
            error: 'Suburb not found'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: suburb
        })
      }

      default: {
        // Default to list for backward compatibility
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const suburbs = waSuburbLoader.getAllSuburbs()

        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedSuburbs = suburbs.slice(startIndex, endIndex)

        const response: PaginatedResponse<any> = {
          success: true,
          data: paginatedSuburbs,
          pagination: {
            page,
            limit,
            total: suburbs.length,
            hasMore: endIndex < suburbs.length
          }
        }

        return NextResponse.json(response)
      }
    }

  } catch (error) {
    console.error('Suburb API Error:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch suburbs'
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
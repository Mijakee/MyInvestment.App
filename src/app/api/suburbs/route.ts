import { NextRequest, NextResponse } from 'next/server'
import { mockSuburbs } from '@/data/mock-suburbs'
import type { ApiResponse, PaginatedResponse, Suburb } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const state = searchParams.get('state')
    const minSafetyRating = parseFloat(searchParams.get('minSafetyRating') || '0')

    // Filter suburbs
    let filteredSuburbs = mockSuburbs

    if (state) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.state.toLowerCase() === state.toLowerCase()
      )
    }

    if (minSafetyRating > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.safetyRating >= minSafetyRating
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedSuburbs = filteredSuburbs.slice(startIndex, endIndex)

    const response: PaginatedResponse<Suburb> = {
      success: true,
      data: paginatedSuburbs,
      pagination: {
        page,
        limit,
        total: filteredSuburbs.length,
        hasMore: endIndex < filteredSuburbs.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching suburbs:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch suburbs',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
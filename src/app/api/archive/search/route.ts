import { NextRequest, NextResponse } from 'next/server'
import { mockSuburbs } from '@/data/mock-suburbs'
import type { ApiResponse, PaginatedResponse, Suburb, SearchCriteria } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const criteria: SearchCriteria = await request.json()
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 100)

    let filteredSuburbs = [...mockSuburbs]

    // Apply filters
    if (criteria.states && criteria.states.length > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        criteria.states!.some(state =>
          suburb.state.toLowerCase() === state.toLowerCase()
        )
      )
    }

    if (criteria.minSafetyRating !== undefined && criteria.minSafetyRating > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.safetyRating >= criteria.minSafetyRating!
      )
    }

    if (criteria.minPopulation !== undefined && criteria.minPopulation > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        (suburb.population || 0) >= criteria.minPopulation!
      )
    }

    if (criteria.maxPopulation !== undefined && criteria.maxPopulation > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        (suburb.population || 0) <= criteria.maxPopulation!
      )
    }

    // Apply sorting
    if (criteria.sortBy) {
      filteredSuburbs.sort((a, b) => {
        let valueA: number
        let valueB: number

        switch (criteria.sortBy) {
          case 'safetyRating':
            valueA = a.safetyRating
            valueB = b.safetyRating
            break
          case 'population':
            valueA = a.population || 0
            valueB = b.population || 0
            break
          default:
            valueA = a.safetyRating
            valueB = b.safetyRating
        }

        if (criteria.sortOrder === 'asc') {
          return valueA - valueB
        } else {
          return valueB - valueA
        }
      })
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
    console.error('Error searching suburbs:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to search suburbs',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint for basic search via query params
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const state = searchParams.get('state')
    const minSafetyRating = parseFloat(searchParams.get('minSafetyRating') || '0')

    let filteredSuburbs = [...mockSuburbs]

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase()
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.name.toLowerCase().includes(searchTerm) ||
        suburb.postcode.includes(searchTerm) ||
        suburb.state.toLowerCase().includes(searchTerm)
      )
    }

    // State filter
    if (state) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.state.toLowerCase() === state.toLowerCase()
      )
    }

    // Safety rating filter
    if (minSafetyRating > 0) {
      filteredSuburbs = filteredSuburbs.filter(suburb =>
        suburb.safetyRating >= minSafetyRating
      )
    }

    const response: ApiResponse<Suburb[]> = {
      success: true,
      data: filteredSuburbs,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error searching suburbs:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to search suburbs',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
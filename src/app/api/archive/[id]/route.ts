import { NextRequest, NextResponse } from 'next/server'
import { mockSuburbs } from '@/data/mock-suburbs'
import type { ApiResponse, Suburb } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: suburbId } = await params

    const suburb = mockSuburbs.find(s => s.id === suburbId)

    if (!suburb) {
      const notFoundResponse: ApiResponse<null> = {
        success: false,
        error: 'Suburb not found',
      }
      return NextResponse.json(notFoundResponse, { status: 404 })
    }

    const response: ApiResponse<Suburb> = {
      success: true,
      data: suburb,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching suburb:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch suburb',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
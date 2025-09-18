import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')

    if (file === 'wa_suburbs.geojson') {
      // Read the GeoJSON file
      const filePath = join(process.cwd(), 'src/data/geographic/wa_suburbs.geojson')
      const data = readFileSync(filePath, 'utf8')
      const geojson = JSON.parse(data)

      return NextResponse.json(geojson, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        }
      })
    }

    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Geographic data API error:', error)
    return NextResponse.json(
      { error: 'Failed to load geographic data' },
      { status: 500 }
    )
  }
}
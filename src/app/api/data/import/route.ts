import { NextRequest, NextResponse } from 'next/server'
import { parseCSV, parseG01CensusData, parseG02CensusData, convertToSuburbData, validateG01Structure, validateG02Structure } from '@/lib/csv-parser'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const g01File = formData.get('g01') as File
    const g02File = formData.get('g02') as File
    const importType = formData.get('type') as string

    if (importType === 'validate' && g01File) {
      // Validate file structure
      const g01Content = await g01File.text()
      const g01Rows = parseCSV(g01Content)

      if (g01Rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid CSV format or empty file'
        }, { status: 400 })
      }

      const headers = Object.keys(g01Rows[0])
      const isValidG01 = validateG01Structure(headers)

      let isValidG02 = false
      let g02Headers: string[] = []

      if (g02File) {
        const g02Content = await g02File.text()
        const g02Rows = parseCSV(g02Content)
        if (g02Rows.length > 0) {
          g02Headers = Object.keys(g02Rows[0])
          isValidG02 = validateG02Structure(g02Headers)
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          g01: {
            valid: isValidG01,
            headers: headers,
            rowCount: g01Rows.length
          },
          g02: g02File ? {
            valid: isValidG02,
            headers: g02Headers,
            rowCount: g02File ? parseCSV(await g02File.text()).length : 0
          } : null
        }
      })
    }

    if (importType === 'process' && g01File) {
      // Process and transform the data
      const g01Content = await g01File.text()
      const g01Rows = parseCSV(g01Content)

      if (g01Rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid G01 CSV file'
        }, { status: 400 })
      }

      const g01Data = parseG01CensusData(g01Rows)

      let g02Data: any[] = []
      if (g02File) {
        const g02Content = await g02File.text()
        const g02Rows = parseCSV(g02Content)
        if (g02Rows.length > 0) {
          g02Data = parseG02CensusData(g02Rows)
        }
      }

      // Convert to our suburb format
      const suburbs = convertToSuburbData(g01Data, g02Data)

      // In a real implementation, you would save this to database
      // For now, return sample data
      const sampleSuburbs = suburbs.slice(0, 10) // Return first 10 for demo

      return NextResponse.json({
        success: true,
        data: {
          imported: sampleSuburbs.length,
          total: suburbs.length,
          sample: sampleSuburbs,
          message: `Successfully processed ${suburbs.length} suburbs from Census data`
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request. Please provide G01 file and specify type (validate or process)'
    }, { status: 400 })

  } catch (error) {
    console.error('Error in data import endpoint:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to process data import',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Return information about data import capabilities
  return NextResponse.json({
    success: true,
    data: {
      supportedFiles: ['G01 - Selected Person Characteristics', 'G02 - Selected Medians and Averages'],
      formats: ['CSV'],
      maxFileSize: '50MB',
      instructions: [
        '1. Download Census DataPacks from ABS website',
        '2. Upload G01 and/or G02 CSV files',
        '3. Use type=validate to check file structure',
        '4. Use type=process to import data'
      ],
      downloadLinks: {
        abs2021: 'https://www.abs.gov.au/census/find-census-data/datapacks',
        g01Description: 'Selected Person Characteristics by Sex',
        g02Description: 'Selected Medians and Averages'
      }
    }
  })
}
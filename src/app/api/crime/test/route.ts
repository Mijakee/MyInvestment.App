import { NextRequest, NextResponse } from 'next/server'
import {
  downloadCrimeDataFile,
  parseExcelCrimeData,
  processCrimeData,
  validateCrimeData,
  type CrimeParserConfig
} from '@/lib/crime-parser'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'parse-sample'
    const skipDownload = searchParams.get('skipDownload') === 'true'

    switch (action) {
      case 'download-test':
        return await handleDownloadTest(skipDownload)

      case 'parse-sample':
        return await handleParseSample()

      case 'validate-parser':
        return await handleValidateParser()

      case 'full-pipeline':
        return await handleFullPipeline(skipDownload)

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: download-test, parse-sample, validate-parser, or full-pipeline'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in crime test endpoint:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to test crime data parser',
      message: error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * Test downloading WA Police Excel file (or simulate if skipDownload=true)
 */
async function handleDownloadTest(skipDownload: boolean) {
  try {
    if (skipDownload) {
      // Simulate successful download for testing
      return NextResponse.json({
        success: true,
        data: {
          message: 'Download test skipped (simulation mode)',
          fileSize: 'unknown',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Attempt real download (may fail if URL is incorrect)
    const config: CrimeParserConfig = {
      timeout: 15000,
      // Note: This URL is likely incorrect and will need to be updated
      // with the actual WA Police download URL
      downloadUrl: 'https://www.wa.gov.au/system/files/2024-08/crime-time-series-data.xlsx'
    }

    const fileData = await downloadCrimeDataFile(config)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Crime data file downloaded successfully',
        fileSize: fileData.byteLength,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
      data: {
        message: 'Download failed - this is expected until we have the correct WA Police URL',
        expectedError: true,
        timestamp: new Date().toISOString()
      }
    })
  }
}

/**
 * Test parsing with a sample Excel structure
 */
async function handleParseSample() {
  try {
    // Create a simple sample Excel file in memory for testing
    const sampleData = createSampleExcelData()

    const parseResult = await parseExcelCrimeData(sampleData, {
      expectedSheets: ['Sample Data'],
      minExpectedRecords: 1,
      validateColumns: true
    })

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse sample data',
        data: parseResult
      })
    }

    // Process the parsed data
    const processedData = processCrimeData(parseResult.data || [])
    const validation = validateCrimeData(processedData)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Sample Excel parsing successful',
        parseResult: {
          ...parseResult,
          data: parseResult.data?.slice(0, 5) // Show only first 5 records
        },
        processedCount: processedData.length,
        processedSample: processedData.slice(0, 3),
        validation,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sample parsing failed'
    })
  }
}

/**
 * Validate parser functions without external dependencies
 */
async function handleValidateParser() {
  try {
    const validationResults = {
      parserImported: true,
      functionsAvailable: {
        downloadCrimeDataFile: typeof downloadCrimeDataFile === 'function',
        parseExcelCrimeData: typeof parseExcelCrimeData === 'function',
        processCrimeData: typeof processCrimeData === 'function',
        validateCrimeData: typeof validateCrimeData === 'function'
      },
      dependencies: {
        xlsx: false // Will be tested below
      }
    }

    // Test XLSX import
    try {
      const XLSX = await import('xlsx')
      validationResults.dependencies.xlsx = !!(XLSX && XLSX.read && XLSX.utils)
    } catch (xlsxError) {
      console.warn('XLSX import failed:', xlsxError)
    }

    const allFunctionsAvailable = Object.values(validationResults.functionsAvailable).every(Boolean)
    const allDependenciesAvailable = Object.values(validationResults.dependencies).every(Boolean)

    return NextResponse.json({
      success: allFunctionsAvailable && allDependenciesAvailable,
      data: {
        message: 'Parser validation complete',
        validationResults,
        overallStatus: allFunctionsAvailable && allDependenciesAvailable ? 'ready' : 'issues-found',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    })
  }
}

/**
 * Test the full pipeline (download + parse + process + validate)
 */
async function handleFullPipeline(skipDownload: boolean) {
  try {
    let fileData: ArrayBuffer

    if (skipDownload) {
      // Use sample data for full pipeline testing
      fileData = createSampleExcelData()
    } else {
      // Attempt real download
      fileData = await downloadCrimeDataFile({
        timeout: 20000
      })
    }

    // Parse the file
    const parseResult = await parseExcelCrimeData(fileData)

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Parsing failed in full pipeline',
        data: parseResult
      })
    }

    // Process the data
    const processedData = processCrimeData(parseResult.data || [])

    // Validate the processed data
    const validation = validateCrimeData(processedData)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Full pipeline test complete',
        pipeline: {
          download: skipDownload ? 'skipped (sample data used)' : 'completed',
          parse: 'completed',
          process: 'completed',
          validate: 'completed'
        },
        results: {
          rawRecords: parseResult.data?.length || 0,
          processedRecords: processedData.length,
          qualityScore: validation.qualityScore,
          isValid: validation.isValid
        },
        sampleData: {
          rawSample: parseResult.data?.slice(0, 3),
          processedSample: processedData.slice(0, 2)
        },
        validation,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Full pipeline test failed'
    })
  }
}

/**
 * Create sample Excel data for testing (simulates WA Police format)
 */
function createSampleExcelData(): ArrayBuffer {
  try {
    // Import XLSX library
    const XLSX = require('xlsx')

    // Create sample data that mimics WA Police format
    const sampleRows = [
      // Header row
      ['Police District', 'Offence Type', 'Year', 'Quarter', 'Count', 'Rate per 100,000'],

      // Sample data rows
      ['Perth City District', 'Assault', 2023, 1, 156, 892.3],
      ['Perth City District', 'Burglary', 2023, 1, 78, 446.1],
      ['Perth City District', 'Drug Offences', 2023, 1, 34, 194.5],
      ['Fremantle District', 'Assault', 2023, 1, 89, 567.2],
      ['Fremantle District', 'Burglary', 2023, 1, 45, 286.7],
      ['Fremantle District', 'Theft', 2023, 1, 123, 783.8],
      ['Perth City District', 'Assault', 2023, 2, 142, 812.5],
      ['Perth City District', 'Burglary', 2023, 2, 65, 371.8],
      ['Perth City District', 'Drug Offences', 2023, 2, 41, 234.6],
      ['Fremantle District', 'Assault', 2023, 2, 93, 592.7],
      ['Fremantle District', 'Burglary', 2023, 2, 38, 242.1],
      ['Fremantle District', 'Theft', 2023, 2, 134, 853.9]
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sampleRows)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Crime Time Series')

    // Convert to ArrayBuffer with proper error handling
    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx'
    })

    // Ensure we return an ArrayBuffer
    if (excelBuffer instanceof ArrayBuffer) {
      return excelBuffer
    } else if (excelBuffer.buffer) {
      return excelBuffer.buffer as ArrayBuffer
    } else {
      // Convert Uint8Array to ArrayBuffer if needed
      const uint8Array = new Uint8Array(excelBuffer)
      return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength)
    }

  } catch (error) {
    console.error('Error creating sample Excel data:', error)
    throw new Error(`Failed to create sample Excel data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
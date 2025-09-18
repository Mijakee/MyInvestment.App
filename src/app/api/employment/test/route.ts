import { NextRequest, NextResponse } from 'next/server'
import { loadEmploymentData, getEmploymentClassification } from '../../../../lib/employment-classifier'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'sample'
    const salCode = searchParams.get('sal_code')

    switch (action) {
      case 'sample': {
        // Get a quick sample by processing first 10 rows manually
        const fs = await import('fs')
        const path = await import('path')

        const csvPath = path.join(process.cwd(), 'src/data/2021 Census GCP All Geographies for WA/SAL/WA/2021Census_G54A_WA_SAL.csv')
        const csvContent = fs.readFileSync(csvPath, 'utf-8')

        const lines = csvContent.split('\n').slice(0, 11) // Headers + 10 data rows
        const headers = lines[0].split(',')
        const dataRows = lines.slice(1).map(line => line.split(','))

        const { parseEmploymentData } = await import('../../../../lib/employment-classifier')

        const sample = dataRows
          .filter(row => row[0])
          .slice(0, 5) // Only first 5 for testing
          .map(row => parseEmploymentData(row[0], headers, row))
          .filter(Boolean)

        return NextResponse.json({
          success: true,
          data: {
            sample_data: sample,
            total_columns: headers.length,
            headers_sample: headers.slice(0, 10)
          }
        })
      }

      case 'suburb': {
        if (!salCode) {
          return NextResponse.json({
            success: false,
            error: 'SAL code required for suburb employment data'
          }, { status: 400 })
        }

        const employment = await getEmploymentClassification(salCode)

        if (!employment) {
          return NextResponse.json({
            success: false,
            error: 'Employment data not found for this suburb'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: employment
        })
      }

      case 'comparison': {
        // Compare old economic_base vs new employment classification
        const allEmployment = await loadEmploymentData()

        // Sample comparison for first 20 suburbs
        const comparison = allEmployment.slice(0, 20).map(emp => ({
          sal_code: emp.sal_code,
          new_classification: emp.classification,
          primary_industry: emp.primaryIndustry,
          secondary_industry: emp.secondaryIndustry,
          total_employed: emp.totalEmployed,
          top_industries: Object.entries(emp.industries)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([name, count]) => ({
              industry: name,
              count,
              percentage: emp.totalEmployed > 0 ? Math.round((count / emp.totalEmployed) * 100) : 0
            }))
        }))

        return NextResponse.json({
          success: true,
          data: {
            comparison,
            total_suburbs_analyzed: allEmployment.length
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: sample, suburb, comparison'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Employment test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process employment data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
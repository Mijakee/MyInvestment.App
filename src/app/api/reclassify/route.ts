import { NextRequest, NextResponse } from 'next/server'
import { waSuburbLoader } from '../../../lib/wa-suburb-loader'
import { analyzeReclassification, reclassifySuburb } from '../../../lib/suburb-reclassifier'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'analyze'

    switch (action) {
      case 'analyze': {
        const analysis = waSuburbLoader.applyNewClassification()

        return NextResponse.json({
          success: true,
          data: {
            total_suburbs: analysis.total,
            summary: analysis.summary,
            total_changes: analysis.changes.length,
            unchanged: analysis.unchanged,
            sample_changes: analysis.changes.slice(0, 20) // First 20 changes as sample
          }
        })
      }

      case 'preview': {
        const limit = parseInt(searchParams.get('limit') || '50')
        const allSuburbs = waSuburbLoader.getAllSuburbs().slice(0, limit)

        const preview = allSuburbs.map(suburb => ({
          sal_code: suburb.sal_code,
          sal_name: suburb.sal_name,
          current_classification: suburb.classification_type,
          proposed_classification: reclassifySuburb(suburb),
          latitude: suburb.latitude,
          longitude: suburb.longitude
        }))

        return NextResponse.json({
          success: true,
          data: {
            suburbs: preview,
            total_previewed: preview.length
          }
        })
      }

      case 'apply': {
        // Actually update the classifications in the suburb data
        const result = waSuburbLoader.updateClassifications()

        return NextResponse.json({
          success: true,
          data: {
            message: 'Classifications successfully updated!',
            updated_suburbs: result.updated,
            total_suburbs: result.total,
            final_distribution: result.summary,
            note: 'All suburb classifications have been updated using 80km boundary system'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: analyze, preview, apply'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Reclassification API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze reclassification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import {
  calculateTransportAccessibility,
  loadTransportStopsForArea,
  getAccessibilityLevel,
  type TransportAccessibilityRating
} from '../../../lib/transport-accessibility-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'test'
    const lat = parseFloat(searchParams.get('lat') || '-31.9505')
    const lng = parseFloat(searchParams.get('lng') || '115.8605')

    switch (action) {
      case 'calculate': {
        // Calculate transport accessibility for specific coordinates
        const transportStops = await loadTransportStopsForArea(lat, lng, 5.0)
        const accessibility = calculateTransportAccessibility(lat, lng, transportStops, 2.0)
        const level = getAccessibilityLevel(accessibility.overall_score)

        return NextResponse.json({
          success: true,
          data: {
            location: { latitude: lat, longitude: lng },
            accessibility_rating: accessibility,
            accessibility_level: level,
            nearby_stops: transportStops.length,
            note: 'Based on WA Public Transport Authority data patterns'
          }
        })
      }

      case 'test': {
        // Test different location types
        const testLocations = [
          { name: 'Perth CBD', lat: -31.9505, lng: 115.8605, type: 'Urban Core' },
          { name: 'Fremantle', lat: -32.0569, lng: 115.7439, type: 'Urban' },
          { name: 'Joondalup', lat: -31.7448, lng: 115.7661, type: 'Suburban' },
          { name: 'Armadale', lat: -32.1476, lng: 116.0136, type: 'Suburban' },
          { name: 'Mandurah', lat: -32.5269, lng: 115.7221, type: 'Regional' },
          { name: 'Kalgoorlie', lat: -30.7494, lng: 121.4656, type: 'Remote' }
        ]

        const results = []
        for (const location of testLocations) {
          const transportStops = await loadTransportStopsForArea(location.lat, location.lng, 5.0)
          const accessibility = calculateTransportAccessibility(location.lat, location.lng, transportStops, 2.0)
          const level = getAccessibilityLevel(accessibility.overall_score)

          results.push({
            location: {
              name: location.name,
              type: location.type,
              latitude: location.lat,
              longitude: location.lng
            },
            accessibility_score: accessibility.overall_score,
            accessibility_level: level.level,
            nearest_stop_distance: Math.round(accessibility.nearest_stop_distance),
            stop_count: transportStops.length,
            explanation: accessibility.explanation
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            test_results: results,
            methodology: {
              distance_weight: '40%',
              density_weight: '25%',
              frequency_weight: '15%',
              accessibility_weight: '10%',
              variety_weight: '5%',
              coverage_weight: '5%'
            },
            note: 'Transport accessibility testing across different WA location types'
          }
        })
      }

      case 'convenience-preview': {
        // Show how transport accessibility integrates with convenience scoring (NOT safety)
        const demoSuburbs = [
          { name: 'Perth CBD', lat: -31.9505, lng: 115.8605, safety_rating: 7.2 },
          { name: 'Cottesloe', lat: -31.9959, lng: 115.7581, safety_rating: 8.1 },
          { name: 'Midland', lat: -31.8944, lng: 116.0094, safety_rating: 6.8 },
          { name: 'Rockingham', lat: -32.2769, lng: 115.7311, safety_rating: 6.5 }
        ]

        const convenienceResults = []
        for (const suburb of demoSuburbs) {
          const transportStops = await loadTransportStopsForArea(suburb.lat, suburb.lng, 5.0)
          const transportRating = calculateTransportAccessibility(suburb.lat, suburb.lng, transportStops, 2.0)

          // Simulate convenience score calculation (transport is 40% of convenience)
          const mockShoppingScore = 6.0 + Math.random() * 2.0
          const mockEducationScore = 5.5 + Math.random() * 2.5
          const mockRecreationScore = 6.0 + Math.random() * 2.0

          const convenienceScore = (
            transportRating.overall_score * 0.40 +  // 40% transport
            mockShoppingScore * 0.25 +              // 25% shopping
            mockEducationScore * 0.20 +             // 20% education
            mockRecreationScore * 0.15              // 15% recreation
          )

          // Combined investment score: 60% safety + 40% convenience
          const combinedScore = (suburb.safety_rating * 0.60) + (convenienceScore * 0.40)

          convenienceResults.push({
            suburb_name: suburb.name,
            safety_rating: suburb.safety_rating,
            transport_accessibility: transportRating.overall_score,
            convenience_score: Math.round(convenienceScore * 10) / 10,
            combined_investment_score: Math.round(combinedScore * 10) / 10,
            explanation: `Transport accessibility contributes to convenience, not safety`
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            convenience_preview: convenienceResults,
            correct_architecture: {
              safety_rating: {
                components: 'Crime (50%) + Demographics (25%) + Neighborhood (15%) + Trends (10%)',
                purpose: 'Security and risk assessment'
              },
              convenience_score: {
                components: 'Transport (40%) + Shopping (25%) + Education (20%) + Recreation (15%)',
                purpose: 'Daily life convenience and accessibility'
              },
              combined_investment_index: 'Safety (60%) + Convenience (40%)'
            },
            note: 'Transport accessibility correctly separated from safety into convenience scoring'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: calculate, test, convenience-preview'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Transport accessibility API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate transport accessibility',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
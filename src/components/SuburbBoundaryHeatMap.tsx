'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface HeatMapPoint {
  lat: number
  lng: number
  intensity: number
  suburbName?: string
  sal_code?: string
  crimeScore?: number
  convenienceScore?: number
  investmentScore?: number
  // Legacy fields for backward compatibility
  safetyRating?: number
  combinedScore?: number
}

interface HeatMapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface HeatMapData {
  points: HeatMapPoint[]
  bounds: HeatMapBounds
  statistics: {
    totalSuburbs: number
    averageCrime: number
    averageConvenience: number
    averageInvestment: number
    // Legacy fields
    averageSafety?: number
    averageCombined?: number
  }
}

interface SuburbBoundaryHeatMapProps {
  metric?: 'crime' | 'convenience' | 'investment'
  className?: string
  onSuburbClick?: (suburbName: string) => void
}

export default function SuburbBoundaryHeatMap({
  metric = 'investment',
  className = '',
  onSuburbClick
}: SuburbBoundaryHeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData | null>(null)
  const [boundaries, setBoundaries] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [geoJsonLayer, setGeoJsonLayer] = useState<any>(null)

  // Load heat map data and boundaries
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load heat map data and suburb boundaries in parallel
      const [heatMapResponse, boundariesResponse] = await Promise.all([
        fetch(`/api/heatmap?action=optimized&metric=${metric}`),
        fetch('/api/data/geographic?file=wa_suburbs.geojson')
      ])

      const heatMapResult = await heatMapResponse.json()
      if (!heatMapResult.success) {
        throw new Error(heatMapResult.error || 'Failed to load heat map data')
      }

      const boundariesData = await boundariesResponse.json()

      setHeatMapData(heatMapResult.data)
      setBoundaries(boundariesData)
    } catch (err) {
      console.error('Data loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [metric])

  // Load data on component mount and metric change
  useEffect(() => {
    loadData()
  }, [loadData])

  const initializeMap = useCallback(async () => {
    try {
      // Dynamic import of Leaflet to avoid SSR issues
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix default icons issue with Leaflet and webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Initialize map centered on WA
      const mapContainer = document.getElementById('suburb-boundary-heatmap-container')
      if (!mapContainer || !heatMapData || !boundaries) return

      // Clear any existing map
      mapContainer.innerHTML = ''

      const map = L.map(mapContainer).setView([-31.9505, 115.8605], 8) // Perth center
      setMapInstance(map)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Create a mapping from suburb names to heat map data
      const suburbDataMap = new Map<string, HeatMapPoint>()
      heatMapData.points.forEach(point => {
        if (point.suburbName) {
          suburbDataMap.set(point.suburbName.toLowerCase(), point)
        }
      })

      // Add suburb polygons with heat map styling
      const layer = L.geoJSON(boundaries, {
        style: (feature) => {
          const suburbName = feature?.properties?.SAL_NAME21
          const suburbData = suburbName ? suburbDataMap.get(suburbName.toLowerCase()) : null

          if (suburbData) {
            // Use actual scores instead of intensity for color coding
            const score = metric === 'crime' ? (suburbData.crimeScore || suburbData.safetyRating || 5) :
                         metric === 'convenience' ? (suburbData.convenienceScore || 5) :
                         (suburbData.investmentScore || suburbData.combinedScore || 5)

            return {
              fillColor: getScoreColor(score, metric),
              weight: 1,
              opacity: 0.8,
              color: '#ffffff',
              fillOpacity: Math.max(0.5, Math.min(0.9, score / 10))
            }
          } else {
            // Suburbs without data - show in gray
            return {
              fillColor: '#cccccc',
              weight: 1,
              opacity: 0.3,
              color: '#999999',
              fillOpacity: 0.2
            }
          }
        },
        onEachFeature: (feature, layer) => {
          const suburbName = feature?.properties?.SAL_NAME21
          const suburbData = suburbName ? suburbDataMap.get(suburbName.toLowerCase()) : null

          if (suburbName) {
            // Create popup content
            let popupContent = `
              <div class="text-center">
                <strong class="text-lg">${suburbName}</strong><br/>
            `

            if (suburbData) {
              const score = metric === 'crime' ? (suburbData.crimeScore || suburbData.safetyRating || 0) :
                           metric === 'convenience' ? (suburbData.convenienceScore || 0) :
                           (suburbData.investmentScore || suburbData.combinedScore || 0)

              popupContent += `
                <span class="text-sm text-gray-600">${getMetricLabel(metric)}: ${score.toFixed(1)}/10</span><br/>
                <button
                  onclick="window.suburbClick('${suburbName}')"
                  class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  View Details
                </button>
              `
            } else {
              popupContent += `
                <span class="text-sm text-gray-500">Data not available</span>
              `
            }

            popupContent += `</div>`

            layer.bindPopup(popupContent)

            // Remove the automatic modal opening on click - only show popup

            // Add hover effects
            layer.on({
              mouseover: (e) => {
                const layer = e.target
                layer.setStyle({
                  weight: 3,
                  color: '#000000',
                  fillOpacity: Math.min(1.0, (layer.options.fillOpacity || 0.5) + 0.3)
                })
                layer.bringToFront()
              },
              mouseout: (e) => {
                const layer = e.target
                const suburbData = suburbName ? suburbDataMap.get(suburbName.toLowerCase()) : null
                const score = suburbData ? (metric === 'crime' ? (suburbData.crimeScore || suburbData.safetyRating || 5) :
                             metric === 'convenience' ? (suburbData.convenienceScore || 5) :
                             (suburbData.investmentScore || suburbData.combinedScore || 5)) : 5
                layer.setStyle({
                  weight: 1,
                  color: '#ffffff',
                  fillOpacity: suburbData ? Math.max(0.5, Math.min(0.9, score / 10)) : 0.2
                })
              }
            })
          }
        }
      }).addTo(map)

      setGeoJsonLayer(layer)

      // Set up global click handler for "View Details" button in popups
      ;(window as any).suburbClick = (suburbName: string) => {
        if (onSuburbClick) {
          onSuburbClick(suburbName)
        }
      }

      // Fit map to WA bounds
      if (heatMapData.bounds) {
        map.fitBounds([
          [heatMapData.bounds.south, heatMapData.bounds.west],
          [heatMapData.bounds.north, heatMapData.bounds.east]
        ])
      }

      setMapReady(true)
    } catch (err) {
      console.error('Map initialization error:', err)
      setError('Failed to initialize map visualization')
    }
  }, [heatMapData, boundaries, metric, onSuburbClick])

  const updateMapLayers = useCallback(() => {
    if (!mapInstance || !geoJsonLayer || !heatMapData) return

    try {
      // Create a mapping from suburb names to heat map data
      const suburbDataMap = new Map<string, HeatMapPoint>()
      heatMapData.points.forEach(point => {
        if (point.suburbName) {
          suburbDataMap.set(point.suburbName.toLowerCase(), point)
        }
      })

      // Update the styling of each layer
      geoJsonLayer.eachLayer((layer: any) => {
        const feature = layer.feature
        const suburbName = feature?.properties?.SAL_NAME21
        const suburbData = suburbName ? suburbDataMap.get(suburbName.toLowerCase()) : null

        if (suburbData) {
          // Use actual scores instead of intensity for color coding
          const score = metric === 'crime' ? (suburbData.crimeScore || suburbData.safetyRating || 5) :
                       metric === 'convenience' ? (suburbData.convenienceScore || 5) :
                       (suburbData.investmentScore || suburbData.combinedScore || 5)

          layer.setStyle({
            fillColor: getScoreColor(score, metric),
            weight: 1,
            opacity: 0.8,
            color: '#ffffff',
            fillOpacity: Math.max(0.5, Math.min(0.9, score / 10))
          })

          // Update popup content
          const score_display = metric === 'crime' ? (suburbData.crimeScore || suburbData.safetyRating || 0) :
                               metric === 'convenience' ? (suburbData.convenienceScore || 0) :
                               (suburbData.investmentScore || suburbData.combinedScore || 0)

          const popupContent = `
            <div class="text-center">
              <strong class="text-lg">${suburbName}</strong><br/>
              <span class="text-sm text-gray-600">${getMetricLabel(metric)}: ${score_display.toFixed(1)}/10</span><br/>
              <button
                onclick="window.suburbClick('${suburbName}')"
                class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          `
          layer.bindPopup(popupContent)
        }
      })
    } catch (err) {
      console.error('Error updating map layers:', err)
    }
  }, [mapInstance, geoJsonLayer, heatMapData, metric])

  // Initialize map when data is ready for the first time
  useEffect(() => {
    if (heatMapData && boundaries && !mapReady) {
      initializeMap()
    }
  }, [heatMapData, boundaries, mapReady])

  // Update map layers when metric changes
  useEffect(() => {
    if (mapInstance && geoJsonLayer && heatMapData) {
      updateMapLayers()
    }
  }, [metric]) // Remove updateMapLayers from deps to avoid circular reference

  const getScoreColor = (score: number, metric: string): string => {
    // Create smooth color gradients based on actual scores (1-10 scale)
    const colors = getColorGradient(metric)

    if (metric === 'crime') {
      // Crime: Higher scores = worse crime = darker colors
      if (score >= 8) return colors.veryHigh  // Worst crime (8-10) - Dark red
      if (score >= 6) return colors.high      // High crime (6-8)
      if (score >= 4) return colors.medium    // Medium crime (4-6)
      if (score >= 2) return colors.low       // Low crime (2-4)
      return colors.veryLow                   // Very low crime (1-2) - Light red
    } else {
      // Convenience & Investment: Higher scores = better = darker colors
      if (score >= 8) return colors.veryHigh  // Best (8-10) - Dark
      if (score >= 6) return colors.high      // Good (6-8)
      if (score >= 4) return colors.medium    // Average (4-6)
      if (score >= 2) return colors.low       // Poor (2-4)
      return colors.veryLow                   // Worst (1-2) - Light
    }
  }

  const getColorGradient = (metric: string) => {
    switch (metric) {
      case 'crime':
        // RED GRADIENT FOR CRIME (Light = Low Crime, Dark = High Crime)
        return {
          veryLow: '#fed7d7',   // Light red (low crime - scores 1-2)
          low: '#fca5a5',       // Light-medium red (scores 3-4)
          medium: '#f87171',    // Medium red (scores 5-6)
          high: '#dc2626',      // Dark red (scores 7-8)
          veryHigh: '#991b1b'   // Very dark red (high crime - scores 9-10)
        }

      case 'convenience':
        // GREEN GRADIENT FOR CONVENIENCE (Light = Low Convenience, Dark = High Convenience)
        return {
          veryLow: '#f0fdf4',   // Very light green (low convenience - scores 1-2)
          low: '#dcfce7',       // Light green (scores 3-4)
          medium: '#86efac',    // Medium green (scores 5-6)
          high: '#22c55e',      // Dark green (scores 7-8)
          veryHigh: '#15803d'   // Very dark green (high convenience - scores 9-10)
        }

      default: // investment score
        // PURPLE GRADIENT FOR INVESTMENT (Light = Poor Investment, Dark = Good Investment)
        return {
          veryLow: '#faf5ff',   // Very light purple (poor investment - scores 1-2)
          low: '#e9d5ff',       // Light purple (scores 3-4)
          medium: '#a855f7',    // Medium purple (scores 5-6)
          high: '#7c3aed',      // Dark purple (scores 7-8)
          veryHigh: '#581c87'   // Very dark purple (excellent investment - scores 9-10)
        }
    }
  }

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'crime': return 'Crime Score'
      case 'convenience': return 'Convenience Score'
      case 'investment': return 'Investment Index'
      default: return 'Investment Index'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suburb boundaries...</p>
          <p className="text-sm text-gray-500">Processing 1,701 WA suburbs</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-800 font-semibold">Heat Map Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        id="suburb-boundary-heatmap-container"
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />


    </div>
  )
}
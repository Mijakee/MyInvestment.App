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

interface SimpleHeatMapVisualizationProps {
  metric?: 'crime' | 'convenience' | 'investment'
  className?: string
  onSuburbClick?: (suburbName: string) => void
}

export default function SimpleHeatMapVisualization({
  metric = 'investment',
  className = '',
  onSuburbClick
}: SimpleHeatMapVisualizationProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)

  // Load heat map data from API
  const loadHeatMapData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/heatmap?action=optimized&metric=${metric}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load heat map data')
      }

      setHeatMapData(result.data)
    } catch (err) {
      console.error('Heat map loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load heat map')
    } finally {
      setLoading(false)
    }
  }, [metric])

  // Clean up map container completely
  const cleanupMapContainer = useCallback(() => {
    const mapContainer = document.getElementById('simple-heatmap-container')
    if (mapContainer) {
      mapContainer.innerHTML = ''
      mapContainer.removeAttribute('data-leaflet-id')
      mapContainer.className = mapContainer.className.replace(/leaflet-\S+/g, '').trim()
      if (!mapContainer.className) {
        mapContainer.className = 'w-full h-[70vh] rounded-lg border border-gray-300'
      }
      if ((mapContainer as any)._leaflet_id) {
        delete (mapContainer as any)._leaflet_id
      }
    }
  }, [])

  // Initialize Leaflet map
  const initializeMap = useCallback(async () => {
    if (!heatMapData) return

    try {
      const L = (await import('leaflet')).default

      // Fix Leaflet icons for webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const mapContainer = document.getElementById('simple-heatmap-container')
      if (!mapContainer) return

      // Clean up any existing map
      if (mapInstance) {
        try {
          mapInstance.remove()
          setMapInstance(null)
        } catch (err) {
          console.warn('Error removing existing map:', err)
        }
      }

      cleanupMapContainer()

      // Create new map
      const map = L.map(mapContainer).setView([-31.9505, 115.8605], 8)
      setMapInstance(map)

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Add suburb markers
      heatMapData.points.forEach(point => {
        const circleMarker = L.circleMarker([point.lat, point.lng], {
          radius: Math.max(4, point.intensity * 20),
          fillColor: getIntensityColor(point.intensity, metric),
          color: '#fff',
          weight: 1,
          opacity: 0.9,
          fillOpacity: Math.max(0.3, point.intensity * 0.8)
        })

        // Add popup
        if (point.suburbName) {
          const actualRating = metric === 'crime' ? (point as any).crimeScore :
                              metric === 'convenience' ? (point as any).convenienceScore :
                              (point as any).investmentScore
          const displayValue = actualRating ? actualRating.toFixed(1) : (point.intensity * 10).toFixed(1)

          circleMarker.bindPopup(`
            <div class="text-center">
              <strong class="text-lg">${point.suburbName}</strong><br/>
              <span class="text-sm text-gray-600">${getMetricLabel(metric)}: ${displayValue}/10</span><br/>
              <button
                onclick="window.parent.postMessage({type: 'suburbClick', suburb: '${point.suburbName}'}, '*')"
                class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          `)

          circleMarker.on('click', () => {
            if (onSuburbClick && point.suburbName) {
              onSuburbClick(point.suburbName)
            }
          })
        }

        circleMarker.addTo(map)
      })

      // Fit map to bounds
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
  }, [heatMapData, mapInstance, metric, onSuburbClick, cleanupMapContainer])

  // Color mapping logic using intensity values (now correctly calculated in service)
  const getIntensityColor = (intensity: number, metric: string): string => {
    const colors = getColorGradient(metric)

    // Intensity is now properly calculated:
    // - Safety: Lower scores = lower intensity (0 = safest, 1 = most dangerous)
    // - Convenience/Investment: Higher scores = higher intensity (0 = worst, 1 = best)

    if (intensity <= 0.2) return colors.veryLow     // 0-0.2
    if (intensity <= 0.4) return colors.low         // 0.2-0.4
    if (intensity <= 0.6) return colors.medium      // 0.4-0.6
    if (intensity <= 0.8) return colors.high        // 0.6-0.8
    return colors.veryHigh                          // 0.8-1.0
  }

  // ============================================
  // COLOR CONFIGURATION - MODIFY COLORS HERE
  // ============================================
  const getColorGradient = (metric: string) => {
    switch (metric) {
      case 'crime':
        // RED GRADIENT FOR CRIME (Light = Low Crime, Dark = High Crime)
        return {
          veryLow: '#fed7d7',   // More visible light red (safest - scores 1-2)
          low: '#fca5a5',       // More visible light red (good - scores 3-4)
          medium: '#f87171',    // Medium red (average - scores 5-6)
          high: '#dc2626',      // Dark red (poor - scores 7-8)
          veryHigh: '#991b1b'   // Very dark red (most dangerous - scores 9-10)
        }

      case 'convenience':
        // GREEN GRADIENT FOR CONVENIENCE (Light = Low, Dark = High)
        return {
          veryLow: '#f0fdf4',   // Very light green (low convenience - scores 1-2)
          low: '#dcfce7',       // Light green (scores 3-4)
          medium: '#86efac',    // Medium green (scores 5-6)
          high: '#22c55e',      // Dark green (scores 7-8)
          veryHigh: '#15803d'   // Very dark green (high convenience - scores 9-10)
        }

      default: // combined investment score
        // PURPLE GRADIENT FOR INVESTMENT (Light = Low, Dark = High)
        return {
          veryLow: '#faf5ff',   // Very light purple (low investment - scores 1-2)
          low: '#e9d5ff',       // Light purple (scores 3-4)
          medium: '#a855f7',    // Medium purple (scores 5-6)
          high: '#7c3aed',      // Dark purple (scores 7-8)
          veryHigh: '#581c87'   // Very dark purple (high investment - scores 9-10)
        }
    }
  }

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'crime': return 'Crime Score'
      case 'convenience': return 'Convenience Score'
      case 'investment': return 'Investment Score'
      default: return 'Investment Score'
    }
  }

  // Effect hooks
  useEffect(() => {
    loadHeatMapData()
  }, [loadHeatMapData])

  useEffect(() => {
    if (heatMapData && !mapReady) {
      initializeMap()
    }
  }, [heatMapData, mapReady, initializeMap])

  useEffect(() => {
    if (mapInstance && mapReady) {
      try {
        mapInstance.remove()
        setMapInstance(null)
        setMapReady(false)
        cleanupMapContainer()
      } catch (err) {
        console.warn('Error removing previous map:', err)
      }
    }
  }, [metric, mapInstance, mapReady, cleanupMapContainer])

  useEffect(() => {
    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove()
        } catch (err) {
          console.warn('Error removing map instance:', err)
        }
      }
    }
  }, [mapInstance])

  // Render states
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading heat map data...</p>
          <p className="text-sm text-gray-500">Processing 1,699 WA suburbs</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-[70vh] bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-800 font-semibold">Heat Map Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadHeatMapData}
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
        id="simple-heatmap-container"
        className="w-full h-[70vh] rounded-lg border border-gray-300"
        style={{ minHeight: '500px' }}
      />

      {/* Legend */}
      {heatMapData && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <h4 className="font-semibold text-sm mb-2">{getMetricLabel(metric)} Heat Map</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: getColorGradient(metric).veryHigh
              }}></div>
              <span>Best (9-10)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: getColorGradient(metric).high
              }}></div>
              <span>Good (7-8)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: getColorGradient(metric).medium
              }}></div>
              <span>Average (5-6)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: getColorGradient(metric).low
              }}></div>
              <span>Poor (3-4)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: getColorGradient(metric).veryLow
              }}></div>
              <span>Worst (1-2)</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-gray-600">
            {heatMapData.statistics.totalSuburbs} suburbs
          </div>
        </div>
      )}

    </div>
  )
}
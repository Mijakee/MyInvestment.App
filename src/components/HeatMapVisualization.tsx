'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface HeatMapPoint {
  lat: number
  lng: number
  intensity: number
  suburbName?: string
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
    averageSafety: number
    averageConvenience: number
    averageCombined: number
  }
}

interface HeatMapVisualizationProps {
  metric?: 'safety' | 'convenience' | 'combined'
  className?: string
  onSuburbClick?: (suburbName: string) => void
}

export default function HeatMapVisualization({
  metric = 'combined',
  className = '',
  onSuburbClick
}: HeatMapVisualizationProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Load heat map data
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

  // Load data on component mount and metric change
  useEffect(() => {
    loadHeatMapData()
  }, [loadHeatMapData])

  // Initialize map when data is ready
  useEffect(() => {
    if (heatMapData && !mapReady) {
      initializeMap()
    }
  }, [heatMapData, mapReady])

  // Fallback function to add circle markers when heat layer fails
  const addCircleMarkersAsFallback = (map: any, points: HeatMapPoint[], metric: string, L: any) => {
    points.forEach(point => {
      const circleMarker = L.circleMarker([point.lat, point.lng], {
        radius: Math.max(3, point.intensity * 15), // Scale size by intensity
        fillColor: getIntensityColor(point.intensity, metric),
        color: '#000',
        weight: 1,
        opacity: 0.8,
        fillOpacity: point.intensity * 0.7 // Vary opacity by intensity
      })

      if (point.suburbName) {
        circleMarker.bindPopup(`
          <strong>${point.suburbName}</strong><br/>
          ${getMetricLabel(metric)}: ${(point.intensity * 10).toFixed(1)}/10
        `)
      }

      circleMarker.addTo(map)
    })
  }

  const initializeMap = async () => {
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
      const mapContainer = document.getElementById('heatmap-container')
      if (!mapContainer || !heatMapData) return

      const map = L.map(mapContainer).setView([-31.9505, 115.8605], 8) // Perth center

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Prepare heat map points
      const heatPoints = heatMapData.points.map(point => [
        point.lat,
        point.lng,
        point.intensity
      ])

      // Import leaflet.heat with proper handling
      let heat: any = null
      try {
        // Import the heat module
        const heatModule = await import('leaflet.heat')

        // leaflet.heat adds heatLayer to L object, try multiple access patterns
        heat = (L as any).heatLayer ||
               heatModule.default ||
               (heatModule as any).heatLayer ||
               (window as any).L?.heatLayer

        console.log('Heat import attempt:', { heatModule, heat, L: (L as any).heatLayer })
      } catch (error) {
        console.warn('Failed to import leaflet.heat:', error)
      }

      if (!heat) {
        console.warn('Heat layer not available, falling back to circle markers')
        // Fallback to circle markers if heat layer fails
        addCircleMarkersAsFallback(map, heatMapData.points, metric, L)
      } else {
        // Add heat layer with correct syntax
        const heatLayer = heat(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: getHeatMapGradient(metric)
        }).addTo(map)
      }

      // Add suburb markers for interaction
      heatMapData.points.forEach(point => {
        if (point.suburbName) {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 3,
            fillColor: getIntensityColor(point.intensity, metric),
            color: '#000',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6
          })

          marker.bindPopup(`
            <strong>${point.suburbName}</strong><br/>
            ${getMetricLabel(metric)}: ${(point.intensity * 10).toFixed(1)}/10
          `)

          marker.on('click', () => {
            if (onSuburbClick && point.suburbName) {
              onSuburbClick(point.suburbName)
            }
          })

          marker.addTo(map)
        }
      })

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
  }

  const getHeatMapGradient = (metric: string) => {
    switch (metric) {
      case 'safety':
        return {
          0.0: '#d73027', // Red (unsafe)
          0.3: '#fc8d59',
          0.5: '#fee08b',
          0.7: '#d9ef8b',
          1.0: '#4575b4'  // Blue (safe)
        }
      case 'convenience':
        return {
          0.0: '#762a83', // Purple (inconvenient)
          0.3: '#c2a5cf',
          0.5: '#f7f7f7',
          0.7: '#a6dba0',
          1.0: '#1b7837'  // Green (convenient)
        }
      default: // combined
        return {
          0.0: '#d73027', // Red (poor investment)
          0.2: '#f46d43',
          0.4: '#fdae61',
          0.6: '#fee08b',
          0.8: '#d9ef8b',
          1.0: '#4575b4'  // Blue (excellent investment)
        }
    }
  }

  const getIntensityColor = (intensity: number, metric: string): string => {
    const gradient = getHeatMapGradient(metric)
    const gradientKeys = Object.keys(gradient).map(Number).sort((a, b) => a - b)

    for (let i = 0; i < gradientKeys.length - 1; i++) {
      if (intensity >= gradientKeys[i] && intensity <= gradientKeys[i + 1]) {
        return gradient[gradientKeys[i + 1] as keyof typeof gradient]
      }
    }

    return gradient[1 as keyof typeof gradient]
  }

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'safety': return 'Safety Rating'
      case 'convenience': return 'Convenience Score'
      default: return 'Investment Score'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading heat map data...</p>
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
        id="heatmap-container"
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />

      {/* Legend */}
      {heatMapData && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <h4 className="font-semibold text-sm mb-2">{getMetricLabel(metric)} Heat Map</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: Object.values(getHeatMapGradient(metric))[0]
              }}></div>
              <span>Low</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: Object.values(getHeatMapGradient(metric))[2]
              }}></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{
                backgroundColor: Object.values(getHeatMapGradient(metric))[4]
              }}></div>
              <span>High</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-gray-600">
            {heatMapData.statistics.totalSuburbs} suburbs
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg border">
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = `/api/heatmap?action=export&metric=${metric}`}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Data
          </button>
          <button
            onClick={loadHeatMapData}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
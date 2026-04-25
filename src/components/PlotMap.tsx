import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import proj4 from 'proj4'

type Plot = {
  plot_id: string
  owner_name: string
  owner_email: string
  willing_to_donate: boolean
  willing_dropoff: boolean
  max_travel_km: number | null
  max_travel_min: number | null
}

type AllotmentFeature = {
  type: 'Feature'
  properties: {
    id?: string | number
    name?: string | null
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: any
  }
}

type GeoJsonData = {
  type: 'FeatureCollection'
  features: AllotmentFeature[]
}

type PlotPointFeature = {
  type: 'Feature'
  properties: {
    allotment_id?: string | number
    plot_id?: string
    [key: string]: any
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

type PlotPointsGeoJsonData = {
  type: 'FeatureCollection'
  features: PlotPointFeature[]
}

type Props = {
  plots: Plot[]
  allotmentOpportunityCount: Map<string, number>
  selectedAllotmentId: string | null
  onSelectAllotment: (allotmentId: string | null) => void
  userCoords?: { lat: number; lng: number } | null
  radiusKm?: number
}

const POLYGON_MIN_ZOOM = 13

const EPSG27700 =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
  '+x_0=400000 +y_0=-100000 +ellps=airy ' +
  '+towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 ' +
  '+units=m +no_defs'

const WGS84 = 'EPSG:4326'

const makeBubbleIcon = (count: number, variant: 'allotment' | 'selected' | 'cluster') => {
  const size = variant === 'cluster' ? 48 : 36
  return L.divIcon({
    html: `<div class="map-bubble map-bubble--${variant}">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function PlotMap({
  plots,
  allotmentOpportunityCount,
  selectedAllotmentId,
  onSelectAllotment,
  userCoords,
  radiusKm = 5,
}: Props) {
  const dataBaseUrl = `${import.meta.env.BASE_URL}data/`
  const [isMapLoading, setIsMapLoading] = useState(true)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const plotPointLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const allVisibleBoundsRef = useRef<L.LatLngBounds | null>(null)
  const allotmentsGeoDataRef = useRef<GeoJsonData | null>(null)
  const plotPointsDataRef = useRef<PlotPointsGeoJsonData | null>(null)
  const hasInitializedViewRef = useRef(false)
  const pendingFitBoundsRef = useRef<L.LatLngBounds | null>(null)
  const locationLayerGroupRef = useRef<L.LayerGroup | null>(null)

  // After selectedAllotmentId changes, the grid layout re-renders (panel opens/closes).
  // Wait a tick for the map container to resize, then invalidate + fit.
  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return

    const id = setTimeout(() => {
      map.invalidateSize()
      if (pendingFitBoundsRef.current) {
        map.fitBounds(pendingFitBoundsRef.current)
        pendingFitBoundsRef.current = null
      }
    }, 50)

    return () => clearTimeout(id)
  }, [selectedAllotmentId])

  // Location pin + radius circle
  useEffect(() => {
    const map = leafletMapRef.current
    const layer = locationLayerGroupRef.current
    if (!map || !layer) return

    layer.clearLayers()

    if (!userCoords) return

    L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 8,
      color: '#1f4d45',
      weight: 3,
      fillColor: 'white',
      fillOpacity: 1,
    }).addTo(layer)

    L.circle([userCoords.lat, userCoords.lng], {
      radius: radiusKm * 1000,
      color: '#1f4d45',
      weight: 2,
      dashArray: '6 5',
      fillColor: '#1f4d45',
      fillOpacity: 0.05,
    }).addTo(layer)
  }, [userCoords, radiusKm])

  const handleResetView = () => {
    const map = leafletMapRef.current
    const bounds = allVisibleBoundsRef.current
    if (map && bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  // Init: create map + cluster group once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    leafletMapRef.current = map
    polygonLayerGroupRef.current = L.layerGroup().addTo(map)
    plotPointLayerGroupRef.current = L.layerGroup().addTo(map)
    locationLayerGroupRef.current = L.layerGroup().addTo(map)

    const clusterGroup = (L as any).markerClusterGroup({
      iconCreateFunction: (cluster: any) => {
        const total = cluster
          .getAllChildMarkers()
          .reduce((sum: number, m: any) => sum + (m._plotCount || 0), 0)
        return makeBubbleIcon(total, 'cluster')
      },
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: false,
      maxClusterRadius: 40,
    }) as L.MarkerClusterGroup

    clusterGroupRef.current = clusterGroup
    map.addLayer(clusterGroup)

    return () => {
      map.remove()
      leafletMapRef.current = null
      polygonLayerGroupRef.current = null
      clusterGroupRef.current = null
      plotPointLayerGroupRef.current = null
      locationLayerGroupRef.current = null
      setIsMapLoading(true)
    }
  }, [])

  // Main: populate layers when plots/selection change
  useEffect(() => {
    if (
      !leafletMapRef.current ||
      !polygonLayerGroupRef.current ||
      !clusterGroupRef.current ||
      !plotPointLayerGroupRef.current
    ) {
      return
    }

    const map = leafletMapRef.current
    const polygonLayerGroup = polygonLayerGroupRef.current
    const clusterGroup = clusterGroupRef.current
    const plotPointLayerGroup = plotPointLayerGroupRef.current
    const controller = new AbortController()
    let isCancelled = false

    setIsMapLoading(true)

    // Clear layer contents but keep the groups on the map
    polygonLayerGroup.clearLayers()
    clusterGroup.clearLayers()
    plotPointLayerGroup.clearLayers()

    // Ensure cluster group is on the map (may have been removed by a prior cleanup)
    if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup)

    const syncPolygonVisibility = () => {
      if (map.getZoom() >= POLYGON_MIN_ZOOM) {
        if (!map.hasLayer(polygonLayerGroup)) map.addLayer(polygonLayerGroup)
      } else {
        if (map.hasLayer(polygonLayerGroup)) map.removeLayer(polygonLayerGroup)
      }
    }

    const handleMapBackgroundClick = () => {
      onSelectAllotment(null)
    }

    map.on('zoomend', syncPolygonVisibility)
    map.on('click', handleMapBackgroundClick)

    const allotmentPlotMap = new Map<string, Plot[]>()
    plots.forEach((plot) => {
      const allotmentId = plot.plot_id.split('_')[0]
      const existing = allotmentPlotMap.get(allotmentId) || []
      existing.push(plot)
      allotmentPlotMap.set(allotmentId, existing)
    })

    const renderSelectedAllotmentPlotPoints = () => {
      if (!selectedAllotmentId) return

      const selectedPlots = allotmentPlotMap.get(selectedAllotmentId) || []
      if (selectedPlots.length === 0) return

      const selectedPlotIds = new Set(selectedPlots.map((p) => p.plot_id))
      const pointData = plotPointsDataRef.current
      if (!pointData) return

      pointData.features.forEach((feature) => {
        const featureAllotmentId =
          feature.properties?.allotment_id !== undefined
            ? String(feature.properties.allotment_id)
            : undefined
        const plotId = feature.properties?.plot_id

        if (!featureAllotmentId || featureAllotmentId !== selectedAllotmentId) return
        if (!plotId || !selectedPlotIds.has(plotId)) return

        const [east, north] = feature.geometry.coordinates
        const [lng, lat] = proj4(EPSG27700, WGS84, [east, north])

        const plotPointMarker = L.circleMarker([lat, lng], {
          radius: 3,
          color: '#111827',
          weight: 1,
          fillColor: '#f97316',
          fillOpacity: 0.95,
        })

        plotPointMarker.on('click', (event) => {
          L.DomEvent.stopPropagation(event)
        })

        plotPointMarker.bindPopup(`<strong>Plot ID:</strong> ${plotId}`)
        plotPointMarker.addTo(plotPointLayerGroup)
      })
    }

    const ensurePlotPointsData = async () => {
      if (plotPointsDataRef.current) return plotPointsDataRef.current

      const response = await fetch(`${dataBaseUrl}plots_points.geojson`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch plot points geojson: ${response.status}`)
      }

      const data = (await response.json()) as PlotPointsGeoJsonData
      plotPointsDataRef.current = data
      return data
    }

    const ensureAllotmentsGeoData = async () => {
      if (allotmentsGeoDataRef.current) return allotmentsGeoDataRef.current

      const response = await fetch(`${dataBaseUrl}allotments_polygons.geojson`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch allotment polygons: ${response.status}`)
      }

      const data = (await response.json()) as GeoJsonData
      allotmentsGeoDataRef.current = data
      return data
    }

    ensureAllotmentsGeoData()
      .then((geoData) => {
        if (
          isCancelled ||
          leafletMapRef.current !== map ||
          polygonLayerGroupRef.current !== polygonLayerGroup ||
          clusterGroupRef.current !== clusterGroup ||
          plotPointLayerGroupRef.current !== plotPointLayerGroup
        ) {
          return
        }

        let bounds: L.LatLngBounds | null = null
        const allotmentBoundsById = new Map<string, L.LatLngBounds>()

        geoData.features.forEach((feature) => {
          const allotmentIdRaw = feature.properties?.id
          const allotmentId =
            allotmentIdRaw !== undefined ? String(allotmentIdRaw) : undefined

          if (!allotmentId) return

          const matchedPlots = allotmentPlotMap.get(allotmentId)
          if (!matchedPlots || matchedPlots.length === 0) return

          const isSelected =
            selectedAllotmentId !== null && selectedAllotmentId === allotmentId

          // Polygon layer (shown at zoom >= POLYGON_MIN_ZOOM)
          const layer = L.geoJSON(feature as any, {
            style: {
              color: isSelected ? '#1f4d45' : '#4f46e5',
              weight: isSelected ? 3 : 2,
              fillColor: isSelected ? '#a7f3d0' : '#c7d2fe',
              fillOpacity: isSelected ? 0.5 : 0.28,
            },
            onEachFeature: (_geoFeature, leafletLayer) => {
              leafletLayer.on('click', (event) => {
                L.DomEvent.stopPropagation(event)

                const nextAllotmentId =
                  selectedAllotmentId === allotmentId ? null : allotmentId
                onSelectAllotment(nextAllotmentId)

                if (nextAllotmentId && 'getBounds' in leafletLayer) {
                  const clickedBounds = (leafletLayer as L.FeatureGroup).getBounds()
                  if (clickedBounds.isValid()) {
                    map.fitBounds(clickedBounds, { padding: [24, 24], maxZoom: 16 })
                  }
                }
              })
            },
          })

          layer.addTo(polygonLayerGroup)

          const featureBounds = layer.getBounds()
          if (!featureBounds.isValid()) return

          allotmentBoundsById.set(allotmentId, featureBounds)
          bounds = bounds ? bounds.extend(featureBounds) : featureBounds

          // Cluster bubble marker (always visible, clusters at low zoom)
          const center = featureBounds.getCenter()
          const oppCount = allotmentOpportunityCount.get(allotmentId) ?? matchedPlots.length
          const bubbleMarker = L.marker(center, {
            icon: makeBubbleIcon(oppCount, isSelected ? 'selected' : 'allotment'),
          })
          ;(bubbleMarker as any)._plotCount = oppCount

          bubbleMarker.on('click', (event) => {
            L.DomEvent.stopPropagation(event)

            const clickedBounds = allotmentBoundsById.get(allotmentId)
            if (clickedBounds && clickedBounds.isValid()) {
              pendingFitBoundsRef.current = clickedBounds.pad(0.1)
            }

            onSelectAllotment(allotmentId)
          })

          clusterGroup.addLayer(bubbleMarker)
        })

        allVisibleBoundsRef.current = bounds
        syncPolygonVisibility()

        if (bounds && !isCancelled && !hasInitializedViewRef.current) {
          map.fitBounds(bounds, { padding: [24, 24] })
          hasInitializedViewRef.current = true
        }

        if (!isCancelled) {
          setIsMapLoading(false)
        }

        ensurePlotPointsData()
          .then(() => {
            if (
              isCancelled ||
              leafletMapRef.current !== map ||
              plotPointLayerGroupRef.current !== plotPointLayerGroup
            ) {
              return
            }
            renderSelectedAllotmentPlotPoints()
          })
          .catch((err) => {
            if (err instanceof DOMException && err.name === 'AbortError') return
            console.error('Failed to load plot points geojson:', err)
          })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Failed to load allotment polygons geojson:', err)
        setIsMapLoading(false)
      })

    return () => {
      isCancelled = true
      controller.abort()
      map.off('zoomend', syncPolygonVisibility)
      map.off('click', handleMapBackgroundClick)

      // Only clear layer contents — don't remove groups from the map.
      // The cluster group must stay on the map so the next run can populate it.
      polygonLayerGroup.clearLayers()
      clusterGroup.clearLayers()
      plotPointLayerGroup.clearLayers()
      if (map.hasLayer(polygonLayerGroup)) map.removeLayer(polygonLayerGroup)
    }
  }, [plots, selectedAllotmentId, onSelectAllotment, dataBaseUrl])

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {isMapLoading && (
        <div className="map-loading-overlay" aria-live="polite" aria-busy="true">
          <div className="map-loading-card">
            <div className="map-loading-title">Preparing map…</div>
            <div className="map-loading-track" role="progressbar" aria-valuetext="Preparing map">
              <div className="map-loading-indicator" />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleResetView}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Reset view
      </button>

      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import proj4 from 'proj4'
import 'leaflet/dist/leaflet.css'

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
  selectedAllotmentId: string | null
  onSelectAllotment: (allotmentId: string | null) => void
}

const POLYGON_MIN_ZOOM = 13

const EPSG27700 =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
  '+x_0=400000 +y_0=-100000 +ellps=airy ' +
  '+towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 ' +
  '+units=m +no_defs'

const WGS84 = 'EPSG:4326'

export default function PlotMap({
  plots,
  selectedAllotmentId,
  onSelectAllotment,
}: Props) {
  const dataBaseUrl = `${import.meta.env.BASE_URL}data/`

  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const pointLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const plotPointLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const allVisibleBoundsRef = useRef<L.LatLngBounds | null>(null)
  const plotPointsDataRef = useRef<PlotPointsGeoJsonData | null>(null)
  const hasInitializedViewRef = useRef(false)

  const handleResetView = () => {
    const map = leafletMapRef.current
    const bounds = allVisibleBoundsRef.current

    if (map && bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    leafletMapRef.current = map
    polygonLayerGroupRef.current = L.layerGroup().addTo(map)
    pointLayerGroupRef.current = L.layerGroup().addTo(map)
    plotPointLayerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      leafletMapRef.current = null
      polygonLayerGroupRef.current = null
      pointLayerGroupRef.current = null
      plotPointLayerGroupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      !leafletMapRef.current ||
      !polygonLayerGroupRef.current ||
      !pointLayerGroupRef.current ||
      !plotPointLayerGroupRef.current
    ) {
      return
    }

    const map = leafletMapRef.current
    const polygonLayerGroup = polygonLayerGroupRef.current
    const pointLayerGroup = pointLayerGroupRef.current
    const plotPointLayerGroup = plotPointLayerGroupRef.current
    const controller = new AbortController()
    let isCancelled = false

    polygonLayerGroup.clearLayers()
    pointLayerGroup.clearLayers()
    plotPointLayerGroup.clearLayers()

    const syncRepresentationWithZoom = () => {
      const showPolygons = map.getZoom() >= POLYGON_MIN_ZOOM

      if (showPolygons) {
        if (!map.hasLayer(polygonLayerGroup)) {
          map.addLayer(polygonLayerGroup)
        }

        if (map.hasLayer(pointLayerGroup)) {
          map.removeLayer(pointLayerGroup)
        }

        return
      }

      if (!map.hasLayer(pointLayerGroup)) {
        map.addLayer(pointLayerGroup)
      }

      if (map.hasLayer(polygonLayerGroup)) {
        map.removeLayer(polygonLayerGroup)
      }
    }

    const handleMapBackgroundClick = () => {
      onSelectAllotment(null)

      const bounds = allVisibleBoundsRef.current
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }

    map.on('zoomend', syncRepresentationWithZoom)
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

      const selectedPlotIds = new Set(selectedPlots.map((plot) => plot.plot_id))
      const pointData = plotPointsDataRef.current
      if (!pointData) return

      pointData.features.forEach((feature) => {
        const featureAllotmentIdRaw = feature.properties?.allotment_id
        const featureAllotmentId =
          featureAllotmentIdRaw !== undefined
            ? String(featureAllotmentIdRaw)
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
      if (plotPointsDataRef.current) {
        return plotPointsDataRef.current
      }

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

    fetch(`${dataBaseUrl}allotments_polygons.geojson`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch allotment polygons: ${res.status}`)
        }

        return res.json()
      })
      .then((geoData: GeoJsonData) => {
        if (
          isCancelled ||
          leafletMapRef.current !== map ||
          polygonLayerGroupRef.current !== polygonLayerGroup ||
          pointLayerGroupRef.current !== pointLayerGroup ||
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

                if (!nextAllotmentId) {
                  return
                }

                if ('getBounds' in leafletLayer) {
                  const clickedBounds = (leafletLayer as L.FeatureGroup).getBounds()
                  if (clickedBounds.isValid()) {
                    map.fitBounds(clickedBounds, {
                      padding: [24, 24],
                      maxZoom: 16,
                    })
                  }
                }
              })

              // leafletLayer.bindPopup(
              //   `<strong>${feature.properties?.name || 'Allotment'}</strong><br/>Allotment ID: ${allotmentId}<br/>Visible plots: ${matchedPlots.length}`
              // )
            },
          })

          layer.addTo(polygonLayerGroup)

          const featureBounds = layer.getBounds()
          if (!featureBounds.isValid()) return

          allotmentBoundsById.set(allotmentId, featureBounds)
          bounds = bounds ? bounds.extend(featureBounds) : featureBounds

          const center = featureBounds.getCenter()
          const pointMarker = L.circleMarker(center, {
            radius: isSelected ? 8 : 6,
            color: isSelected ? '#1f4d45' : '#4f46e5',
            weight: isSelected ? 2.5 : 2,
            fillColor: isSelected ? '#a7f3d0' : '#c7d2fe',
            fillOpacity: isSelected ? 0.9 : 0.75,
          })

          pointMarker.on('click', (event) => {
            L.DomEvent.stopPropagation(event)

            const nextAllotmentId =
              selectedAllotmentId === allotmentId ? null : allotmentId

            onSelectAllotment(nextAllotmentId)

            if (!nextAllotmentId) {
              return
            }

            const clickedBounds = allotmentBoundsById.get(allotmentId)
            if (clickedBounds && clickedBounds.isValid()) {
              map.fitBounds(clickedBounds, {
                padding: [24, 24],
                maxZoom: 16,
              })
            }
          })

          // pointMarker.bindPopup(
          //   `<strong>${feature.properties?.name || 'Allotment'}</strong><br/>Allotment ID: ${allotmentId}<br/>Visible plots: ${matchedPlots.length}`
          // )

          pointMarker.addTo(pointLayerGroup)
        })

        allVisibleBoundsRef.current = bounds
        syncRepresentationWithZoom()

        if (bounds && !isCancelled && !hasInitializedViewRef.current) {
          map.fitBounds(bounds, { padding: [20, 20] })
          hasInitializedViewRef.current = true
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
            if (err instanceof DOMException && err.name === 'AbortError') {
              return
            }

            console.error('Failed to load plot points geojson:', err)
          })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }

        console.error('Failed to load allotment polygons geojson:', err)
      })

    return () => {
      isCancelled = true
      controller.abort()
      map.off('zoomend', syncRepresentationWithZoom)
      map.off('click', handleMapBackgroundClick)

      if (map.hasLayer(polygonLayerGroup)) {
        map.removeLayer(polygonLayerGroup)
      }

      if (map.hasLayer(pointLayerGroup)) {
        map.removeLayer(pointLayerGroup)
      }

      if (map.hasLayer(plotPointLayerGroup)) {
        map.removeLayer(plotPointLayerGroup)
      }
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

      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    </div>
  )
}
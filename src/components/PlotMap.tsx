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

type GeoJsonFeature = {
  type: string
  properties: {
    allotment_id?: string | number
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: [number, number]
  }
}

type GeoJsonData = {
  type: string
  features: GeoJsonFeature[]
}

type Props = {
  plots: Plot[]
  selectedPlotId: string | null
  onSelectPlot: (plot: Plot) => void
}

// British National Grid -> WGS84
const EPSG27700 =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
  '+x_0=400000 +y_0=-100000 +ellps=airy ' +
  '+towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 ' +
  '+units=m +no_defs'

const WGS84 = 'EPSG:4326'

export default function PlotMap({ plots, selectedPlotId, onSelectPlot }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const pointLookupRef = useRef<Map<string, L.LatLng>>(new Map())

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    leafletMapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      leafletMapRef.current = null
      layerGroupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!leafletMapRef.current || !layerGroupRef.current) return

    const map = leafletMapRef.current
    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()
    pointLookupRef.current.clear()

    // Group visible plots by allotment id
    const allotmentPlotMap = new Map<string, Plot[]>()

    plots.forEach((plot) => {
      const allotmentId = plot.plot_id.split('_')[0]
      const existing = allotmentPlotMap.get(allotmentId) || []
      existing.push(plot)
      allotmentPlotMap.set(allotmentId, existing)
    })

    fetch('/data/plots_points.geojson')
      .then((res) => res.json())
      .then((geoData: GeoJsonData) => {
        const bounds: L.LatLngExpression[] = []
        const renderedAllotments = new Set<string>()

        geoData.features.forEach((feature) => {
          const allotmentIdRaw = feature.properties?.allotment_id
          const allotmentId =
            allotmentIdRaw !== undefined ? String(allotmentIdRaw) : undefined

          if (!allotmentId) return
          if (renderedAllotments.has(allotmentId)) return

          const matchedPlots = allotmentPlotMap.get(allotmentId)
          if (!matchedPlots || matchedPlots.length === 0) return

          const matchedPlot = matchedPlots[0]

          const [east, north] = feature.geometry.coordinates
          const [lng, lat] = proj4(EPSG27700, WGS84, [east, north])

          const latLng = L.latLng(lat, lng)
          pointLookupRef.current.set(allotmentId, latLng)
          renderedAllotments.add(allotmentId)

          const isSelected =
            selectedPlotId !== null &&
            selectedPlotId.startsWith(`${allotmentId}_`)

          const marker = L.circleMarker(latLng, {
            radius: isSelected ? 10 : 7,
            fillColor: isSelected ? '#d62828' : '#ff7f11',
            color: '#000000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          })

          marker.on('click', () => {
            onSelectPlot(matchedPlot)
          })

          marker.bindPopup(
            `<strong>${matchedPlot.owner_name}</strong><br/>Plot ID: ${matchedPlot.plot_id}<br/>Allotment ID: ${allotmentId}<br/>Plots in allotment: ${matchedPlots.length}`
          )

          marker.addTo(layerGroup)
          bounds.push([lat, lng])
        })

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      })
      .catch((err) => {
        console.error('Failed to load plot points geojson:', err)
      })
  }, [plots, selectedPlotId, onSelectPlot])

  useEffect(() => {
    if (!leafletMapRef.current || !selectedPlotId) return

    const allotmentId = selectedPlotId.split('_')[0]
    const latLng = pointLookupRef.current.get(allotmentId)

    if (latLng) {
      leafletMapRef.current.flyTo(latLng, 13, {
        duration: 0.8,
      })
    }
  }, [selectedPlotId])

  return (
    <div
      ref={mapRef}
      style={{
        height: '420px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  )
}
import { useEffect, useRef } from 'react'
import L from 'leaflet'
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
    plot_id?: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: any
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

export default function PlotMap({ plots, selectedPlotId, onSelectPlot }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    leafletMapRef.current = map

    return () => {
      map.remove()
      leafletMapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!leafletMapRef.current) return

    const map = leafletMapRef.current
    const plotMap = new Map(plots.map((plot) => [plot.plot_id, plot]))

    fetch('/data/plots_points.geojson')
      .then((res) => res.json())
      .then((geoData: GeoJsonData) => {
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.remove()
        }

        const geoJsonLayer = L.geoJSON(geoData as any, {
          pointToLayer: (feature, latlng) => {
            const plotId = feature?.properties?.plot_id
            const isSelected = plotId === selectedPlotId

            return L.circleMarker(latlng, {
              radius: isSelected ? 8 : 6,
              fillColor: isSelected ? '#1f4d45' : '#2f855a',
              color: '#ffffff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.9,
            })
          },
          onEachFeature: (feature, layer) => {
            const plotId = feature?.properties?.plot_id
            const matchedPlot = plotId ? plotMap.get(plotId) : undefined

            if (matchedPlot) {
              layer.on('click', () => {
                onSelectPlot(matchedPlot)
              })

              layer.bindPopup(
                `<strong>${matchedPlot.owner_name}</strong><br/>Plot ID: ${matchedPlot.plot_id}`
              )
            }
          },
        })

        geoJsonLayer.addTo(map)
        geoJsonLayerRef.current = geoJsonLayer
      })
      .catch((err) => {
        console.error('Failed to load plot points geojson:', err)
      })
  }, [plots, selectedPlotId, onSelectPlot])

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
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type FoodbankFeature = {
  id: string
  properties?: {
    name?: string
    slug?: string
    address?: string
    url?: string
    network?: string
    email?: string | null
    telephone?: string | null
    foodbank?: string
    foodbank_slug?: string
    foodbank_url?: string
    parliamentary_constituency?: string
  }
  geometry?: {
    type?: 'Point'
    coordinates?: [number, number]
  }
}

type Props = {
  foodbanks: FoodbankFeature[]
  selectedFoodbankId: string | null
  onSelectFoodbank: (foodbankId: string | null) => void
  userCoords?: { lat: number; lng: number } | null
  radiusKm?: number
}

const makeIcon = (selected: boolean) =>
  L.divIcon({
    html: `<div class="foodbank-pin${selected ? ' foodbank-pin--selected' : ''}">🍽️</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export default function FoodbankMap({
  foodbanks,
  selectedFoodbankId,
  onSelectFoodbank,
  userCoords,
  radiusKm = 5,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.MarkerClusterGroup | null>(null)
  const locationLayerRef = useRef<L.LayerGroup | null>(null)
  const hasSetInitialBoundsRef = useRef(false)
  const allBoundsRef = useRef<L.LatLngBounds | null>(null)

  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return

    const id = setTimeout(() => {
      map.invalidateSize()
    }, 50)

    return () => clearTimeout(id)
  }, [selectedFoodbankId])

  useEffect(() => {
    const map = leafletMapRef.current
    const layer = locationLayerRef.current
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
    const bounds = allBoundsRef.current
    if (map && bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    leafletMapRef.current = map
    markerLayerRef.current = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: false,
      maxClusterRadius: 42,
      iconCreateFunction: (cluster: any) =>
        L.divIcon({
          html: `<div class="foodbank-cluster">${cluster.getChildCount()}</div>`,
          className: '',
          iconSize: [44, 44],
        }),
    }) as L.MarkerClusterGroup

    locationLayerRef.current = L.layerGroup().addTo(map)
    map.addLayer(markerLayerRef.current)

    return () => {
      map.remove()
      leafletMapRef.current = null
      markerLayerRef.current = null
      locationLayerRef.current = null
      hasSetInitialBoundsRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = leafletMapRef.current
    const markerLayer = markerLayerRef.current
    if (!map || !markerLayer) return

    markerLayer.clearLayers()

    const bounds = new L.LatLngBounds([])

    foodbanks.forEach((foodbank) => {
      const coords = foodbank.geometry?.coordinates
      if (!coords || coords.length < 2) return

      const [lng, lat] = coords
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

      const isSelected = foodbank.id === selectedFoodbankId
      const marker = L.marker([lat, lng], { icon: makeIcon(isSelected) })

      const name = escapeHtml(foodbank.properties?.name ?? 'Foodbank')
      const address = escapeHtml((foodbank.properties?.address ?? '').trim()).replaceAll('\n', '<br />')
      const network = foodbank.properties?.network ? `<div><strong>Network:</strong> ${escapeHtml(foodbank.properties.network)}</div>` : ''
      const phone = foodbank.properties?.telephone ? `<div><strong>Phone:</strong> ${escapeHtml(foodbank.properties.telephone)}</div>` : ''
      const email = foodbank.properties?.email ? `<div><strong>Email:</strong> ${escapeHtml(foodbank.properties.email)}</div>` : ''

      marker.bindPopup(`
        <div style="min-width: 180px; line-height: 1.45;">
          <div style="font-weight: 700; margin-bottom: 4px;">${name}</div>
          ${network}
          ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
          ${phone}
          ${email}
        </div>
      `)

      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event)
        onSelectFoodbank(foodbank.id)
      })

      marker.addTo(markerLayer)
      bounds.extend([lat, lng])
    })

    allBoundsRef.current = bounds.isValid() ? bounds : null

    const handleBackgroundClick = () => {
      onSelectFoodbank(null)
    }

    map.on('click', handleBackgroundClick)

    if (bounds.isValid() && !hasSetInitialBoundsRef.current) {
      map.fitBounds(bounds, { padding: [24, 24] })
      hasSetInitialBoundsRef.current = true
    }

    return () => {
      map.off('click', handleBackgroundClick)
    }
  }, [foodbanks, onSelectFoodbank, selectedFoodbankId])

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
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
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
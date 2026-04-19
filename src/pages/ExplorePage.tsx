import { useEffect, useState } from 'react'
import ModeSwitcher from '../components/ModeSwitcher'
import FilterPanel from '../components/FilterPanel'
import DetailPanel from '../components/DetailPanel'
import PlotList from '../components/PlotList'

type Plot = {
  plot_id: string
  owner_name: string
  owner_email: string
  willing_to_donate: boolean
  willing_dropoff: boolean
  max_travel_km: number | null
  max_travel_min: number | null
}

type CropRecord = {
  plot_id: string
  crops: any[]
}

export default function ExplorePage() {
  const [mode, setMode] = useState('food')
  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [loading, setLoading] = useState(true)
  const [cropsData, setCropsData] = useState<CropRecord[]>([])

  useEffect(() => {
    fetch('/data/plots_core.json')
      .then((res) => res.json())
      .then((data) => {
        setPlots(data)
        setSelectedPlot(data.length > 0 ? data[0] : null)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load plot data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetch('/data/plots_crops.json')
      .then((res) => res.json())
      .then((data) => {
        console.log('CROPS DATA SAMPLE:', data[0])
        setCropsData(data)
      })
      .catch((err) => {
        console.error('Failed to load crops data:', err)
      })
  }, [])

  const selectedCrops =
    selectedPlot
      ? cropsData.find((item) => item.plot_id === selectedPlot.plot_id) || null
      : null

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>Explore</h1>
      <p>This is the main platform page for browsing plots and opportunities.</p>

      <ModeSwitcher mode={mode} setMode={setMode} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        <FilterPanel mode={mode} />

        <div
          style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            minHeight: '420px',
          }}
        >
          <h3>Map Area</h3>
          <p>The interactive map will go here.</p>
          <p><strong>Current mode:</strong> {mode}</p>
          <p><strong>Crops records loaded:</strong> {cropsData.length}</p>

          {loading ? (
            <p>Loading plot data...</p>
          ) : (
            <PlotList plots={plots} onSelectPlot={setSelectedPlot} />
          )}
        </div>

        <DetailPanel
          mode={mode}
          selectedPlot={selectedPlot}
          selectedCrops={selectedCrops}
        />
      </div>
    </div>
  )
}
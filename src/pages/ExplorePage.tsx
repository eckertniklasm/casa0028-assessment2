import { useEffect, useMemo, useRef, useState } from 'react'
import ModeSwitcher from '../components/ModeSwitcher'
import FilterPanel from '../components/FilterPanel'
import DetailPanel from '../components/DetailPanel'
import PlotList from '../components/PlotList'
import PlotMap from '../components/PlotMap'

type Plot = {
  plot_id: string
  owner_name: string
  owner_email: string
  willing_to_donate: boolean
  willing_dropoff: boolean
  max_travel_km: number | null
  max_travel_min: number | null
}

type Crop = {
  crop: string
  seasons: string
}

type CropRecord = {
  plot_id: string
  crops: Crop[]
}

type AwayPeriod = {
  start_date: string
  end_date: string
  help_description: string
  skills_needed: string
}

type AwayRecord = {
  plot_id: string
  away_periods: AwayPeriod[]
}

type CollaborationSlot = {
  day_of_week: string
  start_time: string
  end_time: string
  description: string
}

type CollaborationRecord = {
  plot_id: string
  collaboration_slots: CollaborationSlot[]
}

type Workshop = {
  workshop_date: string
  start_time: string
  end_time: string
  description: string
  max_attendees: number
}

type WorkshopRecord = {
  plot_id: string
  workshops: Workshop[]
}

type AllotmentFeature = {
  properties?: {
    id?: string | number
    name?: string | null
  }
}

type AllotmentsGeoJson = {
  features?: AllotmentFeature[]
}

export default function ExplorePage() {
  const dataBaseUrl = `${import.meta.env.BASE_URL}data/`
  const mapSectionRef = useRef<HTMLDivElement | null>(null)

  const [mode, setMode] = useState('food')
  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedAllotmentId, setSelectedAllotmentId] = useState<string | null>(
    null
  )
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [loading, setLoading] = useState(true)

  const [cropsData, setCropsData] = useState<CropRecord[]>([])
  const [awayData, setAwayData] = useState<AwayRecord[]>([])
  const [collaborationData, setCollaborationData] = useState<CollaborationRecord[]>([])
  const [workshopsData, setWorkshopsData] = useState<WorkshopRecord[]>([])
  const [allotmentNameById, setAllotmentNameById] = useState<Record<string, string>>({})

  const [selectedCrop, setSelectedCrop] = useState('All')
  const [selectedDonationType, setSelectedDonationType] = useState('All')
  const [selectedVolunteerType, setSelectedVolunteerType] = useState('All')

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_core.json`)
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
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_crops.json`)
      .then((res) => res.json())
      .then((data) => {
        setCropsData(data)
      })
      .catch((err) => {
        console.error('Failed to load crops data:', err)
      })
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_away.json`)
      .then((res) => res.json())
      .then((data) => {
        setAwayData(data)
      })
      .catch((err) => {
        console.error('Failed to load away data:', err)
      })
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_collaboration.json`)
      .then((res) => res.json())
      .then((data) => {
        setCollaborationData(data)
      })
      .catch((err) => {
        console.error('Failed to load collaboration data:', err)
      })
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_workshops.json`)
      .then((res) => res.json())
      .then((data) => {
        setWorkshopsData(data)
      })
      .catch((err) => {
        console.error('Failed to load workshops data:', err)
      })
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}allotments_polygons.geojson`)
      .then((res) => res.json())
      .then((data: AllotmentsGeoJson) => {
        const nextMap: Record<string, string> = {}

        ;(data.features || []).forEach((feature) => {
          const idRaw = feature.properties?.id
          const nameRaw = feature.properties?.name

          if (idRaw === undefined || !nameRaw) return

          nextMap[String(idRaw)] = nameRaw
        })

        setAllotmentNameById(nextMap)
      })
      .catch((err) => {
        console.error('Failed to load allotment names:', err)
      })
  }, [dataBaseUrl])

  const cropOptions = useMemo(() => {
    const allCrops = cropsData.flatMap((item) =>
      item.crops.map((crop) => crop.crop)
    )
    return Array.from(new Set(allCrops)).sort()
  }, [cropsData])

  const filteredPlots = useMemo(() => {
    let result = plots

    if (mode === 'food') {
      result = result.filter((plot) => plot.willing_to_donate === true)

      if (selectedCrop !== 'All') {
        const matchingPlotIds = new Set(
          cropsData
            .filter((item) =>
              item.crops.some(
                (crop) => crop.crop.toLowerCase() === selectedCrop.toLowerCase()
              )
            )
            .map((item) => item.plot_id)
        )

        result = result.filter((plot) => matchingPlotIds.has(plot.plot_id))
      }

      if (selectedDonationType === 'dropoff') {
        result = result.filter((plot) => plot.willing_dropoff === true)
      }

      if (selectedDonationType === 'collection') {
        result = result.filter((plot) => plot.willing_dropoff === false)
      }
    }

    if (mode === 'volunteer') {
      if (selectedVolunteerType === 'away') {
        const awayPlotIds = new Set(awayData.map((item) => item.plot_id))
        result = result.filter((plot) => awayPlotIds.has(plot.plot_id))
      }

      if (selectedVolunteerType === 'collaboration') {
        const collaborationPlotIds = new Set(
          collaborationData.map((item) => item.plot_id)
        )
        result = result.filter((plot) => collaborationPlotIds.has(plot.plot_id))
      }

      if (selectedVolunteerType === 'workshop') {
        const workshopPlotIds = new Set(
          workshopsData.map((item) => item.plot_id)
        )
        result = result.filter((plot) => workshopPlotIds.has(plot.plot_id))
      }
    }

    return result
  }, [
    mode,
    selectedCrop,
    selectedDonationType,
    selectedVolunteerType,
    cropsData,
    awayData,
    collaborationData,
    workshopsData,
    plots,
  ])

  const selectedAllotmentPlots = useMemo(() => {
    if (!selectedAllotmentId) {
      return []
    }

    return filteredPlots.filter((plot) =>
      plot.plot_id.startsWith(`${selectedAllotmentId}_`)
    )
  }, [filteredPlots, selectedAllotmentId])

  const visibleAllotmentCount = useMemo(() => {
    const allotmentIds = new Set(
      filteredPlots.map((plot) => plot.plot_id.split('_')[0])
    )
    return allotmentIds.size
  }, [filteredPlots])

  const selectedCrops = selectedPlot
    ? cropsData.find((item) => item.plot_id === selectedPlot.plot_id) || null
    : null

  const selectedAway = selectedPlot
    ? awayData.find((item) => item.plot_id === selectedPlot.plot_id) || null
    : null

  const selectedCollaboration = selectedPlot
    ? collaborationData.find((item) => item.plot_id === selectedPlot.plot_id) || null
    : null

  const selectedWorkshops = selectedPlot
    ? workshopsData.find((item) => item.plot_id === selectedPlot.plot_id) || null
    : null

  useEffect(() => {
    if (!selectedAllotmentId) {
      setSelectedPlot(null)
      return
    }

    const nextPlot = selectedAllotmentPlots[0] || null
    if (
      !nextPlot ||
      !selectedPlot ||
      !selectedPlot.plot_id.startsWith(`${selectedAllotmentId}_`)
    ) {
      setSelectedPlot(nextPlot)
    }
  }, [selectedAllotmentId, selectedAllotmentPlots, selectedPlot])

  const handleSelectPlot = (plot: Plot) => {
    const allotmentId = plot.plot_id.split('_')[0]
    setSelectedAllotmentId(allotmentId)
    setSelectedPlot(plot)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleSelectAllotment = (allotmentId: string | null) => {
    if (!allotmentId) {
      setSelectedAllotmentId(null)
      setSelectedPlot(null)
      return
    }

    setSelectedAllotmentId(allotmentId)

    const nextPlot = filteredPlots.find((plot) =>
      plot.plot_id.startsWith(`${allotmentId}_`)
    )
    setSelectedPlot(nextPlot || null)
  }

  const browseTitle =
    mode === 'food'
      ? 'Browse food availability across London'
      : mode === 'volunteer'
      ? 'Browse volunteering opportunities across London'
      : 'Browse allotment activity across London'

  const browseDescription =
    mode === 'food'
      ? 'Use the filters to explore plots offering produce and view crop information for each location.'
      : mode === 'volunteer'
      ? 'Use the filters to explore away-help requests, collaboration slots, and workshops.'
      : 'Use the filters to explore plot activity and available actions.'

  const summaryItems =
    mode === 'food'
      ? [
          `Crop: ${selectedCrop}`,
          `Donation: ${selectedDonationType}`,
          `Visible plots: ${filteredPlots.length}`,
          `Visible allotments on map: ${visibleAllotmentCount}`,
        ]
      : mode === 'volunteer'
      ? [
          `Opportunity: ${selectedVolunteerType}`,
          `Visible plots: ${filteredPlots.length}`,
          `Visible allotments on map: ${visibleAllotmentCount}`,
        ]
      : [
          `Visible plots: ${filteredPlots.length}`,
          `Visible allotments on map: ${visibleAllotmentCount}`,
        ]

  const selectedAllotmentDisplayName = selectedAllotmentId
    ? allotmentNameById[selectedAllotmentId] || selectedAllotmentId
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
        <FilterPanel
          mode={mode}
          cropOptions={cropOptions}
          selectedCrop={selectedCrop}
          onCropChange={setSelectedCrop}
          selectedDonationType={selectedDonationType}
          onDonationTypeChange={setSelectedDonationType}
          selectedVolunteerType={selectedVolunteerType}
          onVolunteerTypeChange={setSelectedVolunteerType}
        />

        <div
          style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            minHeight: '420px',
          }}
        >
          <h3>{browseTitle}</h3>
          <p style={{ marginTop: '8px', color: '#444' }}>{browseDescription}</p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '16px',
              marginBottom: '16px',
            }}
          >
            {summaryItems.map((item) => (
              <span
                key={item}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #ddd',
                  borderRadius: '999px',
                  padding: '6px 10px',
                  fontSize: '14px',
                }}
              >
                {item}
              </span>
            ))}
          </div>

          {!loading && (
            <div ref={mapSectionRef} style={{ marginTop: '16px' }}>
              <PlotMap
                plots={filteredPlots}
                selectedAllotmentId={selectedAllotmentId}
                onSelectAllotment={handleSelectAllotment}
              />
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            {loading ? (
              <p>Loading plot data...</p>
            ) : selectedAllotmentId && selectedAllotmentPlots.length === 0 ? (
              <div
                style={{
                  border: '1px dashed #bbb',
                  borderRadius: '10px',
                  padding: '16px',
                  background: '#fafafa',
                }}
              >
                <p style={{ margin: 0 }}>
                  No plots in this allotment match the current filters.
                </p>
              </div>
            ) : (
              <PlotList
                plots={selectedAllotmentPlots}
                selectedPlotId={selectedPlot ? selectedPlot.plot_id : null}
                onSelectPlot={handleSelectPlot}
                title={
                  selectedAllotmentId
                    ? `Plots in allotment ${selectedAllotmentDisplayName}`
                    : 'Plots in selected allotment'
                }
                emptyMessage="Click an allotment polygon to view its plots."
              />
            )}
          </div>
        </div>

        <DetailPanel
          mode={mode}
          selectedAllotmentId={selectedAllotmentId}
          selectedPlot={selectedPlot}
          selectedCrops={selectedCrops}
          selectedAway={selectedAway}
          selectedCollaboration={selectedCollaboration}
          selectedWorkshops={selectedWorkshops}
        />
      </div>
    </div>
  )
}
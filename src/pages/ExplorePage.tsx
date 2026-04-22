import { useEffect, useMemo, useRef, useState } from 'react'
import FilterPanel from '../components/FilterPanel'
import DetailPanel from '../components/DetailPanel'
import PlotList from '../components/PlotList'
import PlotMap from '../components/PlotMap'

// ── Types ────────────────────────────────────────────────────────────────────

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
  crops: { crop: string; seasons: string }[]
}

type AwayFilterRecord = {
  plot_id: string
  experience_level: number
  commitment_level: number
  away_periods: { start_date: string; end_date: string }[]
}

type AwayDetailsRecord = {
  plot_id: string
  help_description: string
}

type CollabFilterRecord = {
  plot_id: string
  experience_level: number
  collaboration_slots: {
    day_of_week: string
    start_time: string
    end_time: string
    valid_from: string
    valid_to: string
  }[]
}

type CollabDetailsRecord = {
  plot_id: string
  collaboration_slots: { description: string }[]
}

type WorkshopFilterRecord = {
  plot_id: string
  experience_level: number
  kids_allowed: boolean
  workshops: {
    workshop_date: string
    start_time: string
    end_time: string
    max_attendees: number
  }[]
}

type WorkshopDetailsRecord = {
  plot_id: string
  workshops: { workshop_date: string; description: string }[]
}

type AllotmentFeature = {
  properties?: { id?: string | number; name?: string | null }
}

type AllotmentsGeoJson = { features?: AllotmentFeature[] }

type ParticipateFilters = {
  opportunityType: string
  startDate: string
  endDate: string
  day: string
  time: string
  experience: string
  commitment: string
  kidsAllowed: string
}

const DEFAULT_PARTICIPATE_FILTERS: ParticipateFilters = {
  opportunityType: 'Any',
  startDate: '',
  endDate: '',
  day: 'Any',
  time: 'Any',
  experience: 'Any',
  commitment: 'Any',
  kidsAllowed: 'Any',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const TIME_RANGES: Record<string, [number, number]> = {
  Morning:   [360,  660],
  Midday:    [660,  840],
  Afternoon: [840,  1020],
  Evening:   [1020, 1260],
}

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
}

function overlapsTime(start: string, end: string, filterTime: string) {
  if (filterTime === 'Any') return true
  const [fs, fe] = TIME_RANGES[filterTime]
  return toMin(start) < fe && toMin(end) > fs
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { mode: 'participate' | 'donate' | 'receive' }

export default function ExplorePage({ mode }: Props) {
  const dataBaseUrl = `${import.meta.env.BASE_URL}data/`
  const mapSectionRef = useRef<HTMLDivElement | null>(null)

  // ── Core data ──────────────────────────────────────────────────────────────
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [cropsData, setCropsData] = useState<CropRecord[]>([])
  const [allotmentNameById, setAllotmentNameById] = useState<Record<string, string>>({})

  // ── Participate filter data ────────────────────────────────────────────────
  const [awayFilterData, setAwayFilterData] = useState<AwayFilterRecord[]>([])
  const [awayDetailsData, setAwayDetailsData] = useState<AwayDetailsRecord[]>([])
  const [collabFilterData, setCollabFilterData] = useState<CollabFilterRecord[]>([])
  const [collabDetailsData, setCollabDetailsData] = useState<CollabDetailsRecord[]>([])
  const [workshopFilterData, setWorkshopFilterData] = useState<WorkshopFilterRecord[]>([])
  const [workshopDetailsData, setWorkshopDetailsData] = useState<WorkshopDetailsRecord[]>([])

  // ── Selection state ────────────────────────────────────────────────────────
  const [selectedAllotmentId, setSelectedAllotmentId] = useState<string | null>(null)
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)

  // ── Food filter state ──────────────────────────────────────────────────────
  const [selectedCrop, setSelectedCrop] = useState('All')
  const [selectedDonationType, setSelectedDonationType] = useState('All')

  // ── Participate filter state ───────────────────────────────────────────────
  const [participateFilters, setParticipateFilters] = useState<ParticipateFilters>(
    DEFAULT_PARTICIPATE_FILTERS
  )

  const handleParticipateFilterChange = (key: string, value: string) => {
    setParticipateFilters((prev) => ({ ...prev, [key]: value }))
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${dataBaseUrl}plots_core.json`)
      .then((r) => r.json())
      .then((data) => {
        setPlots(data)
        setSelectedPlot(data.length > 0 ? data[0] : null)
        setLoading(false)
      })
      .catch((err) => { console.error('Failed to load plot data:', err); setLoading(false) })
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_crops.json`)
      .then((r) => r.json())
      .then(setCropsData)
      .catch((err) => console.error('Failed to load crops data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_away_filter.json`)
      .then((r) => r.json())
      .then(setAwayFilterData)
      .catch((err) => console.error('Failed to load away filter data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_away_details.json`)
      .then((r) => r.json())
      .then(setAwayDetailsData)
      .catch((err) => console.error('Failed to load away details data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_collaboration_filter.json`)
      .then((r) => r.json())
      .then(setCollabFilterData)
      .catch((err) => console.error('Failed to load collaboration filter data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_collaboration_details.json`)
      .then((r) => r.json())
      .then(setCollabDetailsData)
      .catch((err) => console.error('Failed to load collaboration details data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_workshops_filter.json`)
      .then((r) => r.json())
      .then(setWorkshopFilterData)
      .catch((err) => console.error('Failed to load workshops filter data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_workshops_details.json`)
      .then((r) => r.json())
      .then(setWorkshopDetailsData)
      .catch((err) => console.error('Failed to load workshops details data:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}allotments_polygons.geojson`)
      .then((r) => r.json())
      .then((data: AllotmentsGeoJson) => {
        const nextMap: Record<string, string> = {}
        ;(data.features || []).forEach((f) => {
          const idRaw = f.properties?.id
          const nameRaw = f.properties?.name
          if (idRaw === undefined || !nameRaw) return
          nextMap[String(idRaw)] = nameRaw
        })
        setAllotmentNameById(nextMap)
      })
      .catch((err) => console.error('Failed to load allotment names:', err))
  }, [dataBaseUrl])

  // ── Crop options (food mode) ───────────────────────────────────────────────
  const cropOptions = useMemo(() => {
    const all = cropsData.flatMap((item) => item.crops.map((c) => c.crop))
    return Array.from(new Set(all)).sort()
  }, [cropsData])

  // ── Filtered plots ─────────────────────────────────────────────────────────
  const filteredPlots = useMemo(() => {
    let result = plots

    // Food modes
    if (mode === 'donate' || mode === 'receive') {
      result = result.filter((p) => p.willing_to_donate === true)

      if (selectedCrop !== 'All') {
        const matchIds = new Set(
          cropsData
            .filter((item) =>
              item.crops.some((c) => c.crop.toLowerCase() === selectedCrop.toLowerCase())
            )
            .map((item) => item.plot_id)
        )
        result = result.filter((p) => matchIds.has(p.plot_id))
      }

      if (selectedDonationType === 'dropoff') result = result.filter((p) => p.willing_dropoff)
      if (selectedDonationType === 'collection') result = result.filter((p) => !p.willing_dropoff)
    }

    // Participate mode
    if (mode === 'participate') {
      const { opportunityType, startDate, endDate, day, time, experience, commitment, kidsAllowed } =
        participateFilters

      const userStart = startDate ? new Date(startDate) : null
      const userEnd   = endDate   ? new Date(endDate)   : null

      // Away eligible plot IDs
      const awayEligible: string[] =
        opportunityType === 'Any' || opportunityType === 'Volunteering'
          ? awayFilterData
              .filter((r) => {
                if (userStart && userEnd) {
                  const hasOverlap = r.away_periods.some(
                    (p) => new Date(p.start_date) <= userEnd && new Date(p.end_date) >= userStart
                  )
                  if (!hasOverlap) return false
                }
                if (commitment !== 'Any' && r.commitment_level !== parseInt(commitment)) return false
                if (experience !== 'Any' && r.experience_level !== parseInt(experience)) return false
                return true
              })
              .map((r) => r.plot_id)
          : []

      // Collaboration eligible plot IDs
      const collabEligible: string[] =
        opportunityType === 'Any' || opportunityType === 'Collaboration'
          ? collabFilterData
              .filter((r) => {
                let slots = r.collaboration_slots
                if (userStart && userEnd)
                  slots = slots.filter(
                    (s) => new Date(s.valid_from) <= userEnd && new Date(s.valid_to) >= userStart
                  )
                if (day !== 'Any') slots = slots.filter((s) => s.day_of_week === day)
                if (time !== 'Any') slots = slots.filter((s) => overlapsTime(s.start_time, s.end_time, time))
                if (slots.length === 0) return false
                if (experience !== 'Any' && r.experience_level !== parseInt(experience)) return false
                return true
              })
              .map((r) => r.plot_id)
          : []

      // Workshop eligible plot IDs
      const workshopEligible: string[] =
        opportunityType === 'Any' || opportunityType === 'Workshops'
          ? workshopFilterData
              .filter((r) => {
                if (kidsAllowed === 'Yes' && !r.kids_allowed) return false
                if (kidsAllowed === 'No' && r.kids_allowed) return false
                if (experience !== 'Any' && r.experience_level !== parseInt(experience)) return false
                let workshops = r.workshops
                if (userStart && userEnd)
                  workshops = workshops.filter((w) => {
                    const d = new Date(w.workshop_date)
                    return d >= userStart && d <= userEnd
                  })
                if (day !== 'Any')
                  workshops = workshops.filter(
                    (w) => new Date(w.workshop_date).getDay() === DAY_INDEX[day]
                  )
                if (time !== 'Any')
                  workshops = workshops.filter((w) => overlapsTime(w.start_time, w.end_time, time))
                return workshops.length > 0
              })
              .map((r) => r.plot_id)
          : []

      const eligibleIds = new Set([...awayEligible, ...collabEligible, ...workshopEligible])
      result = result.filter((p) => eligibleIds.has(p.plot_id))
    }

    return result
  }, [
    mode, plots, cropsData,
    selectedCrop, selectedDonationType,
    participateFilters,
    awayFilterData, collabFilterData, workshopFilterData,
  ])

  // ── Allotment-level derivations ────────────────────────────────────────────
  const selectedAllotmentPlots = useMemo(() => {
    if (!selectedAllotmentId) return []
    return filteredPlots.filter((p) => p.plot_id.startsWith(`${selectedAllotmentId}_`))
  }, [filteredPlots, selectedAllotmentId])

  const visibleAllotmentCount = useMemo(() => {
    return new Set(filteredPlots.map((p) => p.plot_id.split('_')[0])).size
  }, [filteredPlots])

  // ── Detail panel data for selected plot ───────────────────────────────────
  const selectedCrops = selectedPlot
    ? cropsData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedAwayFilter = selectedPlot
    ? awayFilterData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedAwayDetails = selectedPlot
    ? awayDetailsData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedCollabFilter = selectedPlot
    ? collabFilterData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedCollabDetails = selectedPlot
    ? collabDetailsData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedWorkshopFilter = selectedPlot
    ? workshopFilterData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  const selectedWorkshopDetails = selectedPlot
    ? workshopDetailsData.find((r) => r.plot_id === selectedPlot.plot_id) ?? null
    : null

  // ── Selection handlers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedAllotmentId) { setSelectedPlot(null); return }
    const next = selectedAllotmentPlots[0] ?? null
    if (!next || !selectedPlot || !selectedPlot.plot_id.startsWith(`${selectedAllotmentId}_`)) {
      setSelectedPlot(next)
    }
  }, [selectedAllotmentId, selectedAllotmentPlots, selectedPlot])

  const handleSelectPlot = (plot: Plot) => {
    const allotmentId = plot.plot_id.split('_')[0]
    setSelectedAllotmentId(allotmentId)
    setSelectedPlot(plot)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectAllotment = (allotmentId: string | null) => {
    if (!allotmentId) { setSelectedAllotmentId(null); setSelectedPlot(null); return }
    setSelectedAllotmentId(allotmentId)
    const next = filteredPlots.find((p) => p.plot_id.startsWith(`${allotmentId}_`))
    setSelectedPlot(next ?? null)
  }

  // ── Map panel labels ───────────────────────────────────────────────────────
  const { opportunityType } = participateFilters

  const browseTitle =
    mode === 'participate'
      ? opportunityType === 'Volunteering'
        ? 'Browse volunteering opportunities across London'
        : opportunityType === 'Collaboration'
        ? 'Browse collaboration opportunities across London'
        : opportunityType === 'Workshops'
        ? 'Browse workshops across London'
        : 'Browse participation opportunities across London'
      : 'Browse food availability across London'

  const browseDescription =
    mode === 'participate'
      ? opportunityType === 'Volunteering'
        ? 'Use the filters to find away-help requests that match your availability and commitment.'
        : opportunityType === 'Collaboration'
        ? 'Use the filters to find collaboration slots that match your schedule.'
        : opportunityType === 'Workshops'
        ? 'Use the filters to find workshops hosted by allotment owners.'
        : 'Use the filters to explore all participation opportunities.'
      : 'Use the filters to explore plots offering produce and view crop information for each location.'

  const summaryItems =
    mode === 'participate'
      ? [
          `Opportunity: ${opportunityType}`,
          `Experience: ${participateFilters.experience === 'Any' ? 'Any' : participateFilters.experience}`,
          ...(opportunityType === 'Any' || opportunityType === 'Volunteering'
            ? [`Commitment: ${participateFilters.commitment}`]
            : []),
          ...(opportunityType === 'Any' || opportunityType === 'Workshops'
            ? [`Kids: ${participateFilters.kidsAllowed}`]
            : []),
          `Visible plots: ${filteredPlots.length}`,
          `Visible allotments: ${visibleAllotmentCount}`,
        ]
      : [
          `Crop: ${selectedCrop}`,
          `Donation: ${selectedDonationType}`,
          `Visible plots: ${filteredPlots.length}`,
          `Visible allotments on map: ${visibleAllotmentCount}`,
        ]

  const selectedAllotmentDisplayName = selectedAllotmentId
    ? allotmentNameById[selectedAllotmentId] ?? selectedAllotmentId
    : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>
        {mode === 'participate'
          ? 'Participate'
          : mode === 'donate'
          ? 'Donate Food'
          : 'Receive Food'}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        {/* Left column: filters + plot list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: 'calc(100vh - 160px)',
            minHeight: '420px',
            overflow: 'hidden',
          }}
        >
          <FilterPanel
            mode={mode}
            cropOptions={cropOptions}
            selectedCrop={selectedCrop}
            onCropChange={setSelectedCrop}
            selectedDonationType={selectedDonationType}
            onDonationTypeChange={setSelectedDonationType}
            participateFilters={participateFilters}
            onParticipateFilterChange={handleParticipateFilterChange}
          />

          <div
            style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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

        {/* Centre column: map */}
        <div
          style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            height: 'calc(100vh - 160px)',
            minHeight: '420px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
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
            <div
              ref={mapSectionRef}
              style={{ marginTop: '16px', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <PlotMap
                plots={filteredPlots}
                selectedAllotmentId={selectedAllotmentId}
                onSelectAllotment={handleSelectAllotment}
              />
            </div>
          )}
        </div>

        {/* Right column: detail panel */}
        <div
          style={{
            height: 'calc(100vh - 160px)',
            minHeight: '420px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <DetailPanel
              mode={mode}
              selectedPlot={selectedPlot}
              selectedCrops={selectedCrops}
              selectedAwayFilter={selectedAwayFilter}
              selectedAwayDetails={selectedAwayDetails}
              selectedCollabFilter={selectedCollabFilter}
              selectedCollabDetails={selectedCollabDetails}
              selectedWorkshopFilter={selectedWorkshopFilter}
              selectedWorkshopDetails={selectedWorkshopDetails}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

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

  // ── Allotment centroids (for distance filtering) ──────────────────────────
  const [allotmentCentroidById, setAllotmentCentroidById] = useState<Map<string, { lat: number; lng: number }>>(new Map())

  // ── Location filter state ─────────────────────────────────────────────────
  const [postcode, setPostcode] = useState('')
  const [postcodeError, setPostcodeError] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(5)

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

  // ── Workshop sign-up toast ────────────────────────────────────────────────
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const signupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleWorkshopSignup = (opp: { description: string; workshop_date: string; start_time: string; end_time: string; owner_name: string }) => {
    if (signupTimerRef.current) clearTimeout(signupTimerRef.current)
    const desc = opp.description || 'this workshop'
    setSignupMessage(
      `You've signed up for "${desc}" on ${fmtDate(opp.workshop_date)}, ${opp.start_time}–${opp.end_time}, hosted by ${opp.owner_name}.`
    )
    signupTimerRef.current = setTimeout(() => setSignupMessage(null), 4000)
  }

  // ── Opportunity panel accordion state ─────────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Volunteering: false,
    Collaboration: false,
    Workshops: false,
  })
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    setOpenSections({ Volunteering: false, Collaboration: false, Workshops: false })
  }, [selectedAllotmentId])

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

  useEffect(() => {
    fetch(`${dataBaseUrl}allotments_points.geojson`)
      .then((r) => r.json())
      .then((data: { features: { properties: { id?: string | number }; geometry: { coordinates: [number, number] } }[] }) => {
        const m = new Map<string, { lat: number; lng: number }>()
        data.features.forEach((f) => {
          const id = f.properties?.id
          const [lng, lat] = f.geometry.coordinates
          if (id !== undefined) m.set(String(id), { lat, lng })
        })
        setAllotmentCentroidById(m)
      })
      .catch((err) => console.error('Failed to load allotment points:', err))
  }, [dataBaseUrl])

  const handlePostcodeSearch = async () => {
    const cleaned = postcode.trim().replace(/\s+/g, '')
    if (!cleaned) return
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${cleaned}`)
      const data = await res.json()
      if (data.status === 200) {
        setUserCoords({ lat: data.result.latitude, lng: data.result.longitude })
        setPostcodeError(null)
      } else {
        setPostcodeError('Postcode not found. Please check and try again.')
        setUserCoords(null)
      }
    } catch {
      setPostcodeError('Could not look up postcode. Check your connection.')
      setUserCoords(null)
    }
  }

  const handleClearLocation = () => {
    setPostcode('')
    setUserCoords(null)
    setPostcodeError(null)
  }

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

    // Location filter (all modes)
    if (userCoords && allotmentCentroidById.size > 0) {
      result = result.filter((p) => {
        const allotmentId = p.plot_id.split('_')[0]
        const centroid = allotmentCentroidById.get(allotmentId)
        if (!centroid) return false
        return haversineKm(userCoords.lat, userCoords.lng, centroid.lat, centroid.lng) <= radiusKm
      })
    }

    return result
  }, [
    mode, plots, cropsData,
    selectedCrop, selectedDonationType,
    participateFilters,
    awayFilterData, collabFilterData, workshopFilterData,
    userCoords, radiusKm, allotmentCentroidById,
  ])

  // ── Allotment-level derivations ────────────────────────────────────────────
  const selectedAllotmentPlots = useMemo(() => {
    if (!selectedAllotmentId) return []
    return filteredPlots.filter((p) => p.plot_id.startsWith(`${selectedAllotmentId}_`))
  }, [filteredPlots, selectedAllotmentId])

  const visibleAllotmentCount = useMemo(() => {
    return new Set(filteredPlots.map((p) => p.plot_id.split('_')[0])).size
  }, [filteredPlots])

  // ── Per-allotment opportunity counts for map bubbles ──────────────────────
  const allotmentOpportunityCount = useMemo(() => {
    const countMap = new Map<string, number>()

    if (mode === 'participate') {
      const { opportunityType, startDate, endDate, day, time } = participateFilters
      const userStart = startDate ? new Date(startDate) : null
      const userEnd   = endDate   ? new Date(endDate)   : null

      filteredPlots.forEach((plot) => {
        const allotmentId = plot.plot_id.split('_')[0]
        let count = 0

        if (opportunityType === 'Any' || opportunityType === 'Volunteering') {
          const away = awayFilterData.find((r) => r.plot_id === plot.plot_id)
          if (away) {
            count += away.away_periods.filter((p) =>
              !userStart || !userEnd ||
              (new Date(p.start_date) <= userEnd && new Date(p.end_date) >= userStart)
            ).length
          }
        }

        if (opportunityType === 'Any' || opportunityType === 'Collaboration') {
          const collab = collabFilterData.find((r) => r.plot_id === plot.plot_id)
          if (collab) {
            let slots = collab.collaboration_slots
            if (userStart && userEnd)
              slots = slots.filter((s) => new Date(s.valid_from) <= userEnd && new Date(s.valid_to) >= userStart)
            if (day !== 'Any') slots = slots.filter((s) => s.day_of_week === day)
            if (time !== 'Any') slots = slots.filter((s) => overlapsTime(s.start_time, s.end_time, time))
            count += slots.length
          }
        }

        if (opportunityType === 'Any' || opportunityType === 'Workshops') {
          const workshop = workshopFilterData.find((r) => r.plot_id === plot.plot_id)
          if (workshop) {
            let workshops = workshop.workshops
            if (userStart && userEnd)
              workshops = workshops.filter((w) => {
                const d = new Date(w.workshop_date)
                return d >= userStart && d <= userEnd
              })
            if (day !== 'Any')
              workshops = workshops.filter((w) => new Date(w.workshop_date).getDay() === DAY_INDEX[day])
            if (time !== 'Any')
              workshops = workshops.filter((w) => overlapsTime(w.start_time, w.end_time, time))
            count += workshops.length
          }
        }

        countMap.set(allotmentId, (countMap.get(allotmentId) ?? 0) + count)
      })
    } else {
      // Food mode: one opportunity per plot
      filteredPlots.forEach((plot) => {
        const allotmentId = plot.plot_id.split('_')[0]
        countMap.set(allotmentId, (countMap.get(allotmentId) ?? 0) + 1)
      })
    }

    return countMap
  }, [mode, filteredPlots, participateFilters, awayFilterData, collabFilterData, workshopFilterData])

  // ── Opportunity panel data ────────────────────────────────────────────────
  const panelAwayOpps = useMemo(() => {
    if (!selectedAllotmentId || mode !== 'participate') return []
    const { startDate, endDate } = participateFilters
    const userStart = startDate ? new Date(startDate) : null
    const userEnd   = endDate   ? new Date(endDate)   : null
    return selectedAllotmentPlots
      .flatMap((plot) => {
        const filter  = awayFilterData.find((r) => r.plot_id === plot.plot_id)
        const details = awayDetailsData.find((r) => r.plot_id === plot.plot_id)
        if (!filter) return []
        return filter.away_periods
          .filter((p) =>
            !userStart || !userEnd ||
            (new Date(p.start_date) <= userEnd && new Date(p.end_date) >= userStart)
          )
          .map((p) => ({
            plot_id: plot.plot_id,
            owner_name: plot.owner_name,
            owner_email: plot.owner_email,
            start_date: p.start_date,
            end_date: p.end_date,
            description: details?.help_description ?? '',
            experience_level: filter.experience_level,
            commitment_level: filter.commitment_level,
          }))
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [selectedAllotmentId, selectedAllotmentPlots, awayFilterData, awayDetailsData, participateFilters, mode])

  const panelCollabOpps = useMemo(() => {
    if (!selectedAllotmentId || mode !== 'participate') return []
    return selectedAllotmentPlots
      .flatMap((plot) => {
        const filter  = collabFilterData.find((r) => r.plot_id === plot.plot_id)
        const details = collabDetailsData.find((r) => r.plot_id === plot.plot_id)
        if (!filter) return []
        return filter.collaboration_slots.map((slot, i) => ({
          plot_id: plot.plot_id,
          owner_name: plot.owner_name,
          owner_email: plot.owner_email,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          valid_from: slot.valid_from,
          valid_to: slot.valid_to,
          description: details?.collaboration_slots[i]?.description ?? '',
          experience_level: filter.experience_level,
        }))
      })
      .sort((a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime())
  }, [selectedAllotmentId, selectedAllotmentPlots, collabFilterData, collabDetailsData, mode])

  const panelWorkshopOpps = useMemo(() => {
    if (!selectedAllotmentId || mode !== 'participate') return []
    return selectedAllotmentPlots
      .flatMap((plot) => {
        const filter  = workshopFilterData.find((r) => r.plot_id === plot.plot_id)
        const details = workshopDetailsData.find((r) => r.plot_id === plot.plot_id)
        if (!filter) return []
        return filter.workshops.map((w) => {
          const detail = details?.workshops.find((d) => d.workshop_date === w.workshop_date)
          return {
            plot_id: plot.plot_id,
            owner_name: plot.owner_name,
            owner_email: plot.owner_email,
            workshop_date: w.workshop_date,
            start_time: w.start_time,
            end_time: w.end_time,
            max_attendees: w.max_attendees,
            description: detail?.description ?? '',
            experience_level: filter.experience_level,
            kids_allowed: filter.kids_allowed,
          }
        })
      })
      .sort((a, b) => new Date(a.workshop_date).getTime() - new Date(b.workshop_date).getTime())
  }, [selectedAllotmentId, selectedAllotmentPlots, workshopFilterData, workshopDetailsData, mode])

  const panelCrops = useMemo(() => {
    if (!selectedAllotmentId || mode === 'participate') return []
    return selectedAllotmentPlots.map((plot) => ({
      plot,
      crops: cropsData.find((r) => r.plot_id === plot.plot_id)?.crops ?? [],
    }))
  }, [selectedAllotmentId, selectedAllotmentPlots, cropsData, mode])

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
          gridTemplateColumns: selectedAllotmentId
            ? '280px 1fr 300px'
            : '280px 1fr',
          gap: '16px',
          marginTop: '24px',
          height: 'calc(100vh - 140px)',
          minHeight: '480px',
        }}
      >
        {/* Left column: filters */}
        <div style={{ overflowY: 'auto' }}>
          <FilterPanel
            mode={mode}
            cropOptions={cropOptions}
            selectedCrop={selectedCrop}
            onCropChange={setSelectedCrop}
            selectedDonationType={selectedDonationType}
            onDonationTypeChange={setSelectedDonationType}
            participateFilters={participateFilters}
            onParticipateFilterChange={handleParticipateFilterChange}
            postcode={postcode}
            onPostcodeChange={setPostcode}
            onPostcodeSearch={handlePostcodeSearch}
            postcodeError={postcodeError}
            userCoords={userCoords}
            onClearLocation={handleClearLocation}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
          />
        </div>

        {/* Centre column: map */}
        {!loading && (
          <div ref={mapSectionRef} style={{ minHeight: 0, overflow: 'hidden' }}>
            <PlotMap
              plots={filteredPlots}
              allotmentOpportunityCount={allotmentOpportunityCount}
              selectedAllotmentId={selectedAllotmentId}
              onSelectAllotment={handleSelectAllotment}
              userCoords={userCoords}
              radiusKm={radiusKm}
            />
          </div>
        )}

        {/* Right column: opportunities panel (visible when an allotment is selected) */}
        {selectedAllotmentId && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #ddd',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>
                    {selectedAllotmentDisplayName ?? selectedAllotmentId}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {selectedAllotmentPlots.length} relevant plot
                    {selectedAllotmentPlots.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleSelectAllotment(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#6b7280',
                    lineHeight: 1,
                    padding: '2px 4px',
                  }}
                  aria-label="Close panel"
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {selectedAllotmentPlots.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  No plots in this allotment match the current filters.
                </p>
              ) : mode === 'participate' ? (
                (() => {
                  const EXP: Record<number, string> = { 1: 'New', 2: 'Beginner', 3: 'Intermediate', 4: 'Experienced' }
                  const CMT: Record<number, string> = { 1: 'Light', 2: 'Moderate', 3: 'Regular', 4: 'Intensive' }
                  const fmt = fmtDate

                  const cardStyle: React.CSSProperties = {
                    padding: '10px 12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }
                  const metaStyle: React.CSSProperties = { color: '#6b7280', fontSize: '12px', marginTop: '4px' }

                  const showAll = opportunityType === 'Any'
                  const showVol = showAll || opportunityType === 'Volunteering'
                  const showCol = showAll || opportunityType === 'Collaboration'
                  const showWrk = showAll || opportunityType === 'Workshops'

                  const SectionHeader = ({ label, count, sectionKey }: { label: string; count: number; sectionKey: string }) => (
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      <span>{label} <span style={{ fontWeight: 400, color: '#6b7280' }}>({count})</span></span>
                      <span style={{ fontSize: '11px' }}>{openSections[sectionKey] ? '▲' : '▼'}</span>
                    </button>
                  )

                  return (
                    <>
                      {showVol && (
                        <div style={{ marginBottom: showAll ? '8px' : 0 }}>
                          {showAll && <SectionHeader label="Volunteering" count={panelAwayOpps.length} sectionKey="Volunteering" />}
                          {(!showAll || openSections['Volunteering']) && (
                            panelAwayOpps.length === 0
                              ? <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>No volunteering opportunities.</p>
                              : panelAwayOpps.map((opp, i) => (
                                <div key={i} style={cardStyle}>
                                  {opp.description && (
                                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}>{opp.description}</div>
                                  )}
                                  <div style={{ marginBottom: '4px' }}>📅 {fmt(opp.start_date)} – {fmt(opp.end_date)}</div>
                                  <div style={{ marginBottom: '4px' }}>
                                    Experience: <strong>{EXP[opp.experience_level]}</strong> · Commitment: <strong>{CMT[opp.commitment_level]}</strong>
                                  </div>
                                  <div style={{ ...metaStyle, borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '6px' }}>
                                    <div>{opp.owner_name}</div>
                                    <div><a href={`mailto:${opp.owner_email}`} style={{ color: '#4f46e5' }}>{opp.owner_email}</a></div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}

                      {showCol && (
                        <div style={{ marginBottom: showAll ? '8px' : 0 }}>
                          {showAll && <SectionHeader label="Collaboration" count={panelCollabOpps.length} sectionKey="Collaboration" />}
                          {(!showAll || openSections['Collaboration']) && (
                            panelCollabOpps.length === 0
                              ? <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>No collaboration slots.</p>
                              : panelCollabOpps.map((opp, i) => (
                                <div key={i} style={cardStyle}>
                                  {opp.description && (
                                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}>{opp.description}</div>
                                  )}
                                  <div style={{ marginBottom: '4px' }}>{opp.day_of_week} · {opp.start_time}–{opp.end_time}</div>
                                  <div style={{ marginBottom: '4px' }}>📅 Available {fmt(opp.valid_from)} – {fmt(opp.valid_to)}</div>
                                  <div style={{ marginBottom: '4px' }}>Experience: <strong>{EXP[opp.experience_level]}</strong></div>
                                  <div style={{ ...metaStyle, borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '6px' }}>
                                    <div>{opp.owner_name}</div>
                                    <div><a href={`mailto:${opp.owner_email}`} style={{ color: '#4f46e5' }}>{opp.owner_email}</a></div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}

                      {showWrk && (
                        <div>
                          {showAll && <SectionHeader label="Workshops" count={panelWorkshopOpps.length} sectionKey="Workshops" />}
                          {(!showAll || openSections['Workshops']) && (
                            panelWorkshopOpps.length === 0
                              ? <p style={{ color: '#9ca3af', fontSize: '13px' }}>No workshops.</p>
                              : panelWorkshopOpps.map((opp, i) => (
                                <div key={i} style={cardStyle}>
                                  {opp.description && (
                                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}>{opp.description}</div>
                                  )}
                                  <div style={{ marginBottom: '4px' }}>📅 {fmt(opp.workshop_date)} · {opp.start_time}–{opp.end_time}</div>
                                  <div style={{ marginBottom: '4px' }}>
                                    Max {opp.max_attendees} attendees · Kids: <strong>{opp.kids_allowed ? 'Welcome' : 'Adults only'}</strong>
                                  </div>
                                  <div style={{ marginBottom: '8px' }}>Experience: <strong>{EXP[opp.experience_level]}</strong></div>
                                  <button
                                    onClick={() => handleWorkshopSignup(opp)}
                                    style={{
                                      background: '#1f4d45',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '5px 12px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      marginBottom: '8px',
                                    }}
                                  >
                                    Sign up
                                  </button>
                                  <div style={{ ...metaStyle, borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '2px' }}>
                                    <div>{opp.owner_name}</div>
                                    <div><a href={`mailto:${opp.owner_email}`} style={{ color: '#4f46e5' }}>{opp.owner_email}</a></div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </>
                  )
                })()
              ) : (
                // Food mode
                panelCrops.map(({ plot, crops }) => (
                  <div
                    key={plot.plot_id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Plot {plot.plot_id}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      {plot.willing_dropoff ? 'Drop-off available' : 'Collection only'}
                    </div>
                    {crops.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {crops.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#d1fae5',
                              color: '#065f46',
                              borderRadius: '999px',
                              padding: '2px 8px',
                              fontSize: '11px',
                            }}
                          >
                            {c.crop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {signupMessage && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#065f46',
          color: 'white',
          borderRadius: '10px',
          padding: '12px 20px',
          fontSize: '14px',
          lineHeight: 1.5,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 9999,
          maxWidth: '480px',
          textAlign: 'center',
        }}>
          ✓ {signupMessage}
        </div>
      )}
    </div>
  )
}

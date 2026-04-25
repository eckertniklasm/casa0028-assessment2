import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import FilterPanel from '../components/FilterPanel'
import FoodbankMap from '../components/FoodbankMap'
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

type FoodbanksGeoJson = { features?: Array<Omit<FoodbankFeature, 'id'>> }

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

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const TIME_RANGES: Record<string, [number, number]> = {
  Morning: [360, 660],
  Midday: [660, 840],
  Afternoon: [840, 1020],
  Evening: [1020, 1260],
}

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

function overlapsTime(start: string, end: string, filterTime: string) {
  if (filterTime === 'Any') return true
  const [fs, fe] = TIME_RANGES[filterTime]
  return toMin(start) < fe && toMin(end) > fs
}

type Props = { mode: 'participate' | 'donate' | 'receive' }

const pageShell: CSSProperties = {
  padding: '30px 28px 36px',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

const whiteCard: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d8dfdb',
  borderRadius: '30px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
}

const cardTitle: CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: '22px',
  fontWeight: 800,
  color: '#1f2937',
  lineHeight: 1.2,
}

const cardText: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#667085',
  lineHeight: 1.7,
}

const smallTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 18px',
  minHeight: '42px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.96)',
  color: '#1f5a4f',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.4px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
}

const sectionTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: '999px',
  background: '#edf5f1',
  color: '#1f5a4f',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.35px',
}

const featureCard: CSSProperties = {
  ...whiteCard,
  padding: '28px 26px',
}

const stepCard: CSSProperties = {
  ...whiteCard,
  padding: '28px 26px',
  minHeight: '180px',
}

const numberDot = (bg = '#1f5a4f'): CSSProperties => ({
  width: '34px',
  height: '34px',
  borderRadius: '999px',
  background: bg,
  color: 'white',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '18px',
  marginBottom: '18px',
})

const opportunityCard: CSSProperties = {
  padding: '14px 14px',
  marginBottom: '10px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: '13px',
  lineHeight: 1.55,
}

const panelHeaderTitle: CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '17px',
  fontWeight: 800,
  color: '#1f2937',
  lineHeight: 1.2,
}

const panelHeaderMeta: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#6b7280',
}

const closeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '18px',
  color: '#6b7280',
  lineHeight: 1,
  padding: '2px 4px',
}

const metaStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  marginTop: '6px',
}

const infoLabel: CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  color: '#6b7280',
  marginBottom: '4px',
}

const infoValue: CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  marginBottom: '12px',
  lineHeight: 1.5,
}

const produceStatusPill = (dropoff: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.3px',
  background: dropoff ? '#dcfce7' : '#eff6ff',
  color: dropoff ? '#166534' : '#1d4ed8',
  marginBottom: '10px',
})

export default function ExplorePage({ mode }: Props) {
  const dataBaseUrl = `${import.meta.env.BASE_URL}data/`
  const base = import.meta.env.BASE_URL
  const mapSectionRef = useRef<HTMLDivElement | null>(null)

  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [foodbanksLoading, setFoodbanksLoading] = useState(true)
  const [cropsData, setCropsData] = useState<CropRecord[]>([])
  const [allotmentNameById, setAllotmentNameById] = useState<Record<string, string>>({})
  const [foodbanks, setFoodbanks] = useState<FoodbankFeature[]>([])

  const [awayFilterData, setAwayFilterData] = useState<AwayFilterRecord[]>([])
  const [awayDetailsData, setAwayDetailsData] = useState<AwayDetailsRecord[]>([])
  const [collabFilterData, setCollabFilterData] = useState<CollabFilterRecord[]>([])
  const [collabDetailsData, setCollabDetailsData] = useState<CollabDetailsRecord[]>([])
  const [workshopFilterData, setWorkshopFilterData] = useState<WorkshopFilterRecord[]>([])
  const [workshopDetailsData, setWorkshopDetailsData] = useState<WorkshopDetailsRecord[]>([])

  const [allotmentCentroidById, setAllotmentCentroidById] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map())

  const [postcode, setPostcode] = useState('')
  const [postcodeError, setPostcodeError] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(5)

  const [selectedAllotmentId, setSelectedAllotmentId] = useState<string | null>(null)
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [selectedFoodbankId, setSelectedFoodbankId] = useState<string | null>(null)

  const [selectedCrop, setSelectedCrop] = useState('All')
  const [selectedDonationType, setSelectedDonationType] = useState('All')

  const [participateFilters, setParticipateFilters] = useState<ParticipateFilters>(
    DEFAULT_PARTICIPATE_FILTERS
  )

  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const signupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Volunteering: false,
    Collaboration: false,
    Workshops: false,
  })

  const handleParticipateFilterChange = (key: string, value: string) => {
    setParticipateFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleWorkshopSignup = (opp: {
    description: string
    workshop_date: string
    start_time: string
    end_time: string
    owner_name: string
  }) => {
    if (signupTimerRef.current) clearTimeout(signupTimerRef.current)
    const desc = opp.description || 'this workshop'
    setSignupMessage(
      `You've signed up for "${desc}" on ${fmtDate(opp.workshop_date)}, ${opp.start_time}–${opp.end_time}, hosted by ${opp.owner_name}.`
    )
    signupTimerRef.current = setTimeout(() => setSignupMessage(null), 4000)
  }

  useEffect(() => {
    setOpenSections({ Volunteering: false, Collaboration: false, Workshops: false })
  }, [selectedAllotmentId])

  useEffect(() => {
    fetch(`${dataBaseUrl}plots_core.json`)
      .then((r) => r.json())
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
    if (mode === 'participate') return
    fetch(`${dataBaseUrl}plots_crops.json`)
      .then((r) => r.json())
      .then(setCropsData)
      .catch((err) => console.error('Failed to load crops data:', err))
  }, [dataBaseUrl, mode])

  useEffect(() => {
    if (mode !== 'participate') return
    fetch(`${dataBaseUrl}plots_away_filter.json`)
      .then((r) => r.json())
      .then(setAwayFilterData)
      .catch((err) => console.error('Failed to load away filter data:', err))
  }, [dataBaseUrl, mode])

  useEffect(() => {
    if (mode !== 'participate' || !selectedAllotmentId || awayDetailsData.length > 0) return
    fetch(`${dataBaseUrl}plots_away_details.json`)
      .then((r) => r.json())
      .then(setAwayDetailsData)
      .catch((err) => console.error('Failed to load away details data:', err))
  }, [dataBaseUrl, mode, selectedAllotmentId, awayDetailsData.length])

  useEffect(() => {
    if (mode !== 'participate') return
    fetch(`${dataBaseUrl}plots_collaboration_filter.json`)
      .then((r) => r.json())
      .then(setCollabFilterData)
      .catch((err) => console.error('Failed to load collaboration filter data:', err))
  }, [dataBaseUrl, mode])

  useEffect(() => {
    if (mode !== 'participate' || !selectedAllotmentId || collabDetailsData.length > 0) return
    fetch(`${dataBaseUrl}plots_collaboration_details.json`)
      .then((r) => r.json())
      .then(setCollabDetailsData)
      .catch((err) => console.error('Failed to load collaboration details data:', err))
  }, [dataBaseUrl, mode, selectedAllotmentId, collabDetailsData.length])

  useEffect(() => {
    if (mode !== 'participate') return
    fetch(`${dataBaseUrl}plots_workshops_filter.json`)
      .then((r) => r.json())
      .then(setWorkshopFilterData)
      .catch((err) => console.error('Failed to load workshops filter data:', err))
  }, [dataBaseUrl, mode])

  useEffect(() => {
    if (mode !== 'participate' || !selectedAllotmentId || workshopDetailsData.length > 0) return
    fetch(`${dataBaseUrl}plots_workshops_details.json`)
      .then((r) => r.json())
      .then(setWorkshopDetailsData)
      .catch((err) => console.error('Failed to load workshops details data:', err))
  }, [dataBaseUrl, mode, selectedAllotmentId, workshopDetailsData.length])

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
      .then(
        (
          data: {
            features: {
              properties: { id?: string | number }
              geometry: { coordinates: [number, number] }
            }[]
          }
        ) => {
          const m = new Map<string, { lat: number; lng: number }>()
          data.features.forEach((f) => {
            const id = f.properties?.id
            const [lng, lat] = f.geometry.coordinates
            if (id !== undefined) m.set(String(id), { lat, lng })
          })
          setAllotmentCentroidById(m)
        }
      )
      .catch((err) => console.error('Failed to load allotment points:', err))
  }, [dataBaseUrl])

  useEffect(() => {
    fetch(`${dataBaseUrl}foodbanks_london.geojson`)
      .then((r) => r.json())
      .then((data: FoodbanksGeoJson) => {
        const nextFoodbanks = (data.features || []).map((feature, index) => ({
          ...feature,
          id: `${feature.properties?.slug ?? feature.properties?.name ?? 'foodbank'}-${index}`,
        }))
        setFoodbanks(nextFoodbanks)
        setFoodbanksLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load foodbanks data:', err)
        setFoodbanksLoading(false)
      })
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

  const cropOptions = useMemo(() => {
    const all = cropsData.flatMap((item) => item.crops.map((c) => c.crop))
    return Array.from(new Set(all)).sort()
  }, [cropsData])

  const filteredFoodbanks = useMemo(() => {
    if (mode !== 'donate') return []

    let result = foodbanks

    if (userCoords) {
      result = result.filter((foodbank) => {
        const coords = foodbank.geometry?.coordinates
        if (!coords || coords.length < 2) return false
        const [lng, lat] = coords
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
        return haversineKm(userCoords.lat, userCoords.lng, lat, lng) <= radiusKm
      })
    }

    return result
  }, [mode, foodbanks, userCoords, radiusKm])

  const filteredPlots = useMemo(() => {
    let result = plots

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

      if (selectedDonationType === 'dropoff') {
        result = result.filter((p) => p.willing_dropoff)
      }
      if (selectedDonationType === 'collection') {
        result = result.filter((p) => !p.willing_dropoff)
      }
    }

    if (mode === 'participate') {
      const {
        opportunityType,
        startDate,
        endDate,
        day,
        time,
        experience,
        commitment,
        kidsAllowed,
      } = participateFilters

      const userStart = startDate ? new Date(startDate) : null
      const userEnd = endDate ? new Date(endDate) : null

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

      const collabEligible: string[] =
        opportunityType === 'Any' || opportunityType === 'Collaboration'
          ? collabFilterData
              .filter((r) => {
                let slots = r.collaboration_slots
                if (userStart && userEnd) {
                  slots = slots.filter(
                    (s) => new Date(s.valid_from) <= userEnd && new Date(s.valid_to) >= userStart
                  )
                }
                if (day !== 'Any') slots = slots.filter((s) => s.day_of_week === day)
                if (time !== 'Any') slots = slots.filter((s) => overlapsTime(s.start_time, s.end_time, time))
                if (slots.length === 0) return false
                if (experience !== 'Any' && r.experience_level !== parseInt(experience)) return false
                return true
              })
              .map((r) => r.plot_id)
          : []

      const workshopEligible: string[] =
        opportunityType === 'Any' || opportunityType === 'Workshops'
          ? workshopFilterData
              .filter((r) => {
                if (kidsAllowed === 'Yes' && !r.kids_allowed) return false
                if (kidsAllowed === 'No' && r.kids_allowed) return false
                if (experience !== 'Any' && r.experience_level !== parseInt(experience)) return false
                let workshops = r.workshops
                if (userStart && userEnd) {
                  workshops = workshops.filter((w) => {
                    const d = new Date(w.workshop_date)
                    return d >= userStart && d <= userEnd
                  })
                }
                if (day !== 'Any') {
                  workshops = workshops.filter(
                    (w) => new Date(w.workshop_date).getDay() === DAY_INDEX[day]
                  )
                }
                if (time !== 'Any') {
                  workshops = workshops.filter((w) => overlapsTime(w.start_time, w.end_time, time))
                }
                return workshops.length > 0
              })
              .map((r) => r.plot_id)
          : []

      const eligibleIds = new Set([...awayEligible, ...collabEligible, ...workshopEligible])
      result = result.filter((p) => eligibleIds.has(p.plot_id))
    }

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
    mode,
    plots,
    cropsData,
    selectedCrop,
    selectedDonationType,
    participateFilters,
    awayFilterData,
    collabFilterData,
    workshopFilterData,
    userCoords,
    radiusKm,
    allotmentCentroidById,
  ])

  const selectedAllotmentPlots = useMemo(() => {
    if (!selectedAllotmentId) return []
    return filteredPlots.filter((p) => p.plot_id.startsWith(`${selectedAllotmentId}_`))
  }, [filteredPlots, selectedAllotmentId])

  const allotmentOpportunityCount = useMemo(() => {
    const countMap = new Map<string, number>()

    if (mode === 'participate') {
      const { opportunityType, startDate, endDate, day, time } = participateFilters
      const userStart = startDate ? new Date(startDate) : null
      const userEnd = endDate ? new Date(endDate) : null

      filteredPlots.forEach((plot) => {
        const allotmentId = plot.plot_id.split('_')[0]
        let count = 0

        if (opportunityType === 'Any' || opportunityType === 'Volunteering') {
          const away = awayFilterData.find((r) => r.plot_id === plot.plot_id)
          if (away) {
            count += away.away_periods.filter(
              (p) =>
                !userStart ||
                !userEnd ||
                (new Date(p.start_date) <= userEnd && new Date(p.end_date) >= userStart)
            ).length
          }
        }

        if (opportunityType === 'Any' || opportunityType === 'Collaboration') {
          const collab = collabFilterData.find((r) => r.plot_id === plot.plot_id)
          if (collab) {
            let slots = collab.collaboration_slots
            if (userStart && userEnd) {
              slots = slots.filter(
                (s) => new Date(s.valid_from) <= userEnd && new Date(s.valid_to) >= userStart
              )
            }
            if (day !== 'Any') slots = slots.filter((s) => s.day_of_week === day)
            if (time !== 'Any') slots = slots.filter((s) => overlapsTime(s.start_time, s.end_time, time))
            count += slots.length
          }
        }

        if (opportunityType === 'Any' || opportunityType === 'Workshops') {
          const workshop = workshopFilterData.find((r) => r.plot_id === plot.plot_id)
          if (workshop) {
            let workshops = workshop.workshops
            if (userStart && userEnd) {
              workshops = workshops.filter((w) => {
                const d = new Date(w.workshop_date)
                return d >= userStart && d <= userEnd
              })
            }
            if (day !== 'Any') {
              workshops = workshops.filter(
                (w) => new Date(w.workshop_date).getDay() === DAY_INDEX[day]
              )
            }
            if (time !== 'Any') {
              workshops = workshops.filter((w) => overlapsTime(w.start_time, w.end_time, time))
            }
            count += workshops.length
          }
        }

        countMap.set(allotmentId, (countMap.get(allotmentId) ?? 0) + count)
      })
    } else {
      filteredPlots.forEach((plot) => {
        const allotmentId = plot.plot_id.split('_')[0]
        countMap.set(allotmentId, (countMap.get(allotmentId) ?? 0) + 1)
      })
    }

    return countMap
  }, [mode, filteredPlots, participateFilters, awayFilterData, collabFilterData, workshopFilterData])

  const panelAwayOpps = useMemo(() => {
    if (!selectedAllotmentId || mode !== 'participate') return []
    const { startDate, endDate } = participateFilters
    const userStart = startDate ? new Date(startDate) : null
    const userEnd = endDate ? new Date(endDate) : null
    return selectedAllotmentPlots
      .flatMap((plot) => {
        const filter = awayFilterData.find((r) => r.plot_id === plot.plot_id)
        const details = awayDetailsData.find((r) => r.plot_id === plot.plot_id)
        if (!filter) return []
        return filter.away_periods
          .filter(
            (p) =>
              !userStart ||
              !userEnd ||
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
        const filter = collabFilterData.find((r) => r.plot_id === plot.plot_id)
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
        const filter = workshopFilterData.find((r) => r.plot_id === plot.plot_id)
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

  const selectedFoodbank = useMemo(() => {
    if (mode !== 'donate' || !selectedFoodbankId) return null
    return foodbanks.find((foodbank) => foodbank.id === selectedFoodbankId) ?? null
  }, [mode, foodbanks, selectedFoodbankId])

  useEffect(() => {
    if (!selectedAllotmentId) {
      setSelectedPlot(null)
      return
    }
    const next = selectedAllotmentPlots[0] ?? null
    if (!next || !selectedPlot || !selectedPlot.plot_id.startsWith(`${selectedAllotmentId}_`)) {
      setSelectedPlot(next)
    }
  }, [selectedAllotmentId, selectedAllotmentPlots, selectedPlot])

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 120)
    return () => clearTimeout(timer)
  }, [selectedAllotmentId, selectedFoodbankId, mode])

  const handleSelectAllotment = (allotmentId: string | null) => {
    if (!allotmentId) {
      setSelectedAllotmentId(null)
      setSelectedPlot(null)
      return
    }
    setSelectedAllotmentId(allotmentId)
    const next = filteredPlots.find((p) => p.plot_id.startsWith(`${allotmentId}_`))
    setSelectedPlot(next ?? null)
  }

  const handleSelectFoodbank = (foodbankId: string | null) => {
    setSelectedFoodbankId(foodbankId)
  }

  const { opportunityType } = participateFilters

  const selectedAllotmentDisplayName = selectedAllotmentId
    ? allotmentNameById[selectedAllotmentId] ?? selectedAllotmentId
    : null

  const heroImage =
    mode === 'participate'
      ? `${base}images/workshop.jpg`
      : mode === 'donate'
      ? `${base}images/excess_food.webp`
      : `${base}images/volunteering.jpg`

  const heroTitle =
    mode === 'participate'
      ? 'Join London’s allotment community in practical ways'
      : mode === 'donate'
      ? 'Help route surplus produce to local support networks'
      : 'Browse available food-sharing opportunities'

  const heroSubtitle =
    mode === 'participate'
      ? 'Discover volunteering, collaboration, and workshop opportunities across local allotments, then contact plot owners directly when something suits your time and experience.'
      : mode === 'donate'
      ? 'Explore nearby foodbanks, compare local support options, and open contact details for donation planning.'
      : 'Explore allotments with surplus produce and refine results by crop, donation type, and location.'

  const heroPills =
    mode === 'participate'
      ? ['Participate', 'Grow with the community']
      : mode === 'donate'
      ? ['Donate food', 'Nearby foodbanks']
      : ['Receive food', 'Surplus produce']

  const heroPanelItems =
    mode === 'participate'
      ? [
          'Filter by dates, travel distance, experience, and commitment',
          'Review volunteering, collaboration, and workshop cards',
          'Reach owners directly through the detail panel',
        ]
      : mode === 'donate'
      ? [
          'Browse nearby foodbanks through the map view',
          'Compare organisation, network, and contact details',
          'Use the right-hand panel to decide where to donate',
        ]
      : [
          'Filter produce types more quickly by crop',
          'Compare drop-off and collection options',
          'Review produce tags plot by plot in the detail panel',
        ]

  const renderTopModules = () => {
    if (mode === 'participate') {
      return (
        <>
          <section style={{ ...whiteCard, padding: '30px 30px 34px', marginBottom: '22px' }}>
            <h2 style={cardTitle}>How participation works</h2>
            <p style={{ ...cardText, marginBottom: '26px', maxWidth: '860px' }}>
              PlotShare helps people discover community growing opportunities across London,
              even if they do not currently have their own allotment plot.
            </p>

            <div className="explore-grid-3">
              {[
                {
                  n: '1',
                  t: 'Filter by location and availability',
                  d: 'Use the filters to narrow results by travel distance, dates, experience level, and opportunity type.',
                },
                {
                  n: '2',
                  t: 'Explore matching allotments on the map',
                  d: 'Select an allotment to see volunteering, collaboration, and workshop opportunities that match your preferences.',
                },
                {
                  n: '3',
                  t: 'Contact owners or join activities',
                  d: 'Review opportunity details and connect directly with plot owners to take part in practical community growing activities.',
                },
              ].map((item) => (
                <div
                  key={item.n}
                  className="explore-feature-card"
                  style={stepCard}
                >
                  <div style={numberDot()}>{item.n}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#1f2937' }}>
                    {item.t}
                  </div>
                  <p style={cardText}>{item.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...whiteCard, padding: '30px', marginBottom: '22px' }}>
            <h2 style={cardTitle}>Why participate through PlotShare?</h2>
            <p style={{ ...cardText, marginBottom: '26px', maxWidth: '820px' }}>
              These features help the page work as more than a map tool by supporting
              understanding, access, and practical next steps.
            </p>

            <div className="explore-grid-3">
              {[
                ['Flexible', 'Different opportunity types let people join at different commitment levels, from one-off workshops to longer support periods.'],
                ['Local', 'Map-based browsing makes it easier to identify options close to where you live, study, or regularly travel.'],
                ['Community-led', 'The platform supports local relationships between allotment holders, volunteers, and people interested in food growing.'],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="explore-section-card"
                  style={{ ...featureCard, background: '#f8faf9' }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: '#1f2937' }}>
                    {title}
                  </div>
                  <p style={cardText}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...whiteCard, padding: '30px', marginBottom: '28px' }}>
            <h2 style={cardTitle}>Frequently asked questions</h2>
            <p style={{ ...cardText, marginBottom: '26px', maxWidth: '760px' }}>
              These short answers help explain how the platform can be used and what users
              should expect when exploring opportunities.
            </p>

            <div className="explore-grid-3">
              {[
                [
                  'Do I need prior gardening experience?',
                  'Not always. Many opportunities welcome beginners, and the experience filter helps you identify activities suited to your confidence level.',
                ],
                [
                  'Can I participate without my own allotment?',
                  'Yes. This page is specifically designed to help people engage with allotment communities even if they do not currently hold a plot.',
                ],
                [
                  'How do I contact a plot owner?',
                  'Each opportunity card includes the owner’s contact email, so you can reach out directly once you find a suitable activity.',
                ],
              ].map(([q, a]) => (
                <div
                  key={q}
                  className="explore-section-card"
                  style={featureCard}
                >
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: '#1f2937' }}>
                    {q}
                  </div>
                  <p style={cardText}>{a}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )
    }

    if (mode === 'donate') {
      return (
        <>
          <section style={{ ...whiteCard, padding: '30px', marginBottom: '22px' }}>
            <div style={{ ...sectionTag, marginBottom: '18px' }}>Why donating locally matters</div>
            <h2 style={{ ...cardTitle, fontSize: '42px', letterSpacing: '-0.03em', maxWidth: '1100px' }}>
              Turn excess produce into useful local support
            </h2>

            <div className="explore-grid-3" style={{ marginTop: '22px' }}>
              {[
                ['Reduce food waste', 'Help edible produce stay in circulation instead of being lost or discarded.'],
                ['Support nearby communities', 'Make it easier for local food support networks to connect with fresh produce.'],
                ['Plan with confidence', 'Use mapped details to compare organisations and make more informed donation choices.'],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="explore-section-card"
                  style={featureCard}
                >
                  <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#1f2937' }}>
                    {title}
                  </div>
                  <p style={cardText}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            className="explore-green-band"
            style={{
              padding: '32px 32px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 0.9fr',
                gap: '26px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ ...smallTag, background: 'rgba(255,255,255,0.14)', color: '#fff', boxShadow: 'none', marginBottom: '18px' }}>
                  Support network spotlight
                </div>
                <h2
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '38px',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    maxWidth: '760px',
                  }}
                >
                  Compare contacts, addresses, and networks more easily
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.92)',
                    lineHeight: 1.75,
                    maxWidth: '720px',
                  }}
                >
                  The right-hand panel is designed to feel more like a decision card than
                  a plain info box, helping users review practical details before acting.
                </p>
              </div>

              <div className="side-box" style={{ padding: '24px 26px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.9, fontSize: '14px' }}>
                  <li>Organisation and network details</li>
                  <li>Address, telephone, and email</li>
                  <li>Website links for follow-up planning</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )
    }

    return (
      <>
        <section style={{ ...whiteCard, padding: '30px', marginBottom: '22px' }}>
          <h2 style={cardTitle}>What makes this page useful?</h2>
          <p style={{ ...cardText, marginBottom: '26px', maxWidth: '920px' }}>
            Rather than presenting produce as a plain list, the page combines location,
            crop filtering, and availability mode so users can scan opportunities faster.
          </p>

          <div className="explore-grid-3">
            {[
              ['More visual scanning', 'Crop tags and availability pills make the right-hand panel easier to skim quickly.'],
              ['More practical filtering', 'Users can refine by crop type, donation type, and distance without leaving the map context.'],
              ['More local relevance', 'Produce opportunities are connected to individual allotments, not detached from place.'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="explore-section-card"
                style={featureCard}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#1f2937' }}>
                  {title}
                </div>
                <p style={cardText}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            ...whiteCard,
            padding: '30px',
            marginBottom: '28px',
            background: '#f3faf7',
            borderColor: '#d6e8de',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 0.95fr',
              gap: '28px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ ...sectionTag, marginBottom: '16px', background: '#dff0e8', color: '#155b49' }}>
                Finding nearby produce
              </div>
              <h2 style={{ ...cardTitle, fontSize: '34px', maxWidth: '720px' }}>
                Suggested user flow
              </h2>
              <p style={{ ...cardText, maxWidth: '720px' }}>
                Start with crop and donation type filters, review allotments on the map, and
                then compare produce tags inside the right-hand detail panel before deciding
                which option is most useful.
              </p>
            </div>

            <div className="explore-grid-2">
              {[
                ['1', 'Choose a crop', 'Use the left filter panel to narrow produce types.'],
                ['2', 'Review map matches', 'See which allotments still match your filters.'],
                ['3', 'Check availability mode', 'Compare drop-off and collection options.'],
                ['4', 'Inspect produce tags', 'Use the detail panel for quick decision-making.'],
              ].map(([n, title, desc]) => (
                <div
                  key={n}
                  className="explore-feature-card"
                  style={{ ...featureCard, padding: '22px 20px' }}
                >
                  <div style={numberDot('#2f7b6a')}>{n}</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '10px', color: '#1f2937' }}>
                    {title}
                  </div>
                  <p style={cardText}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  const renderParticipatePanel = () => {
    const EXP: Record<number, string> = {
      1: 'New',
      2: 'Beginner',
      3: 'Intermediate',
      4: 'Experienced',
    }
    const CMT: Record<number, string> = {
      1: 'Light',
      2: 'Moderate',
      3: 'Regular',
      4: 'Intensive',
    }

    const showAll = opportunityType === 'Any'
    const showVol = showAll || opportunityType === 'Volunteering'
    const showCol = showAll || opportunityType === 'Collaboration'
    const showWrk = showAll || opportunityType === 'Workshops'

    const SectionHeader = ({
      label,
      count,
      sectionKey,
    }: {
      label: string
      count: number
      sectionKey: string
    }) => (
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '10px 12px',
          marginBottom: '10px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 700,
          color: '#374151',
        }}
      >
        <span>
          {label}{' '}
          <span style={{ fontWeight: 500, color: '#6b7280' }}>({count})</span>
        </span>
        <span style={{ fontSize: '11px' }}>{openSections[sectionKey] ? '▲' : '▼'}</span>
      </button>
    )

    return (
      <>
        {showVol && (
          <div style={{ marginBottom: showAll ? '10px' : 0 }}>
            {showAll && (
              <SectionHeader
                label="Volunteering"
                count={panelAwayOpps.length}
                sectionKey="Volunteering"
              />
            )}
            {(!showAll || openSections['Volunteering']) &&
              (panelAwayOpps.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                  No volunteering opportunities.
                </p>
              ) : (
                panelAwayOpps.map((opp, i) => (
                  <div key={i} className="explore-list-card" style={opportunityCard}>
                    {opp.description && (
                      <div style={{ fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
                        {opp.description}
                      </div>
                    )}
                    <div style={{ marginBottom: '6px', color: '#374151' }}>
                      📅 {fmtDate(opp.start_date)} – {fmtDate(opp.end_date)}
                    </div>
                    <div style={{ marginBottom: '4px', color: '#4b5563' }}>
                      Experience: <strong>{EXP[opp.experience_level]}</strong> · Commitment:{' '}
                      <strong>{CMT[opp.commitment_level]}</strong>
                    </div>
                    <div
                      style={{
                        ...metaStyle,
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '8px',
                        marginTop: '10px',
                      }}
                    >
                      <div style={{ marginBottom: '2px', color: '#6b7280' }}>{opp.owner_name}</div>
                      <div>
                        <a
                          href={`mailto:${opp.owner_email}`}
                          style={{ color: '#2563eb', fontWeight: 600 }}
                        >
                          {opp.owner_email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ))}
          </div>
        )}

        {showCol && (
          <div style={{ marginBottom: showAll ? '10px' : 0 }}>
            {showAll && (
              <SectionHeader
                label="Collaboration"
                count={panelCollabOpps.length}
                sectionKey="Collaboration"
              />
            )}
            {(!showAll || openSections['Collaboration']) &&
              (panelCollabOpps.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                  No collaboration slots.
                </p>
              ) : (
                panelCollabOpps.map((opp, i) => (
                  <div key={i} className="explore-list-card" style={opportunityCard}>
                    {opp.description && (
                      <div style={{ fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
                        {opp.description}
                      </div>
                    )}
                    <div style={{ marginBottom: '6px', color: '#374151' }}>
                      {opp.day_of_week} · {opp.start_time}–{opp.end_time}
                    </div>
                    <div style={{ marginBottom: '4px', color: '#4b5563' }}>
                      📅 Available {fmtDate(opp.valid_from)} – {fmtDate(opp.valid_to)}
                    </div>
                    <div style={{ marginBottom: '4px', color: '#4b5563' }}>
                      Experience: <strong>{EXP[opp.experience_level]}</strong>
                    </div>
                    <div
                      style={{
                        ...metaStyle,
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '8px',
                        marginTop: '10px',
                      }}
                    >
                      <div style={{ marginBottom: '2px', color: '#6b7280' }}>{opp.owner_name}</div>
                      <div>
                        <a
                          href={`mailto:${opp.owner_email}`}
                          style={{ color: '#2563eb', fontWeight: 600 }}
                        >
                          {opp.owner_email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ))}
          </div>
        )}

        {showWrk && (
          <div>
            {showAll && (
              <SectionHeader
                label="Workshops"
                count={panelWorkshopOpps.length}
                sectionKey="Workshops"
              />
            )}
            {(!showAll || openSections['Workshops']) &&
              (panelWorkshopOpps.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>No workshops.</p>
              ) : (
                panelWorkshopOpps.map((opp, i) => (
                  <div key={i} className="explore-list-card" style={opportunityCard}>
                    {opp.description && (
                      <div style={{ fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
                        {opp.description}
                      </div>
                    )}
                    <div style={{ marginBottom: '6px', color: '#374151' }}>
                      📅 {fmtDate(opp.workshop_date)} · {opp.start_time}–{opp.end_time}
                    </div>
                    <div style={{ marginBottom: '4px', color: '#4b5563' }}>
                      Max {opp.max_attendees} attendees · Kids:{' '}
                      <strong>{opp.kids_allowed ? 'Welcome' : 'Adults only'}</strong>
                    </div>
                    <div style={{ marginBottom: '10px', color: '#4b5563' }}>
                      Experience: <strong>{EXP[opp.experience_level]}</strong>
                    </div>
                    <button
                      onClick={() => handleWorkshopSignup(opp)}
                      style={{
                        background: '#1f5a4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 13px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginBottom: '8px',
                      }}
                    >
                      Sign up
                    </button>
                    <div
                      style={{
                        ...metaStyle,
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <div style={{ marginBottom: '2px', color: '#6b7280' }}>{opp.owner_name}</div>
                      <div>
                        <a
                          href={`mailto:${opp.owner_email}`}
                          style={{ color: '#2563eb', fontWeight: 600 }}
                        >
                          {opp.owner_email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ))}
          </div>
        )}
      </>
    )
  }

  const renderFoodPanel = () => (
    <>
      {panelCrops.map(({ plot, crops }) => (
        <div key={plot.plot_id} className="explore-list-card" style={opportunityCard}>
          <div style={produceStatusPill(plot.willing_dropoff)}>
            {plot.willing_dropoff ? 'Drop-off available' : 'Collection only'}
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '6px',
            }}
          >
            Plot {plot.plot_id}
          </div>

          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: crops.length > 0 ? '10px' : '4px',
            }}
          >
            Available produce
          </div>

          {crops.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {crops.map((c, i) => (
                <span
                  key={i}
                  className="explore-chip-hover"
                  style={{
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '999px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {c.crop}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              No crop details available for this plot.
            </div>
          )}
        </div>
      ))}
    </>
  )

  if (mode === 'donate') {
    return (
      <div style={pageShell}>
        <section
          className="explore-hero-image"
          style={{
            ...whiteCard,
            marginBottom: '28px',
            padding: '34px 36px',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '465px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '28px',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {heroPills.map((pill) => (
                <div key={pill} className="explore-hero-pill" style={smallTag}>
                  {pill}
                </div>
              ))}
            </div>

            <h1
              style={{
                margin: '0 0 18px 0',
                fontSize: 'clamp(42px, 5vw, 70px)',
                lineHeight: 0.98,
                fontWeight: 800,
                letterSpacing: '-0.045em',
                color: '#fff',
                maxWidth: '760px',
              }}
            >
              {heroTitle}
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.92)',
                maxWidth: '760px',
              }}
            >
              {heroSubtitle}
            </p>
          </div>

          <div
            className="explore-hero-panel"
            style={{
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 800, letterSpacing: '1.6px' }}>
              WHAT YOU CAN DO HERE
            </div>
            <div style={{ display: 'grid', gap: '14px' }}>
              {heroPanelItems.map((item) => (
                <div
                  key={item}
                  className="subitem"
                  style={{ padding: '16px 18px', fontSize: '15px', lineHeight: 1.55 }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {renderTopModules()}

        <div className="explore-main-grid">
          <div className="explore-filter-panel">
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

          {!foodbanksLoading && (
            <div className="explore-map-panel">
              <div ref={mapSectionRef}>
                <FoodbankMap
                  foodbanks={filteredFoodbanks}
                  selectedFoodbankId={selectedFoodbankId}
                  onSelectFoodbank={handleSelectFoodbank}
                  userCoords={userCoords}
                  radiusKm={radiusKm}
                />
              </div>
            </div>
          )}

          <div className="explore-detail-panel">
            {selectedFoodbankId ? (
              <>
                <div style={{ paddingBottom: '14px', borderBottom: '1px solid #eef2f7', marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h3 style={panelHeaderTitle}>
                        {selectedFoodbank?.properties?.name ?? 'Selected foodbank'}
                      </h3>
                      <p style={panelHeaderMeta}>
                        {filteredFoodbanks.length} nearby foodbank
                        {filteredFoodbanks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectFoodbank(null)}
                      style={closeBtn}
                      aria-label="Close panel"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {!selectedFoodbank ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    Select a foodbank marker to view contact details.
                  </p>
                ) : (
                  <div className="explore-list-card" style={opportunityCard}>
                    <div style={{ ...sectionTag, marginBottom: '14px' }}>Foodbank details</div>

                    <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '14px', color: '#111827', lineHeight: 1.35 }}>
                      {selectedFoodbank.properties?.name ?? 'Foodbank'}
                    </div>

                    {selectedFoodbank.properties?.foodbank && (
                      <div>
                        <div style={infoLabel}>Organisation</div>
                        <div style={infoValue}>{selectedFoodbank.properties.foodbank}</div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.network && (
                      <div>
                        <div style={infoLabel}>Network</div>
                        <div style={infoValue}>{selectedFoodbank.properties.network}</div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.address && (
                      <div>
                        <div style={infoLabel}>Address</div>
                        <div style={{ ...infoValue, whiteSpace: 'pre-line' }}>
                          {selectedFoodbank.properties.address}
                        </div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.telephone && (
                      <div>
                        <div style={infoLabel}>Telephone</div>
                        <div style={infoValue}>
                          <a
                            href={`tel:${selectedFoodbank.properties.telephone}`}
                            style={{ color: '#111827', textDecoration: 'none' }}
                          >
                            {selectedFoodbank.properties.telephone}
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.email && (
                      <div>
                        <div style={infoLabel}>Email</div>
                        <div style={infoValue}>
                          <a
                            href={`mailto:${selectedFoodbank.properties.email}`}
                            style={{ color: '#2563eb', fontWeight: 600 }}
                          >
                            {selectedFoodbank.properties.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.parliamentary_constituency && (
                      <div>
                        <div style={infoLabel}>Constituency</div>
                        <div style={infoValue}>
                          {selectedFoodbank.properties.parliamentary_constituency}
                        </div>
                      </div>
                    )}

                    {selectedFoodbank.properties?.url && (
                      <div style={{ marginTop: '4px' }}>
                        <a
                          href={selectedFoodbank.properties.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            color: '#2563eb',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          Open foodbank page
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 style={panelHeaderTitle}>Foodbank detail panel</h3>
                <p style={{ ...panelHeaderMeta, marginBottom: '18px' }}>
                  Select a marker on the map to inspect donation information.
                </p>

                <div className="explore-list-card" style={{ ...opportunityCard, marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, marginBottom: '8px', color: '#1f2937' }}>
                    What appears here?
                  </div>
                  <p style={cardText}>
                    Organisation, network, address, telephone, email, and website link.
                  </p>
                </div>

                <div className="explore-list-card" style={opportunityCard}>
                  <div style={{ fontWeight: 800, marginBottom: '8px', color: '#1f2937' }}>
                    How to use it
                  </div>
                  <p style={cardText}>
                    Compare options in the map first, then open the right-hand card to review
                    practical details before making contact.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageShell}>
      <section
        className="explore-hero-image"
        style={{
          ...whiteCard,
          marginBottom: '28px',
          padding: '34px 36px',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '465px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {heroPills.map((pill) => (
              <div key={pill} className="explore-hero-pill" style={smallTag}>
                {pill}
              </div>
            ))}
          </div>

          <h1
            style={{
              margin: '0 0 18px 0',
              fontSize: 'clamp(42px, 5vw, 70px)',
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: '-0.045em',
              color: '#fff',
              maxWidth: '760px',
            }}
          >
            {heroTitle}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.92)',
              maxWidth: '760px',
            }}
          >
            {heroSubtitle}
          </p>
        </div>

        <div
          className="explore-hero-panel"
          style={{
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 800, letterSpacing: '1.6px' }}>
            WHAT YOU CAN DO HERE
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            {heroPanelItems.map((item) => (
              <div
                key={item}
                className="subitem"
                style={{ padding: '16px 18px', fontSize: '15px', lineHeight: 1.55 }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {renderTopModules()}

      <div className="explore-main-grid">
        <div className="explore-filter-panel">
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

        <div className="explore-map-panel">
          <div ref={mapSectionRef} style={{ position: 'relative', height: '100%' }}>
            <PlotMap
              plots={filteredPlots}
              allotmentOpportunityCount={allotmentOpportunityCount}
              selectedAllotmentId={selectedAllotmentId}
              onSelectAllotment={handleSelectAllotment}
              userCoords={userCoords}
              radiusKm={radiusKm}
            />

            {loading && (
              <div className="map-loading-overlay" aria-live="polite" aria-busy="true">
                <div className="map-loading-card">
                  <div className="map-loading-title">Map data is loading…</div>
                  <div className="map-loading-track" role="progressbar" aria-valuetext="Loading map data">
                    <div className="map-loading-indicator" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="explore-detail-panel">
          {selectedAllotmentId ? (
            <>
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #eef2f7', marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={panelHeaderTitle}>
                      {selectedAllotmentDisplayName ?? selectedAllotmentId}
                    </h3>
                    <p style={panelHeaderMeta}>
                      {selectedAllotmentPlots.length} relevant plot
                      {selectedAllotmentPlots.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectAllotment(null)}
                    style={closeBtn}
                    aria-label="Close panel"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
                {selectedAllotmentPlots.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    No plots in this allotment match the current filters.
                  </p>
                ) : mode === 'participate' ? (
                  renderParticipatePanel()
                ) : (
                  renderFoodPanel()
                )}
              </div>
            </>
          ) : (
            <>
              <h3 style={panelHeaderTitle}>
                {mode === 'participate'
                  ? 'Opportunity detail panel'
                  : 'Produce detail panel'}
              </h3>
              <p style={{ ...panelHeaderMeta, marginBottom: '18px' }}>
                {mode === 'participate'
                  ? 'Select an allotment on the map to review volunteering, collaboration, or workshop opportunities.'
                  : 'Select an allotment on the map to review produce tags and availability mode.'}
              </p>

              <div className="explore-list-card" style={{ ...opportunityCard, marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, marginBottom: '8px', color: '#1f2937' }}>
                  What appears here?
                </div>
                <p style={cardText}>
                  {mode === 'participate'
                    ? 'Opportunity cards with dates, experience, commitment, and owner contact details.'
                    : 'Plot-level produce cards with tags and whether drop-off or collection is available.'}
                </p>
              </div>

              <div className="explore-list-card" style={opportunityCard}>
                <div style={{ fontWeight: 800, marginBottom: '8px', color: '#1f2937' }}>
                  Suggested interaction
                </div>
                <p style={cardText}>
                  Start from the filter panel, compare matches in the map, then inspect this
                  right-hand panel for details before deciding what to do next.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {signupMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#065f46',
            color: 'white',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            lineHeight: 1.5,
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            zIndex: 9999,
            maxWidth: '520px',
            textAlign: 'center',
          }}
        >
          ✓ {signupMessage}
        </div>
      )}
    </div>
  )
}
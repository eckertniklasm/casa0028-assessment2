import { useState } from 'react'

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

type Props = {
  mode: string
  // Food mode
  cropOptions: string[]
  selectedCrop: string
  onCropChange: (value: string) => void
  selectedDonationType: string
  onDonationTypeChange: (value: string) => void
  // Participate mode
  participateFilters: ParticipateFilters
  onParticipateFilterChange: (key: string, value: string) => void
  // Location filter (all modes)
  postcode: string
  onPostcodeChange: (value: string) => void
  onPostcodeSearch: () => void
  postcodeError: string | null
  userCoords: { lat: number; lng: number } | null
  onClearLocation: () => void
  radiusKm: number
  onRadiusChange: (value: number) => void
}

const label: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '13px',
  marginBottom: '6px',
  color: '#374151',
}

const sel: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  background: 'white',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  fontFamily: 'inherit',
}

const section: React.CSSProperties = { marginTop: '18px' }

export default function FilterPanel({
  mode,
  cropOptions,
  selectedCrop,
  onCropChange,
  selectedDonationType,
  onDonationTypeChange,
  participateFilters,
  onParticipateFilterChange,
  postcode,
  onPostcodeChange,
  onPostcodeSearch,
  postcodeError,
  userCoords,
  onClearLocation,
  radiusKm,
  onRadiusChange,
}: Props) {
  const [locationMode, setLocationMode] = useState<'anywhere' | 'close'>('anywhere')

  const handleLocationModeChange = (mode: 'anywhere' | 'close') => {
    setLocationMode(mode)
    if (mode === 'anywhere') onClearLocation()
  }

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      onParticipateFilterChange(key, e.target.value)

  const { opportunityType } = participateFilters
  const showDayTime    = opportunityType !== 'Volunteering'
  const showCommitment = opportunityType === 'Any' || opportunityType === 'Volunteering'
  const showKids       = opportunityType === 'Any' || opportunityType === 'Workshops'

  return (
    <div
      style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #ddd',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 4px 0' }}>Filters</h3>

      {/* ── LOCATION (all modes) ── */}
      <div style={section}>
        <label style={label}>Where are you looking for opportunities?</label>
        <select
          style={sel}
          value={locationMode}
          onChange={(e) => handleLocationModeChange(e.target.value as 'anywhere' | 'close')}
        >
          <option value="anywhere">Anywhere!</option>
          <option value="close">Close to me</option>
        </select>
      </div>

      {locationMode === 'close' && (
        <>
          <div style={section}>
            <label style={label}>Enter a postcode</label>
            {userCoords ? (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#15803d' }}>📍 {postcode.toUpperCase()}</span>
                <button
                  onClick={onClearLocation}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}
                >
                  ✕ Clear
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. SW1A 1AA"
                    style={{ ...inp, flex: 1, textTransform: 'uppercase' }}
                    value={postcode}
                    onChange={(e) => onPostcodeChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onPostcodeSearch()}
                  />
                  <button
                    onClick={onPostcodeSearch}
                    style={{
                      background: '#1f4d45',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Search
                  </button>
                </div>
                {postcodeError && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626' }}>
                    {postcodeError}
                  </p>
                )}
              </>
            )}
          </div>

          <div style={section}>
            <label style={label}>
              How far are you willing to travel? <strong>{radiusKm} km</strong>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={radiusKm}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1f4d45' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              <span>1 km</span>
              <span>15 km</span>
            </div>
          </div>
        </>
      )}

      {/* ── PARTICIPATE ── */}
      {mode === 'participate' && (
        <>
          <div style={section}>
            <label style={label}>What opportunity are you looking for?</label>
            <select style={sel} value={opportunityType} onChange={set('opportunityType')}>
              <option value="Any">Any</option>
              <option value="Volunteering">Volunteering</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Workshops">Workshops</option>
            </select>
          </div>

          <div style={section}>
            <label style={label}>What dates are you available?</label>
            <input
              type="date"
              style={{ ...inp, marginBottom: '6px' }}
              value={participateFilters.startDate}
              onChange={set('startDate')}
            />
            <input
              type="date"
              style={inp}
              value={participateFilters.endDate}
              onChange={set('endDate')}
            />
          </div>

          {showDayTime && (
            <div style={section}>
              <label style={label}>What days are you available?</label>
              <select style={sel} value={participateFilters.day} onChange={set('day')}>
                <option value="Any">Any</option>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {showDayTime && (
            <div style={section}>
              <label style={label}>What times are you available?</label>
              <select style={sel} value={participateFilters.time} onChange={set('time')}>
                <option value="Any">Anytime</option>
                <option value="Morning">Morning (6AM – 11AM)</option>
                <option value="Midday">Midday (11AM – 2PM)</option>
                <option value="Afternoon">Afternoon (2PM – 5PM)</option>
                <option value="Evening">Evening (5PM – 9PM)</option>
              </select>
            </div>
          )}

          <div style={section}>
            <label style={label}>What is your experience level?</label>
            <select style={sel} value={participateFilters.experience} onChange={set('experience')}>
              <option value="Any">Any</option>
              <option value="1">Completely new</option>
              <option value="2">Beginner</option>
              <option value="3">Intermediate</option>
              <option value="4">Experienced</option>
            </select>
          </div>

          {showCommitment && (
            <div style={section}>
              <label style={label}>How much time can you commit?</label>
              <select style={sel} value={participateFilters.commitment} onChange={set('commitment')}>
                <option value="Any">Any</option>
                <option value="1">Light</option>
                <option value="2">Moderate</option>
                <option value="3">Regular</option>
                <option value="4">Intensive</option>
              </select>
            </div>
          )}

          {showKids && (
            <div style={section}>
              <label style={label}>Kids welcome?</label>
              <select style={sel} value={participateFilters.kidsAllowed} onChange={set('kidsAllowed')}>
                <option value="Any">Any</option>
                <option value="Yes">Yes – kids welcome</option>
                <option value="No">No – adults only</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* ── FOOD (receive only) ── */}
      {mode === 'receive' && (
        <>
          <div style={section}>
            <label style={label}>Crop type</label>
            <select
              style={sel}
              value={selectedCrop}
              onChange={(e) => onCropChange(e.target.value)}
            >
              <option value="All">All</option>
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          <div style={section}>
            <label style={label}>Donation type</label>
            <select
              style={sel}
              value={selectedDonationType}
              onChange={(e) => onDonationTypeChange(e.target.value)}
            >
              <option value="All">All</option>
              <option value="dropoff">Drop-off available</option>
              <option value="collection">Collection only</option>
            </select>
          </div>
        </>
      )}

      {mode === 'donate' && (
        <div style={{ ...section, fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
          Browse nearby foodbanks and use the location filter to narrow the map.
        </div>
      )}
    </div>
  )
}

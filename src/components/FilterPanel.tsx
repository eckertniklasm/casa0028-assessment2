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
  cropOptions: string[]
  selectedCrop: string
  onCropChange: (value: string) => void
  selectedDonationType: string
  onDonationTypeChange: (value: string) => void
  participateFilters: ParticipateFilters
  onParticipateFilterChange: (key: string, value: string) => void
  postcode: string
  onPostcodeChange: (value: string) => void
  onPostcodeSearch: () => void
  postcodeError: string | null
  userCoords: { lat: number; lng: number } | null
  onClearLocation: () => void
  radiusKm: number
  onRadiusChange: (value: number) => void
}

const panelStyle: React.CSSProperties = {
  background: 'white',
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  overflowY: 'auto',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '18px',
  fontWeight: 700,
  color: '#1f2937',
}

const subtitleStyle: React.CSSProperties = {
  margin: '0 0 18px 0',
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: 1.55,
}

const groupTitle: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#6b7280',
}

const label: React.CSSProperties = {
  display: 'block',
  fontWeight: 700,
  fontSize: '13px',
  marginBottom: '7px',
  color: '#374151',
}

const sel: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  background: 'white',
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: '#111827',
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  fontFamily: 'inherit',
  color: '#111827',
}

const section: React.CSSProperties = { marginTop: '16px' }

const divider: React.CSSProperties = {
  height: '1px',
  background: '#eef2f7',
  margin: '18px 0 6px',
}

const helperPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderRadius: '999px',
  background: '#ecfdf5',
  color: '#166534',
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: '12px',
}

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
  const showDayTime = opportunityType !== 'Volunteering'
  const showCommitment = opportunityType === 'Any' || opportunityType === 'Volunteering'
  const showKids = opportunityType === 'Any' || opportunityType === 'Workshops'

  const modeLabel =
    mode === 'participate'
      ? 'Participate'
      : mode === 'receive'
      ? 'Receive food'
      : 'Donate food'

  const modeHelper =
    mode === 'participate'
      ? 'Find opportunities by area, availability, and experience.'
      : mode === 'receive'
      ? 'Refine results by crop, donation type, and distance.'
      : 'Use the location filter to find nearby foodbanks.'

  return (
    <div style={panelStyle}>
      <div style={helperPill}>{modeLabel}</div>
      <h3 style={titleStyle}>Refine results</h3>
      <p style={subtitleStyle}>{modeHelper}</p>

      <div style={groupTitle}>Location</div>

      <div style={section}>
        <label style={label}>Search area</label>
        <select
          style={sel}
          value={locationMode}
          onChange={(e) => handleLocationModeChange(e.target.value as 'anywhere' | 'close')}
        >
          <option value="anywhere">Anywhere</option>
          <option value="close">Close to me</option>
        </select>
      </div>

      {locationMode === 'close' && (
        <>
          <div style={section}>
            <label style={label}>Postcode</label>
            {userCoords ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: '#15803d', fontWeight: 600 }}>
                  📍 {postcode.toUpperCase()}
                </span>
                <button
                  onClick={onClearLocation}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                      borderRadius: '10px',
                      padding: '0 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Search
                  </button>
                </div>
                {postcodeError && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#dc2626' }}>
                    {postcodeError}
                  </p>
                )}
              </>
            )}
          </div>

          <div style={section}>
            <label style={label}>
              Travel distance <strong>{radiusKm} km</strong>
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              <span>1 km</span>
              <span>15 km</span>
            </div>
          </div>
        </>
      )}

      {mode === 'participate' && (
        <>
          <div style={divider} />
          <div style={groupTitle}>Opportunity</div>

          <div style={section}>
            <label style={label}>Type</label>
            <select style={sel} value={opportunityType} onChange={set('opportunityType')}>
              <option value="Any">Any</option>
              <option value="Volunteering">Volunteering</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Workshops">Workshops</option>
            </select>
          </div>

          <div style={section}>
            <label style={label}>Available dates</label>
            <input
              type="date"
              style={{ ...inp, marginBottom: '8px' }}
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
              <label style={label}>Available day</label>
              <select style={sel} value={participateFilters.day} onChange={set('day')}>
                <option value="Any">Any</option>
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDayTime && (
            <div style={section}>
              <label style={label}>Available time</label>
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
            <label style={label}>Experience level</label>
            <select
              style={sel}
              value={participateFilters.experience}
              onChange={set('experience')}
            >
              <option value="Any">Any</option>
              <option value="1">Completely new</option>
              <option value="2">Beginner</option>
              <option value="3">Intermediate</option>
              <option value="4">Experienced</option>
            </select>
          </div>

          {showCommitment && (
            <div style={section}>
              <label style={label}>Commitment</label>
              <select
                style={sel}
                value={participateFilters.commitment}
                onChange={set('commitment')}
              >
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
              <label style={label}>Kids welcome</label>
              <select
                style={sel}
                value={participateFilters.kidsAllowed}
                onChange={set('kidsAllowed')}
              >
                <option value="Any">Any</option>
                <option value="Yes">Yes – kids welcome</option>
                <option value="No">No – adults only</option>
              </select>
            </div>
          )}
        </>
      )}

      {mode === 'receive' && (
        <>
          <div style={divider} />
          <div style={groupTitle}>Produce</div>

          <div style={section}>
            <label style={label}>Crop type</label>
            <select
              style={sel}
              value={selectedCrop}
              onChange={(e) => onCropChange(e.target.value)}
            >
              <option value="All">All</option>
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
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
        <>
          <div style={divider} />
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginTop: '14px' }}>
            Browse nearby foodbanks and use the location filter to narrow the map.
          </div>
        </>
      )}
    </div>
  )
}
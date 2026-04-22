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
}: Props) {
  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      onParticipateFilterChange(key, e.target.value)

  const { opportunityType } = participateFilters
  const showDayTime   = opportunityType !== 'Volunteering'
  const showCommitment = opportunityType === 'Any' || opportunityType === 'Volunteering'
  const showKids      = opportunityType === 'Any' || opportunityType === 'Workshops'

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

      {/* ── FOOD (donate / receive) ── */}
      {(mode === 'donate' || mode === 'receive') && (
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
    </div>
  )
}

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

type Props = {
  mode: string
  selectedPlot: Plot | null
  // Food mode
  selectedCrops: CropRecord | null
  // Participate mode
  selectedAwayFilter: AwayFilterRecord | null
  selectedAwayDetails: AwayDetailsRecord | null
  selectedCollabFilter: CollabFilterRecord | null
  selectedCollabDetails: CollabDetailsRecord | null
  selectedWorkshopFilter: WorkshopFilterRecord | null
  selectedWorkshopDetails: WorkshopDetailsRecord | null
}

const EXPERIENCE: Record<number, string> = {
  1: 'Completely new', 2: 'Beginner', 3: 'Intermediate', 4: 'Experienced',
}

const COMMITMENT: Record<number, string> = {
  1: 'Light', 2: 'Moderate', 3: 'Regular', 4: 'Intensive',
}

const card: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '10px',
  marginBottom: '10px',
  background: '#fafafa',
}

export default function DetailPanel({
  mode,
  selectedPlot,
  selectedCrops,
  selectedAwayFilter,
  selectedAwayDetails,
  selectedCollabFilter,
  selectedCollabDetails,
  selectedWorkshopFilter,
  selectedWorkshopDetails,
}: Props) {
  return (
    <div
      style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #ddd',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3>Detail Panel</h3>

      <div style={{ marginTop: '16px', overflowY: 'auto', minHeight: 0, flex: 1 }}>
        {!selectedPlot ? (
          <p>Select an allotment polygon to inspect its plots.</p>
        ) : (
          <div>
            <p><strong>Plot ID:</strong> {selectedPlot.plot_id}</p>
            <p><strong>Owner:</strong> {selectedPlot.owner_name}</p>
            <p><strong>Email:</strong> {selectedPlot.owner_email}</p>

            {/* ── FOOD MODE ── */}
            {(mode === 'donate' || mode === 'receive') && (
              <>
                <p><strong>Donate:</strong> {selectedPlot.willing_to_donate ? 'Yes' : 'No'}</p>
                <p><strong>Drop-off:</strong> {selectedPlot.willing_dropoff ? 'Yes' : 'No'}</p>
                <p><strong>Max travel (km):</strong> {selectedPlot.max_travel_km ?? 'N/A'}</p>
                <p><strong>Max travel (min):</strong> {selectedPlot.max_travel_min ?? 'N/A'}</p>

                <div style={{ marginTop: '20px' }}>
                  <h4>Crops</h4>
                  {!selectedCrops || selectedCrops.crops.length === 0 ? (
                    <p>No crop data available for this plot.</p>
                  ) : (
                    selectedCrops.crops.map((c, i) => (
                      <div key={i} style={card}>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Crop:</strong> {c.crop}</p>
                        <p style={{ margin: 0 }}><strong>Seasons:</strong> {c.seasons}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── PARTICIPATE MODE ── */}
            {mode === 'participate' && (
              <>
                {/* Away */}
                {selectedAwayFilter && selectedAwayFilter.away_periods.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Away Help Needed</h4>
                    <p style={{ margin: '0 0 8px 0' }}>
                      {selectedAwayDetails?.help_description ?? 'No description available.'}
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>Experience required:</strong>{' '}
                      {EXPERIENCE[selectedAwayFilter.experience_level] ?? selectedAwayFilter.experience_level}
                    </p>
                    <p style={{ margin: '0 0 12px 0' }}>
                      <strong>Commitment level:</strong>{' '}
                      {COMMITMENT[selectedAwayFilter.commitment_level] ?? selectedAwayFilter.commitment_level}
                    </p>
                    {selectedAwayFilter.away_periods.map((p, i) => (
                      <div key={i} style={card}>
                        <p style={{ margin: '0 0 6px 0' }}><strong>From:</strong> {p.start_date}</p>
                        <p style={{ margin: 0 }}><strong>To:</strong> {p.end_date}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collaboration */}
                {selectedCollabFilter && selectedCollabFilter.collaboration_slots.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Collaboration Slots</h4>
                    <p style={{ margin: '0 0 12px 0' }}>
                      <strong>Experience required:</strong>{' '}
                      {EXPERIENCE[selectedCollabFilter.experience_level] ?? selectedCollabFilter.experience_level}
                    </p>
                    {selectedCollabFilter.collaboration_slots.map((slot, i) => (
                      <div key={i} style={card}>
                        <p style={{ margin: '0 0 6px 0' }}>
                          {selectedCollabDetails?.collaboration_slots[i]?.description ?? ''}
                        </p>
                        <p style={{ margin: '0 0 6px 0' }}>
                          <strong>{slot.day_of_week}</strong> · {slot.start_time}–{slot.end_time}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                          Available {slot.valid_from} to {slot.valid_to}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Workshops */}
                {selectedWorkshopFilter && selectedWorkshopFilter.workshops.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Workshops</h4>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>Experience required:</strong>{' '}
                      {EXPERIENCE[selectedWorkshopFilter.experience_level] ?? selectedWorkshopFilter.experience_level}
                    </p>
                    <p style={{ margin: '0 0 12px 0' }}>
                      <strong>Kids welcome:</strong>{' '}
                      {selectedWorkshopFilter.kids_allowed ? 'Yes' : 'No'}
                    </p>
                    {selectedWorkshopFilter.workshops.map((w, i) => {
                      const detail = selectedWorkshopDetails?.workshops.find(
                        (d) => d.workshop_date === w.workshop_date
                      )
                      return (
                        <div key={i} style={card}>
                          <p style={{ margin: '0 0 6px 0' }}>
                            {detail?.description ?? ''}
                          </p>
                          <p style={{ margin: '0 0 6px 0' }}>
                            <strong>{w.workshop_date}</strong> · {w.start_time}–{w.end_time}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            Max attendees: {w.max_attendees}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Fallback if selected plot has no opportunity data */}
                {!selectedAwayFilter &&
                  !selectedCollabFilter &&
                  !selectedWorkshopFilter && (
                    <p style={{ marginTop: '20px', color: '#6b7280' }}>
                      No participation opportunities found for this plot.
                    </p>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

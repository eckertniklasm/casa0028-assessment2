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

type Props = {
  mode: string
  selectedAllotmentId: string | null
  selectedPlot: Plot | null
  selectedCrops: CropRecord | null
  selectedAway: AwayRecord | null
  selectedCollaboration: CollaborationRecord | null
  selectedWorkshops: WorkshopRecord | null
}

export default function DetailPanel({
  mode,
  selectedAllotmentId,
  selectedPlot,
  selectedCrops,
  selectedAway,
  selectedCollaboration,
  selectedWorkshops,
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
      {/* <p><strong>Current mode:</strong> {mode}</p>
      <p>
        <strong>Selected allotment:</strong> {selectedAllotmentId || 'None'}
      </p> */}

      <div style={{ marginTop: '16px', overflowY: 'auto', minHeight: 0, flex: 1 }}>
        {!selectedPlot ? (
          <p>Select an allotment polygon to inspect its plots.</p>
        ) : (
          <div>
          <p><strong>Plot ID:</strong> {selectedPlot.plot_id}</p>
          <p><strong>Owner:</strong> {selectedPlot.owner_name}</p>
          <p><strong>Email:</strong> {selectedPlot.owner_email}</p>
          <p><strong>Donate:</strong> {selectedPlot.willing_to_donate ? 'Yes' : 'No'}</p>
          <p><strong>Drop-off:</strong> {selectedPlot.willing_dropoff ? 'Yes' : 'No'}</p>
          <p><strong>Max travel (km):</strong> {selectedPlot.max_travel_km ?? 'N/A'}</p>
          <p><strong>Max travel (min):</strong> {selectedPlot.max_travel_min ?? 'N/A'}</p>

          {/* <div style={{ marginTop: '20px' }}>
            <h4>Plots in this allotment</h4>

            {selectedAllotmentPlots.length === 0 ? (
              <p>No plots in this allotment match the current filters.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {selectedAllotmentPlots.map((plot) => (
                  <li key={plot.plot_id}>{plot.plot_id}</li>
                ))}
              </ul>
            )}
          </div> */}

          {mode === 'food' && (
            <div style={{ marginTop: '20px' }}>
              <h4>Crops</h4>

              {!selectedCrops || !selectedCrops.crops || selectedCrops.crops.length === 0 ? (
                <p>No crop data available for this plot.</p>
              ) : (
                selectedCrops.crops.map((cropItem, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '10px',
                      background: '#fafafa',
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Crop:</strong> {cropItem.crop}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Seasons:</strong> {cropItem.seasons}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {mode === 'volunteer' && (
            <div style={{ marginTop: '20px' }}>
              <h4>Away Help Needed</h4>

              {!selectedAway || !selectedAway.away_periods || selectedAway.away_periods.length === 0 ? (
                <p>No away-period volunteer data available for this plot.</p>
              ) : (
                selectedAway.away_periods.map((period, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '10px',
                      background: '#fafafa',
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Start:</strong> {period.start_date}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>End:</strong> {period.end_date}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Help needed:</strong> {period.help_description}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Skills:</strong> {period.skills_needed || 'None specified'}
                    </p>
                  </div>
                ))
              )}

              <div style={{ marginTop: '20px' }}>
                <h4>Collaboration Slots</h4>

                {!selectedCollaboration ||
                !selectedCollaboration.collaboration_slots ||
                selectedCollaboration.collaboration_slots.length === 0 ? (
                  <p>No collaboration data available for this plot.</p>
                ) : (
                  selectedCollaboration.collaboration_slots.map((slot, index) => (
                    <div
                      key={index}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '10px',
                        background: '#fafafa',
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Day:</strong> {slot.day_of_week}
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Time:</strong> {slot.start_time} - {slot.end_time}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Description:</strong> {slot.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4>Workshops</h4>

                {!selectedWorkshops ||
                !selectedWorkshops.workshops ||
                selectedWorkshops.workshops.length === 0 ? (
                  <p>No workshop data available for this plot.</p>
                ) : (
                  selectedWorkshops.workshops.map((workshop, index) => (
                    <div
                      key={index}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '10px',
                        background: '#fafafa',
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Date:</strong> {workshop.workshop_date}
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Time:</strong> {workshop.start_time} - {workshop.end_time}
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Description:</strong> {workshop.description}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Max attendees:</strong> {workshop.max_attendees}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}
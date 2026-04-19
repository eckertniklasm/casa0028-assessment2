type Plot = {
  plot_id: string
  owner_name: string
  owner_email: string
  willing_to_donate: boolean
  willing_dropoff: boolean
  max_travel_km: number | null
  max_travel_min: number | null
}

type Props = {
  mode: string
  selectedPlot: Plot | null
}

export default function DetailPanel({ mode, selectedPlot }: Props) {
  return (
    <div
      style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #ddd',
        minHeight: '420px',
      }}
    >
      <h3>Detail Panel</h3>
      <p><strong>Current mode:</strong> {mode}</p>

      {!selectedPlot ? (
        <p>No plot selected yet.</p>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <p><strong>Plot ID:</strong> {selectedPlot.plot_id}</p>
          <p><strong>Owner:</strong> {selectedPlot.owner_name}</p>
          <p><strong>Email:</strong> {selectedPlot.owner_email}</p>
          <p><strong>Donate:</strong> {selectedPlot.willing_to_donate ? 'Yes' : 'No'}</p>
          <p><strong>Drop-off:</strong> {selectedPlot.willing_dropoff ? 'Yes' : 'No'}</p>
          <p><strong>Max travel (km):</strong> {selectedPlot.max_travel_km ?? 'N/A'}</p>
          <p><strong>Max travel (min):</strong> {selectedPlot.max_travel_min ?? 'N/A'}</p>
        </div>
      )}
    </div>
  )
}
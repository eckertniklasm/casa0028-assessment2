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
  plots: Plot[]
  onSelectPlot: (plot: Plot) => void
}

export default function PlotList({ plots, onSelectPlot }: Props) {
  if (plots.length === 0) {
    return <p>No plot data loaded yet.</p>
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Sample Plot Data</h3>
      <p>Number of records: {plots.length}</p>

      {plots.slice(0, 5).map((plot) => (
        <div
          key={plot.plot_id}
          onClick={() => onSelectPlot(plot)}
          style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px',
            background: '#fafafa',
            cursor: 'pointer',
          }}
        >
          <p><strong>Plot ID:</strong> {plot.plot_id}</p>
          <p><strong>Owner:</strong> {plot.owner_name}</p>
          <p><strong>Email:</strong> {plot.owner_email}</p>
          <p><strong>Donate:</strong> {plot.willing_to_donate ? 'Yes' : 'No'}</p>
          <p><strong>Drop-off:</strong> {plot.willing_dropoff ? 'Yes' : 'No'}</p>
          <p><strong>Max travel (km):</strong> {plot.max_travel_km ?? 'N/A'}</p>
          <p><strong>Max travel (min):</strong> {plot.max_travel_min ?? 'N/A'}</p>
        </div>
      ))}
    </div>
  )
}
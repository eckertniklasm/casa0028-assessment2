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
  selectedPlotId: string | null
  onSelectPlot: (plot: Plot) => void
}

export default function PlotList({ plots, selectedPlotId, onSelectPlot }: Props) {
  if (plots.length === 0) {
    return <p>No plot data loaded yet.</p>
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Sample Plot Data</h3>
      <p>Number of records: {plots.length}</p>

      {plots.slice(0, 5).map((plot) => {
        const isSelected = plot.plot_id === selectedPlotId

        return (
          <div
            key={plot.plot_id}
            onClick={() => onSelectPlot(plot)}
            style={{
              border: isSelected ? '2px solid #1f4d45' : '1px solid #ddd',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '12px',
              background: isSelected ? '#eef6f4' : '#fafafa',
              cursor: 'pointer',
            }}
          >
            <p><strong>Plot ID:</strong> {plot.plot_id}</p>
            <p><strong>Owner:</strong> {plot.owner_name}</p>
            <p><strong>Donate:</strong> {plot.willing_to_donate ? 'Yes' : 'No'}</p>
            <p><strong>Drop-off:</strong> {plot.willing_dropoff ? 'Yes' : 'No'}</p>
          </div>
        )
      })}
    </div>
  )
}
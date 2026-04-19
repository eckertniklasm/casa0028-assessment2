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

type Props = {
  mode: string
  selectedPlot: Plot | null
  selectedCrops: CropRecord | null
}

export default function DetailPanel({ mode, selectedPlot, selectedCrops }: Props) {
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
        </div>
      )}
    </div>
  )
}
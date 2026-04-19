type Props = {
  mode: string
}

export default function FilterPanel({ mode }: Props) {
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
      <h3>Filters</h3>

      {mode === 'owner' && (
        <>
          <p><strong>Mode:</strong> owner</p>
          <label>Owner action</label>
          <select style={{ display: 'block', marginTop: '8px', width: '100%' }}>
            <option>Donate food</option>
            <option>Find volunteers</option>
          </select>
        </>
      )}

      {mode === 'volunteer' && (
        <>
          <p><strong>Mode:</strong> volunteer</p>
          <label>Opportunity type</label>
          <select style={{ display: 'block', marginTop: '8px', width: '100%' }}>
            <option>All</option>
            <option>Away help</option>
            <option>Collaboration</option>
            <option>Workshop</option>
          </select>
        </>
      )}

      {mode === 'food' && (
        <>
          <p><strong>Mode:</strong> food</p>
          <label>Crop type</label>
          <select style={{ display: 'block', marginTop: '8px', width: '100%' }}>
            <option>All</option>
            <option>Tomato</option>
            <option>Courgette</option>
            <option>Potato</option>
          </select>

          <label style={{ display: 'block', marginTop: '16px' }}>Donation type</label>
          <select style={{ display: 'block', marginTop: '8px', width: '100%' }}>
            <option>All</option>
            <option>Drop-off available</option>
            <option>Collection only</option>
          </select>
        </>
      )}
    </div>
  )
}
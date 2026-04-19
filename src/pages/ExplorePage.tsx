import { useState } from 'react'
import ModeSwitcher from '../components/ModeSwitcher'

export default function ExplorePage() {
  const [mode, setMode] = useState('food')

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>Explore</h1>
      <p>This is the main platform page for browsing plots and opportunities.</p>

      <ModeSwitcher mode={mode} setMode={setMode} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: '16px',
          marginTop: '24px',
        }}
      >
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
          <p><strong>Current mode:</strong> {mode}</p>
        </div>

        <div
          style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            minHeight: '420px',
          }}
        >
          <h3>Map Area</h3>
          <p>The interactive map will go here.</p>
          <p><strong>Current mode:</strong> {mode}</p>
        </div>

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
          <p>Selected plot details will appear here.</p>
          <p><strong>Current mode:</strong> {mode}</p>
        </div>
      </div>
    </div>
  )
}
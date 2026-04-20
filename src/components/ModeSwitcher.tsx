type Props = {
  mode: string
  setMode: (mode: string) => void
}

export default function ModeSwitcher({ mode, setMode }: Props) {
  return (
    <div style={{ display: 'flex', gap: '12px', margin: '20px 0', alignItems: 'center' }}>
      <button
        onClick={() => setMode('owner')}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: mode === 'owner' ? '#1f4d45' : 'white',
          color: mode === 'owner' ? 'white' : 'black',
          cursor: 'pointer',
        }}
      >
        Owner
      </button>

      <button
        onClick={() => setMode('volunteer')}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: mode === 'volunteer' ? '#1f4d45' : 'white',
          color: mode === 'volunteer' ? 'white' : 'black',
          cursor: 'pointer',
        }}
      >
        Volunteer
      </button>

      <button
        onClick={() => setMode('food')}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: mode === 'food' ? '#1f4d45' : 'white',
          color: mode === 'food' ? 'white' : 'black',
          cursor: 'pointer',
        }}
      >
        Food
      </button>

      <span style={{ marginLeft: '12px' }}>
        Current mode: <strong>{mode}</strong>
      </span>
    </div>
  )
}
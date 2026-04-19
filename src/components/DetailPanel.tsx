type Props = {
  mode: string
}

export default function DetailPanel({ mode }: Props) {
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
      <p>Selected plot details will appear here.</p>
      <p><strong>Current mode:</strong> {mode}</p>
    </div>
  )
}
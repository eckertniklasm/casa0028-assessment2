type Props = {
  onStart: () => void
}

export default function HomePage({ onStart }: Props) {
  return (
    <section style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>Glut London</h1>
      <p>
        A spatial prototype connecting allotment plot owners, volunteers,
        and people looking for excess food.
      </p>

      <div style={{ display: 'grid', gap: '12px', margin: '24px 0' }}>
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Plot Owners</h3>
          <p>Donate food, ask for volunteers, and share opportunities.</p>
        </div>

        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Volunteers</h3>
          <p>Find plots that need help, collaboration, or workshop support.</p>
        </div>

        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Excess Food Seekers</h3>
          <p>Browse plots with available produce and donation options.</p>
        </div>
      </div>

      <button onClick={onStart}>Explore the platform</button>
    </section>
  )
}
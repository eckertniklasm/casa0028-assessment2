export default function ExplorePage() {
  return (
    <section style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>Explore</h1>
      <p>This is the main platform page.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3>Filters</h3>
          <p>User mode, crop filters, and opportunity filters will go here.</p>
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
          <p>The map will go here.</p>
        </div>

        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3>Detail Panel</h3>
          <p>Selected plot information will go here.</p>
        </div>
      </div>
    </section>
  )
}
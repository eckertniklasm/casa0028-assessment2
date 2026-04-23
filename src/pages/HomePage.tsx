type Props = {
  navigate: (page: string) => void
}

const eyebrow: React.CSSProperties = {
  color: '#4a7c59',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  margin: '0 0 16px 0',
}

const heading: React.CSSProperties = {
  fontSize: 'clamp(22px, 2.5vw, 32px)',
  lineHeight: 1.3,
  color: '#1f2937',
  fontWeight: 700,
  margin: '0 0 28px 0',
}

const img: React.CSSProperties = {
  width: '100%',
  height: '420px',
  objectFit: 'cover',
  borderRadius: '12px',
  display: 'block',
}

const btn: React.CSSProperties = {
  background: '#1f4d45',
  color: 'white',
  border: 'none',
  padding: '14px 28px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
}

const twoCol: React.CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '0 40px',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '64px',
  alignItems: 'center',
}

export default function HomePage({ navigate }: Props) {
  const base = import.meta.env.BASE_URL

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          height: '82vh',
          minHeight: '480px',
          backgroundImage: `url(${base}images/main_image.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 30, 20, 0.55)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '0 32px',
            maxWidth: '820px',
          }}
        >
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(28px, 4.5vw, 54px)',
              lineHeight: 1.15,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Making London's Allotments a Shared Space and Resource for Everyone
          </h1>
        </div>
      </section>

      {/* Section 1 – Participate */}
      <section style={{ padding: '88px 0', background: 'white' }}>
        <div style={twoCol}>
          <img
            src={`${base}images/workshop.jpg`}
            alt="Allotment workshop"
            style={img}
          />
          <div>
            <p style={eyebrow}>Participate</p>
            <h2 style={heading}>
              Over 30,000 residents are on the waiting list to get one of
              London's Allotment plots, but there are other ways you can get
              involved!
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 36px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {[
                'Looking for an easy way to participate in community food growing?',
                "Wanting to look after someone's allotment while they are away?",
                'Looking to take part in workshops hosted by allotment plot owners?',
              ].map((q) => (
                <li
                  key={q}
                  style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}
                >
                  {q}
                </li>
              ))}
            </ul>
            <button style={btn} onClick={() => navigate('participate')}>
              Participate →
            </button>
          </div>
        </div>
      </section>

      {/* Section 2 – Donate Food */}
      <section style={{ padding: '88px 0', background: '#f0f5f1' }}>
        <div style={twoCol}>
          <div>
            <p style={eyebrow}>Donate Food</p>
            <h2 style={heading}>
              Are you an allotment owner looking for close-by food banks to
              donate excess food?
            </h2>
            <button style={btn} onClick={() => navigate('donate')}>
              Donate Food →
            </button>
          </div>
          <img
            src={`${base}images/excess_food.webp`}
            alt="Excess allotment food"
            style={img}
          />
        </div>
      </section>

      {/* Section 3 – Receive Food */}
      <section style={{ padding: '88px 0', background: 'white' }}>
        <div style={twoCol}>
          <img
            src={`${base}images/excess_food.webp`}
            alt="Fresh allotment produce"
            style={img}
          />
          <div>
            <p style={eyebrow}>Receive Food</p>
            <h2 style={heading}>
              Are you looking for excess food from allotments?
            </h2>
            <button style={btn} onClick={() => navigate('receive')}>
              Receive Food →
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

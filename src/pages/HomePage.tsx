type Page = 'home' | 'participate' | 'donate' | 'receive'

type Props = {
  navigate: (page: Page) => void
}

const eyebrow: React.CSSProperties = {
  color: '#4a7c59',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  margin: '0 0 14px 0',
}

const heading: React.CSSProperties = {
  fontSize: 'clamp(26px, 2.8vw, 42px)',
  lineHeight: 1.2,
  color: '#1f2937',
  fontWeight: 700,
  margin: '0 0 18px 0',
}

const bodyText: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: 1.75,
  margin: '0 0 28px 0',
  maxWidth: '620px',
}

const img: React.CSSProperties = {
  width: '100%',
  height: '440px',
  objectFit: 'cover',
  borderRadius: '18px',
  display: 'block',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
}

const btn: React.CSSProperties = {
  background: '#1f4d45',
  color: 'white',
  border: 'none',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '1.4px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
  boxShadow: '0 8px 20px rgba(31, 77, 69, 0.20)',
}

const secondaryBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'white',
  border: '1.5px solid rgba(255,255,255,0.92)',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '1.4px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
}

const footerBtn: React.CSSProperties = {
  background: 'white',
  color: '#1f4d45',
  border: 'none',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '1.4px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
  boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
}

export default function HomePage({ navigate }: Props) {
  const base = import.meta.env.BASE_URL

  return (
    <div className="home-page-shell">
      <section
        className="home-hero"
        style={{
          backgroundImage: `url(${base}images/main_image.jpg)`,
        }}
      >
        <div className="home-hero-overlay" />
        <div className="home-hero-inner">
          <div className="home-hero-content">
            <p className="home-hero-kicker">
              Community food • local participation • shared resources
            </p>

            <h1 className="home-hero-title">
              Connect London’s allotments, volunteers, and local food sharing
            </h1>

            <p className="home-hero-subtitle">
              PlotShare is a spatial platform for discovering allotments,
              sharing surplus produce, finding nearby food support, and taking
              part in community growing opportunities across London.
            </p>

            <div className="home-hero-actions">
              <button
                className="home-cta-btn home-cta-btn--primary"
                style={btn}
                onClick={() => navigate('participate')}
              >
                Participate
              </button>
              <button
                className="home-cta-btn home-cta-btn--secondary"
                style={secondaryBtn}
                onClick={() => navigate('donate')}
              >
                Donate Food
              </button>
              <button
                className="home-cta-btn home-cta-btn--secondary"
                style={secondaryBtn}
                onClick={() => navigate('receive')}
              >
                Receive Food
              </button>
            </div>

            <div className="home-summary-grid">
              <div className="home-summary-card">
                <div className="home-summary-value">30,000+</div>
                <div className="home-summary-label">
                  residents on London allotment waiting lists
                </div>
              </div>

              <div className="home-summary-card">
                <div className="home-summary-value">3</div>
                <div className="home-summary-label">
                  ways to engage: participate, donate, or receive food
                </div>
              </div>

              <div className="home-summary-card">
                <div className="home-summary-value">Local</div>
                <div className="home-summary-label">
                  place-based discovery through the map platform
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section--white">
        <div className="home-two-col">
          <img
            src={`${base}images/workshop.jpg`}
            alt="People participating in an allotment workshop"
            style={img}
          />
          <div>
            <p style={eyebrow}>Participate</p>
            <h2 style={heading}>
              There are many ways to get involved in London’s allotment
              community, even without your own plot
            </h2>
            <p style={bodyText}>
              With long waiting lists across the city, participation in food
              growing can still happen through collaboration, temporary plot
              support, and community workshops.
            </p>
            <ul className="home-benefit-list">
              {[
                'Join community food growing opportunities near you',
                "Help care for someone’s allotment while they are away",
                'Take part in workshops hosted by local plot owners',
              ].map((q) => (
                <li key={q}>
                  <span className="home-check">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <button
              className="home-cta-btn home-cta-btn--primary"
              style={btn}
              onClick={() => navigate('participate')}
            >
              Participate →
            </button>
          </div>
        </div>
      </section>

      <section className="home-section home-section--tint">
        <div className="home-two-col">
          <div>
            <p style={eyebrow}>Donate Food</p>
            <h2 style={heading}>
              Do you have surplus produce from your allotment to donate?
            </h2>
            <p style={bodyText}>
              Find nearby food banks and local sharing opportunities for excess
              produce, and make it easier for fresh food to stay in the local
              community rather than going to waste.
            </p>
            <button
              className="home-cta-btn home-cta-btn--primary"
              style={btn}
              onClick={() => navigate('donate')}
            >
              Donate Food →
            </button>
          </div>
          <img
            src={`${base}images/excess_food.webp`}
            alt="Fresh produce available for donation"
            style={img}
          />
        </div>
      </section>

      <section className="home-section home-section--white">
        <div className="home-two-col">
          <img
            src={`${base}images/volunteering.jpg`}
            alt="Local community food sharing"
            style={img}
          />
          <div>
            <p style={eyebrow}>Receive Food</p>
            <h2 style={heading}>
              Looking for available excess food from allotments?
            </h2>
            <p style={bodyText}>
              Browse nearby produce-sharing opportunities and identify local
              routes for receiving fresh food from the allotment network.
            </p>
            <button
              className="home-cta-btn home-cta-btn--primary"
              style={btn}
              onClick={() => navigate('receive')}
            >
              Receive Food →
            </button>
          </div>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="home-final-cta-inner">
          <p className="home-final-cta-kicker">Explore the platform</p>
          <h2 className="home-final-cta-title">
            Join a more connected allotment community across London
          </h2>
          <p className="home-final-cta-text">
            Whether you want to participate, donate surplus produce, or receive
            food, PlotShare helps connect local opportunities through a shared
            spatial platform.
          </p>
          <button
            className="home-cta-btn home-cta-btn--footer"
            style={footerBtn}
            onClick={() => navigate('participate')}
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  )
}
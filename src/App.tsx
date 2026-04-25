import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'

type Page = 'home' | 'participate' | 'donate' | 'receive'

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Participate', page: 'participate' },
  { label: 'Donate Food', page: 'donate' },
  { label: 'Receive Food', page: 'receive' },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [pageKey, setPageKey] = useState(0)

  const navigate = (target: Page) => {
    setPage(target)
    setPageKey((k) => k + 1)

    const html = document.documentElement
    const previousScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    html.style.scrollBehavior = previousScrollBehavior
  }

  useEffect(() => {
    document.title =
      page === 'home'
        ? 'PlotShare'
        : page === 'participate'
        ? 'PlotShare | Participate'
        : page === 'donate'
        ? 'PlotShare | Donate Food'
        : 'PlotShare | Receive Food'
  }, [page])

  return (
    <div className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => navigate('home')}
            aria-label="Go to homepage"
          >
            PlotShare
          </button>

          <div className="nav" aria-label="Site sections">
            {NAV_LINKS.map(({ label, page: target }) => {
              const isActive = page === target

              return (
                <button
                  key={target}
                  type="button"
                  className={`nav-link${isActive ? ' active' : ''}`}
                  onClick={() => navigate(target)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-link-text">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <main>
        {page === 'home' ? (
          <HomePage key={pageKey} navigate={navigate} />
        ) : (
          <ExplorePage
            key={pageKey}
            mode={page as Exclude<Page, 'home'>}
          />
        )}
      </main>
    </div>
  )
}

export default App
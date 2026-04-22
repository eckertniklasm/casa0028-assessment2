import { useState } from 'react'
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

  const navigate = (target: string) => {
    setPage(target as Page)
    setPageKey((k) => k + 1)
  }

  return (
    <div className="app-shell">
      <nav className="topbar">
        <span className="brand" onClick={() => navigate('home')}>
          PlotShare
        </span>
        <div className="nav">
          {NAV_LINKS.map(({ label, page: target }) => (
            <button
              key={target}
              className={`nav-link${page === target ? ' active' : ''}`}
              onClick={() => navigate(target)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {page === 'home' && <HomePage key={pageKey} navigate={navigate} />}
      {page !== 'home' && (
        <ExplorePage
          key={pageKey}
          mode={page as 'participate' | 'donate' | 'receive'}
        />
      )}
    </div>
  )
}

export default App

import { useState } from 'react'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import AboutPage from './pages/AboutPage'

type Page = 'home' | 'explore' | 'about'

function App() {
  const [page, setPage] = useState<Page>('home')

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setPage('home')}>Home</button>
        <button onClick={() => setPage('explore')}>Explore</button>
        <button onClick={() => setPage('about')}>About</button>
      </div>

      {page === 'home' && <HomePage onStart={() => setPage('explore')} />}
      {page === 'explore' && <ExplorePage />}
      {page === 'about' && <AboutPage />}
    </div>
  )
}

export default App
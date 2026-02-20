import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BrandSelection from './pages/BrandSelection'
import ModelSelection from './pages/ModelSelection'
import RoutePlanner from './pages/RoutePlanner'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'
import { useStore } from './store/useStore'

// ✅ Use environment variable — create a .env file at project root:
//    VITE_API_URL=http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ─── Animated Loading Screen ────────────────────────────────── */
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Logo mark */}
      <div className="relative">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="#00D4AA"
            className="w-7 h-7"
          >
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
        </div>
        {/* Spinner ring */}
        <svg
          className="absolute -inset-2 animate-spin"
          style={{ animationDuration: '1.2s' }}
          viewBox="0 0 60 60"
          fill="none"
        >
          <circle
            cx="30" cy="30" r="26"
            stroke="var(--border)"
            strokeWidth="2"
          />
          <circle
            cx="30" cy="30" r="26"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="40 124"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center">
        <p
          className="font-bold text-lg tracking-tight"
          style={{ color: 'var(--text-1)' }}
        >
          EV<span style={{ color: 'var(--accent)' }}>Route</span>
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Connecting to backend...
        </p>
      </div>
    </div>
  )
}

/* ─── App ─────────────────────────────────────────────────────── */
function App() {
  const { setBackendStatus, toasts, removeToast, addToast } = useStore()
  const [appLoading, setAppLoading] = useState(true)
  const location = useLocation()

  // Check backend connectivity on mount
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch(`${API_URL}/`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then(() => {
        setBackendStatus(true)
        addToast('success', 'Backend connected — all systems ready')
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setBackendStatus(false)
          addToast('warning', 'Backend offline — live features unavailable')
        }
      })
      .finally(() => {
        clearTimeout(timeout)
        setAppLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (appLoading) return <LoadingScreen />

  // Hide navbar on the full-screen route planner
  const isRoutePlanner = location.pathname === '/plan-route'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      {!isRoutePlanner && <Navbar />}

      {/* Animate on route change */}
      <div key={location.pathname} className="animate-fade-up">
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/select-brand"        element={<BrandSelection />} />
          <Route path="/select-model/:brandId" element={<ModelSelection />} />
          <Route path="/plan-route"          element={<RoutePlanner />} />
        </Routes>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default App
import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BrandSelection from './pages/BrandSelection'
import ModelSelection from './pages/ModelSelection'
import RoutePlanner from './pages/RoutePlanner'
import Dashboard from './pages/Dashboard'
import ChargersMap from './pages/ChargersMap'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'
import { useStore } from './store/useStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ── Loading screen ── */
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'relative' }}>
        <img
          src="/routelect-logo.png"
          alt="Routelect Logo"
          style={{ width: 64, height: 64, objectFit: 'contain' }}
        />
        <svg className="animate-spin" style={{ position: 'absolute', inset: -12, animationDuration: '1.2s' }} viewBox="0 0 88 88" fill="none">
          <circle cx="44" cy="44" r="40" stroke="var(--border)" strokeWidth="2.5" />
          <circle cx="44" cy="44" r="40" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="60 190" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
          Route<span style={{ color: 'var(--accent)' }}>lect</span>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Connecting to backend…</p>
      </div>
    </div>
  )
}
export default function App() {
  const { setBackendStatus, toasts, removeToast, addToast } = useStore()
  const [appLoading, setAppLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000))
    const ctrl = new AbortController()

    const backendCheck = fetch(`${API_URL}/`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { setBackendStatus(true); addToast('success', 'Backend connected — all systems ready') })
      .catch(err => {
        if (err?.name !== 'AbortError') {
          setBackendStatus(false)
          addToast('warning', 'Backend offline — live features unavailable')
        }
      })

    Promise.allSettled([minLoadTime, backendCheck]).then(() => {
      setAppLoading(false)
    })

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (appLoading) return <LoadingScreen />

  const isRoutePlanner = location.pathname === '/plan-route'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)' }}>
      {!isRoutePlanner && <Navbar />}

      <div key={location.pathname} className="animate-fade-up">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/select-brand" element={<BrandSelection />} />
          <Route path="/select-model/:brandId" element={<ModelSelection />} />
          <Route path="/plan-route" element={<RoutePlanner />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chargers-map" element={<ChargersMap />} />
        </Routes>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
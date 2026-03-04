import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage       from './pages/HomePage'
import BrandSelection from './pages/BrandSelection'
import ModelSelection from './pages/ModelSelection'
import RoutePlanner   from './pages/RoutePlanner'
import Navbar         from './components/Navbar'
import { ToastContainer } from './components/Toast'
import { useStore }   from './store/useStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ── Loading screen ── */
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="#00D4AA" className="w-7 h-7"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
        </div>
        <svg className="animate-spin" style={{ position: 'absolute', inset: -8, animationDuration: '1.2s' }} viewBox="0 0 68 68" fill="none">
          <circle cx="34" cy="34" r="30" stroke="var(--border)" strokeWidth="2"/>
          <circle cx="34" cy="34" r="30" stroke="var(--accent)" strokeWidth="2" strokeDasharray="44 145" strokeLinecap="round"/>
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
    const ctrl = new AbortController()
    const tid  = setTimeout(() => ctrl.abort(), 5000)

    fetch(`${API_URL}/`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { setBackendStatus(true); addToast('success', 'Backend connected — all systems ready') })
      .catch(err => {
        if (err?.name !== 'AbortError') {
          setBackendStatus(false)
          addToast('warning', 'Backend offline — live features unavailable')
        }
      })
      .finally(() => { clearTimeout(tid); setAppLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (appLoading) return <LoadingScreen />

  const isRoutePlanner = location.pathname === '/plan-route'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)' }}>
      {!isRoutePlanner && <Navbar />}

      <div key={location.pathname} className="animate-fade-up">
        <Routes>
          <Route path="/"                      element={<HomePage />}       />
          <Route path="/select-brand"          element={<BrandSelection />} />
          <Route path="/select-model/:brandId" element={<ModelSelection />} />
          <Route path="/plan-route"            element={<RoutePlanner />}   />
        </Routes>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
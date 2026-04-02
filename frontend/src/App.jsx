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
    <div className="startup-container">
      <style>
        {`
          .draw-bolt {
            fill: transparent;
            animation: draw-bolt-anim 1s cubic-bezier(0.22, 1, 0.36, 1) forwards, fill-bolt-anim 0.4s ease 0.9s forwards, glow-pulse-anim 2s ease-in-out 1.2s infinite alternate;
          }
          @keyframes fill-bolt-anim {
            0% { fill: transparent; }
            100% { fill: var(--accent); }
          }
        `}
      </style>
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 12 }}>
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* subtle glow background */}
          <circle cx="50" cy="50" r="45" fill="var(--accent)" opacity="0.05" className="fade-subtext" />
          
          {/* The Route Path */}
          <path 
            d="M 15 80 Q 30 75, 45 60 T 80 40" 
            stroke="var(--border)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="draw-route"
          />
          <circle cx="15" cy="80" r="3" fill="var(--text-3)" className="fade-subtext" />
          <circle cx="80" cy="40" r="3" fill="var(--text-3)" className="fade-subtext" />
          
          {/* The Lightning Bolt (Striking) */}
          <path 
            d="M 55 15 L 35 55 L 50 55 L 40 85 L 75 45 L 55 45 Z" 
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinejoin="round" 
            className="draw-bolt"
          />
        </svg>
      </div>
      <div className="fade-text-up" style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
          Route<span style={{ color: 'var(--accent)' }}>lect</span>
        </p>
        <p className="fade-subtext" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
          Connecting EV Network
        </p>
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
import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BrandSelection from './pages/BrandSelection'
import ModelSelection from './pages/ModelSelection'
import RoutePlanner from './pages/RoutePlanner'
import Dashboard from './pages/Dashboard'
import ChargersMap from './pages/ChargersMap'
import NotFound from './pages/NotFound'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'
import { useStore } from './store/useStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ── Loading screen ── */
function LoadingScreen() {
  const pinRef = useRef(null)
  const mainRef = useRef(null)
  const accentRef = useRef(null)
  const groupRef = useRef(null)

  useEffect(() => {
    const pin = pinRef.current
    const main = mainRef.current
    const accent = accentRef.current
    const group = groupRef.current
    if (!pin || !main || !accent || !group) return

    const TEAL = '#4ABEA1'

    function reset(el) {
      const len = el.getTotalLength ? el.getTotalLength() : 150
      el.style.cssText = [
        'fill:transparent',
        'stroke:#4ABEA1',
        'stroke-width:2.5',
        'stroke-linecap:round',
        'stroke-linejoin:round',
        'transition:none',
        'filter:none',
        'opacity:1'
      ].join(';')
      el.style.strokeDasharray = len
      el.style.strokeDashoffset = len
      return len
    }

    function ease(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function tween(el, prop, from, to, dur, onDone) {
      const t0 = performance.now()
      requestAnimationFrame(function tick(now) {
        const p = Math.min((now - t0) / dur, 1)
        el.style[prop] = from + (to - from) * ease(p)
        if (p < 1) requestAnimationFrame(tick)
        else if (onDone) onDone()
      })
    }

    function fadeGroup(from, to, dur, onDone) {
      const t0 = performance.now()
      requestAnimationFrame(function tick(now) {
        const p = Math.min((now - t0) / dur, 1)
        group.style.opacity = from + (to - from) * ease(p)
        if (p < 1) requestAnimationFrame(tick)
        else if (onDone) onDone()
      })
    }

    let active = true

    function runLoop() {
      if (!active) return
      const pinLen = reset(pin)
      const mainLen = reset(main)
      reset(accent)
      group.style.opacity = '1'

      tween(pin, 'strokeDashoffset', pinLen, 0, 900, null)

      setTimeout(() => {
        if (!active) return
        tween(main, 'strokeDashoffset', mainLen, 0, 1700, () => {
          if (!active) return
          accent.style.strokeDashoffset = '0'

          setTimeout(() => {
            if (!active) return
            [pin, main, accent].forEach(el => {
              el.style.fill = TEAL
              el.style.strokeWidth = '0'
            })

            setTimeout(() => {
              if (!active) return
              [pin, main, accent].forEach(el => {
                el.style.transition = 'filter 0.7s ease-in-out'
                el.style.filter = 'drop-shadow(0 0 16px rgba(74,190,161,0.9))'
              })
              setTimeout(() => {
                if (!active) return
                [pin, main, accent].forEach(el => {
                  el.style.filter = 'drop-shadow(0 0 4px rgba(74,190,161,0.25))'
                })
                setTimeout(() => {
                  if (!active) return
                  [pin, main, accent].forEach(el => {
                    el.style.filter = 'drop-shadow(0 0 16px rgba(74,190,161,0.9))'
                  })
                  setTimeout(() => {
                    if (!active) return
                    [pin, main, accent].forEach(el => {
                      el.style.transition = 'none'
                      el.style.filter = 'none'
                    })
                    fadeGroup(1, 0, 500, () => {
                      if (active) setTimeout(runLoop, 300)
                    })
                  }, 750)
                }, 750)
              }, 750)
            }, 100)
          }, 120)
        })
      }, 400)
    }

    const initialTimeout = setTimeout(runLoop, 200)

    return () => {
      active = false
      clearTimeout(initialTimeout)
    }
  }, [])

  return (
    <div style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', width: '100vw', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 99999 }}>
      <div style={{
        background: 'rgba(74, 190, 161, 0.05)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 36,
        padding: '32px 42px',
        border: '1px solid rgba(74, 190, 161, 0.3)',
        boxShadow: '0 0 70px rgba(74, 190, 161, 0.35)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <svg style={{ width: 200, height: 'auto', overflow: 'visible' }} viewBox="260 160 330 480" xmlns="http://www.w3.org/2000/svg">
          <g ref={groupRef}>
          <path ref={pinRef} style={{ fill: 'transparent', stroke: '#4ABEA1', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.5 }} d="M389.25,224.84c-29,0.5-64.54,29.54-54.97,73c0.97,6.5,29.86,57.79,54.97,88.5 c22.18-27.25,55-80,56-89C454.25,257.34,423.25,224.34,389.25,224.84z M389.75,316.34c-18.5,0-33.5-15-33.5-33.5s15-33.5,33.5-33.5s33.5,15,33.5,33.5 S408.25,316.34,389.75,316.34z"/>
          <path ref={mainRef} style={{ fill: 'transparent', stroke: '#4ABEA1', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.5 }} d="M510.25,499.34l-27,23l-33-49c24.99-14.76,47.18-31.85,61-49 c38.74-43.63,55.84-169.82-28-230c-112.28-77.49-241.16,8.11-204,120 c13.13,39.08,36.88,80.05,70.88,122.85c8-4.09,16.39-8.03,25.12-11.85 c-32.07-32.97-54.88-68.65-72-106c-22.5-60.5,17.32-122.61,83-125 c65.14-2.37,99.18,48.21,85,123c-12.56,50.62-47.98,84.05-96,108 l-25,12c-0.04-0.05-0.08-0.1-0.12-0.15 c-53.89,27.49-89.96,61.71-90.49,112.65v70 c0.61,14.5,15.61,38.5,39.61,38.5c32,0,42-23,42.18-38.5l0.34-70 c-0.52-12.5,29.32-33.19,50.48-44.5l79,119l26-28l85,81L510.25,499.34z M318.25,549.34v70.37c0,7.63-8,9.63-17,9.63c-10,0-18-4-18.03-9.5v-70 c0.03-63.5,49.6-83.37,119.03-116.17c94-47.33,110.4-134.11,86.5-208.83 c59.5,82.5,44.5,191.5-86.5,247.81 C358.25,492.34,320.25,523.34,318.25,549.34z M496.25,569.34l-24,20l-62-93l25-15l46,66l24-15l33,77L496.25,569.34z"/>
          <polygon ref={accentRef} style={{ fill: 'transparent', stroke: '#4ABEA1', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.5 }} points="374.61,424.96 349.73,436.32 351.09,439.16 375.98,427.8"/>
        </g>
      </svg>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
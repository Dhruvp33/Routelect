import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap
} from 'react-leaflet'
import {
  Navigation, Battery, MapPin, Zap, Clock,
  ChevronLeft, X, Download, AlertTriangle, Car, Loader2
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { API_URL } from '../App'
import Navbar from '../components/Navbar'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

/* ════════════════════════════════════════════════════════
   MAP ICONS
   ════════════════════════════════════════════════════════ */
const createPinIcon = (color, size = 40) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;color:${color}">
        <svg viewBox="0 0 24 24" fill="currentColor"
          style="position:absolute;top:50%;left:50%;
                 transform:translate(-50%,-100%);
                 filter:drop-shadow(0 0 8px ${color});
                 width:${size * 0.85}px;height:${size * 0.85}px">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75
                   7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5
                   s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div style="position:absolute;bottom:0;left:50%;
                    transform:translate(-50%,30%) rotateX(60deg);
                    width:${size * 0.35}px;height:${size * 0.17}px;
                    background:${color};border-radius:50%;opacity:0.25;
                    animation:pulse-ground 2s infinite"></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })

const createChargingIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:34px;height:34px">
        <div style="
          width:34px;height:34px;
          background:rgba(7,11,20,0.95);
          border:1.5px solid #FFB547;
          border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 12px rgba(255,181,71,0.5)">
          <svg viewBox="0 0 24 24" fill="#FFB547" width="18" height="18">
            <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
          </svg>
        </div>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -22],
  })

const startIcon    = createPinIcon('#00D4AA', 44)
const endIcon      = createPinIcon('#FF4D6D', 44)
const chargingIcon = createChargingIcon()

/* ════════════════════════════════════════════════════════
   MAP HELPERS
   ════════════════════════════════════════════════════════ */
function MapFlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 9, { duration: 1.4 })
  }, [center, map])
  return null
}

function MapFitBounds({ start, end }) {
  const map = useMap()
  useEffect(() => {
    if (start && end) {
      map.fitBounds([start, end], { padding: [70, 70], duration: 1.4 })
    }
  }, [start, end, map])
  return null
}

/* ════════════════════════════════════════════════════════
   AUTOCOMPLETE HOOK
   Nominatim (OpenStreetMap) — 100% free, no API key
   - 350ms debounce so we don't spam the API
   - Aborts stale requests when query changes
   - India-biased results
   ════════════════════════════════════════════════════════ */
function useLocationAutocomplete(query, active) {
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const timerRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!active || !query || query.trim().length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)

    timerRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      try {
        const params = new URLSearchParams({
          format:            'json',
          q:                 `${query.trim()}, India`,
          limit:             7,
          addressdetails:    1,
          countrycodes:      'in',
          'accept-language': 'en',
        })
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: abortRef.current.signal }
        )
        const data = await res.json()

        const seen    = new Set()
        const results = []

        for (const item of data) {
          const addr  = item.address || {}
          // Build a short human-friendly label
          const city  = addr.city || addr.town || addr.village || addr.suburb || addr.county || ''
          const state = addr.state || ''
          const label = city && state
            ? `${city}, ${state}`
            : item.display_name.split(',').slice(0, 3).join(',').trim()

          if (seen.has(label)) continue
          seen.add(label)

          results.push({
            id:    item.place_id,
            label,
            // Show last 2 parts of display_name as sub-label
            sub:   item.display_name.split(',').slice(-2).join(',').trim(),
            lat:   parseFloat(item.lat),
            lng:   parseFloat(item.lon),
          })
        }

        setSuggestions(results)
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, active])

  return { suggestions, loading, clear: () => setSuggestions([]) }
}

/* ════════════════════════════════════════════════════════
   HELPER — bold the typed query inside a suggestion label
   ════════════════════════════════════════════════════════ */
function HighlightMatch({ text, query }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ════════════════════════════════════════════════════════
   LOCATION INPUT COMPONENT
   accentColor  — the dot / focus ring colour
   ════════════════════════════════════════════════════════ */
function LocationInput({ value, onChange, onSelect, placeholder, accentColor = '#00D4AA' }) {
  const [open,     setOpen]     = useState(false)
  const [cursor,   setCursor]   = useState(-1)   // keyboard-highlighted row
  const [touched,  setTouched]  = useState(false) // only fetch after user starts typing
  const wrapRef  = useRef(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  const { suggestions, loading, clear } = useLocationAutocomplete(value, touched && open)

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setCursor(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Scroll highlighted row into view ── */
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${cursor}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [cursor])

  const pick = (item) => {
    onChange(item.label)
    onSelect([item.lat, item.lng])
    setOpen(false)
    setCursor(-1)
    setTouched(false)
    clear()
  }

  const handleChange = (e) => {
    onChange(e.target.value)
    setTouched(true)
    setOpen(true)
    setCursor(-1)
  }

  const handleKeyDown = (e) => {
    if (!open) return
    const len = suggestions.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => (c + 1) % len)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => (c - 1 + len) % len)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = cursor >= 0 ? suggestions[cursor] : suggestions[0]
      if (target) pick(target)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setCursor(-1)
    }
  }

  const showDropdown = open && touched && (loading || suggestions.length > 0 || value.length >= 3)

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>

      {/* ── Input field ── */}
      <div style={{ position: 'relative' }}>
        {/* Coloured dot */}
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: `2px solid ${accentColor}`,
            background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor }} />
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="input-field"
          style={{
            paddingRight: 38,
            borderRadius: 10,
            borderColor: open && suggestions.length > 0 ? accentColor : undefined,
            boxShadow: open && suggestions.length > 0
              ? `0 0 0 3px ${accentColor}18`
              : undefined,
          }}
          value={value}
          onChange={handleChange}
          onFocus={() => { if (value.length >= 3) setOpen(true) }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Right icon: spinner or clear ✕ */}
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <Loader2 style={{ width: 14, height: 14, color: 'var(--text-3)', animation: 'spin 0.8s linear infinite' }} />
            : value
              ? (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(''); onSelect(null); clear(); setTouched(false); inputRef.current?.focus() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  aria-label="Clear"
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )
              : null
          }
        </div>
      </div>

      {/* ── Dropdown panel ── */}
      {showDropdown && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0, right: 0,
            zIndex: 9999,
            background: 'var(--surface)',
            border: `1px solid ${accentColor}40`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0,0,0,0.65), 0 4px 12px rgba(0,0,0,0.4)',
            animation: 'fade-up 0.14s ease both',
            maxHeight: 280,
            overflowY: 'auto',
          }}
          className="no-scrollbar"
        >
          {/* Loading skeleton */}
          {loading && suggestions.length === 0 && (
            <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[75, 55, 65].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 38, borderRadius: 8 }} />
              ))}
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', paddingBottom: 4 }}>
                Searching Indian locations…
              </div>
            </div>
          )}

          {/* Results */}
          {suggestions.map((item, idx) => (
            <button
              key={item.id}
              role="option"
              data-idx={idx}
              aria-selected={cursor === idx}
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(item)}
              onMouseEnter={() => setCursor(idx)}
              style={{
                width: '100%',
                background: cursor === idx ? `${accentColor}10` : 'transparent',
                border: 'none',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                padding: '10px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.1s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: cursor === idx ? `${accentColor}18` : 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s',
              }}>
                <MapPin style={{ width: 13, height: 13, color: cursor === idx ? accentColor : 'var(--text-3)' }} />
              </div>

              {/* Text */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <HighlightMatch text={item.label} query={value} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.sub}
                </div>
              </div>

              {/* Enter hint on highlighted row */}
              {cursor === idx && (
                <div style={{ fontSize: 10, color: accentColor, opacity: 0.7, flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace' }}>
                  ↵
                </div>
              )}
            </button>
          ))}

          {/* No results message */}
          {!loading && suggestions.length === 0 && value.length >= 3 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
              No results for "<strong style={{ color: 'var(--text-1)' }}>{value}</strong>"
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Try adding a city or state name
              </div>
            </div>
          )}

          {/* Footer attribution */}
          {(loading || suggestions.length > 0) && (
            <div style={{ padding: '7px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface-2)' }}>
              <MapPin style={{ width: 9, height: 9 }} />
              Powered by OpenStreetMap · Free &amp; open data
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   BATTERY GAUGE  (animated SVG arc)
   ════════════════════════════════════════════════════════ */
function BatteryGauge({ percent, maxRangeKm }) {
  const r       = 34
  const circ    = 2 * Math.PI * r
  const arcFrac = 0.75
  const filled  = (percent / 100) * circ * arcFrac
  const color   = percent > 50 ? 'var(--accent)' : percent > 20 ? '#FBBF24' : '#FF4D6D'
  const estKm   = Math.round(maxRangeKm * percent / 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="42" cy="42" r={r} fill="none" strokeWidth="5"
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray={`${circ * arcFrac} ${circ * (1 - arcFrac)}`}
            strokeLinecap="round" />
          <circle cx="42" cy="42" r={r} fill="none" strokeWidth="5"
            stroke={color}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.45s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 5px ${color})` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{percent}</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>%</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Estimated range</p>
        <p className="mono" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          {estKm}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)', marginLeft: 4 }}>km</span>
        </p>
        {percent < 20 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#FF4D6D', marginTop: 8 }}>
            <AlertTriangle className="w-3 h-3" /> Low charge — stops likely
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   TRIP SUMMARY MODAL
   ════════════════════════════════════════════════════════ */
function TripSummaryModal({ route, car, onClose }) {
  if (!route || !car) return null
  const kwhPer100km = (car.battery_capacity_kwh / car.range_km) * 100
  const energyKwh   = route.energy_kwh_used ?? parseFloat(((route.total_distance_km / 100) * kwhPer100km).toFixed(1))
  const chargeCost  = route.estimated_charge_cost_inr ?? Math.round(energyKwh * 8.5)
  const petrolCost  = Math.round(route.total_distance_km * 7)
  const savings     = Math.max(0, petrolCost - chargeCost)
  const hrs         = Math.floor(route.estimated_total_time_minutes / 60)
  const mins        = route.estimated_total_time_minutes % 60
  const co2         = (route.total_distance_km * 0.12).toFixed(1)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Trip Summary</h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{car.brand} · {car.name || car.model}</p>
          </div>
          <button className="btn-ghost" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { e: '📍', l: 'Distance',  v: `${route.total_distance_km} km` },
              { e: '⏱️', l: 'Total Time', v: `${hrs}h ${mins}m` },
              { e: '⚡', l: 'Stops',      v: `${route.charging_stops?.length || 0}` },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.e}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{m.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{m.l}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 16 }}>Cost Analysis</p>
            {[
              { label: 'Energy consumed',        value: `${energyKwh} kWh` },
              { label: 'Estimated charging cost', value: `₹${chargeCost}` },
              { label: 'Equivalent petrol cost',  value: `₹${petrolCost}`, strike: true },
              { label: 'CO₂ saved',              value: `${co2} kg`, green: true },
            ].map((row, i) => (
              <div key={i}>
                {i === 3 && <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 3 ? 12 : 0, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                  <span className="mono" style={{ fontWeight: 600, textDecoration: row.strike ? 'line-through' : 'none', opacity: row.strike ? 0.5 : 1, color: row.green ? '#34D399' : 'var(--text-1)' }}>{row.value}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>You save vs petrol</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>₹{savings}</span>
            </div>
          </div>

          {route.needs_charging && route.charging_stops?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 12 }}>Charging Stops</p>
              {route.charging_stops.map((stop, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,181,71,0.1)', color: '#FFB547', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.station_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{stop.charging_time_minutes} min stop</p>
                  </div>
                  <span className="badge badge-yellow">#{i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {!route.needs_charging && (
            <div style={{ padding: '14px 16px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Zap className="w-5 h-5" style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>Direct trip possible!</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Battery is sufficient — no charging stop needed.</p>
              </div>
            </div>
          )}
        </div>
        <div className="no-print" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>Back to Map</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: 'var(--text-2)' }}>{icon} {label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════ */
export default function RoutePlanner() {
  const navigate = useNavigate()
  const { selectedCar, currentBatteryPercent, setCurrentBatteryPercent, addToast, addToHistory } = useStore()

  const [startLocation, setStartLocation] = useState('Ahmedabad')
  const [endLocation,   setEndLocation]   = useState('')
  const [startCoords,   setStartCoords]   = useState(null)
  const [endCoords,     setEndCoords]     = useState(null)
  const [mapCenter,     setMapCenter]     = useState([22.9734, 78.6569])
  const [route,         setRoute]         = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [showSummary,   setShowSummary]   = useState(false)
  const [routeKey,      setRouteKey]      = useState(0)

  useEffect(() => { if (!selectedCar) navigate('/select-brand') }, [selectedCar, navigate])

  // Geocode default start on mount
  useEffect(() => {
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=Ahmedabad,India&limit=1')
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          const c = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
          setStartCoords(c)
          setMapCenter(c)
        }
      })
      .catch(() => {})
  }, [])

  const handleStartSelect = useCallback((coords) => {
    if (!coords) { setStartCoords(null); return }
    setStartCoords(coords)
    setMapCenter(coords)
  }, [])

  const handleEndSelect = useCallback((coords) => {
    if (!coords) { setEndCoords(null); return }
    setEndCoords(coords)
    setMapCenter(coords)
    addToast('info', 'Destination pinned — set battery level then click Find Route')
  }, [addToast])

  const handleCalculate = async () => {
    if (!startCoords || !endCoords) {
      addToast('warning', 'Please select both locations from the dropdown first')
      return
    }
    setLoading(true)
    setRoute(null)
    try {
      const res = await fetch(`${API_URL}/api/route/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startCoords[0], start_lng: startCoords[1],
          end_lat:   endCoords[0],   end_lng:   endCoords[1],
          current_battery_percent: currentBatteryPercent,
          car_model_id: selectedCar.id,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRoute(data)
      setRouteKey(k => k + 1)
      addToHistory({ car: selectedCar, route: data, date: new Date().toISOString() })
      addToast('success', `Route found — ${data.total_distance_km} km · ${data.estimated_total_time_minutes} min`)
    } catch {
      addToast('error', 'Route calculation failed — check backend connection')
    }
    setLoading(false)
  }

  if (!selectedCar) return null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ════════════ SIDEBAR ════════════ */}
        <div
          className="glass-sidebar no-scrollbar"
          style={{ width: 380, height: '100%', position: 'relative', zIndex: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button className="btn-ghost" style={{ marginLeft: -8 }} onClick={() => navigate('/select-brand')}>
                <ChevronLeft className="w-3.5 h-3.5" /> Change vehicle
              </button>
              <span className="badge badge-green" style={{ fontSize: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', animation: 'pulse-dot 1.5s ease infinite' }} />
                Live
              </span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Route Planner</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
              <Car className="w-3.5 h-3.5" />
              {selectedCar.brand} · {selectedCar.name || selectedCar.model}
            </div>
          </div>

          {/* Body */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Battery gauge */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 14, fontFamily: 'IBM Plex Mono, monospace' }}>
                Initial Charge Level
              </p>
              <BatteryGauge percent={currentBatteryPercent} maxRangeKm={selectedCar.range_km || 300} />
              <div style={{ marginTop: 16 }}>
                <input type="range" min="5" max="100"
                  value={currentBatteryPercent}
                  onChange={e => setCurrentBatteryPercent(parseInt(e.target.value))}
                  className="range-slider"
                  style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${currentBatteryPercent}%, var(--surface-3) ${currentBatteryPercent}%, var(--surface-3) 100%)` }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-3)' }}>
                  <span>5%</span><span>100%</span>
                </div>
              </div>
            </div>

            {/* ── Location inputs ── */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Route
              </p>

              <LocationInput
                value={startLocation}
                onChange={setStartLocation}
                onSelect={handleStartSelect}
                placeholder="Start location"
                accentColor="#00D4AA"
              />

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />)}
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <LocationInput
                value={endLocation}
                onChange={setEndLocation}
                onSelect={handleEndSelect}
                placeholder="Where to? (type 3+ chars)"
                accentColor="#FF4D6D"
              />

              {!endCoords && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', paddingTop: 2 }}>
                  ↑ Pick from the dropdown to pin on map
                </p>
              )}
            </div>

            {/* Route results */}
            {route && (
              <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Route Results
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatCard icon={<MapPin className="w-3 h-3" />} label="Distance" value={`${route.total_distance_km} km`} />
                  <StatCard icon={<Clock className="w-3 h-3" />} label="Total Time" value={`${Math.floor(route.estimated_total_time_minutes / 60)}h ${route.estimated_total_time_minutes % 60}m`} />
                </div>

                {route.needs_charging ? (
                  <div style={{ background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Zap className="w-4 h-4" style={{ color: '#FFB547' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFB547' }}>
                        {route.charging_stops.length} charging stop{route.charging_stops.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {route.charging_stops.map((stop, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingTop: i > 0 ? 8 : 0, borderTop: i > 0 ? '1px solid rgba(255,181,71,0.1)' : 'none', marginTop: i > 0 ? 8 : 0 }}>
                        <span style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{stop.station_name}</span>
                        <span className="mono" style={{ fontWeight: 600, flexShrink: 0 }}>{stop.charging_time_minutes}m</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap className="w-4 h-4" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Direct trip possible</p>
                      <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>No charging stop needed</p>
                    </div>
                  </div>
                )}

                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowSummary(true)}>
                  <Navigation className="w-4 h-4" />
                  View Full Trip Summary
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'rgba(7,11,20,0.98)' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15 }}
              onClick={handleCalculate}
              disabled={loading || !startCoords || !endCoords}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Calculating…
                </>
              ) : (
                <><Navigation className="w-4 h-4" /> Find Best Route</>
              )}
            </button>
            {(!startCoords || !endCoords) && !loading && (
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
                {!startCoords ? 'Set a start location above' : 'Set a destination above'}
              </p>
            )}
          </div>
        </div>

        {/* ════════════ MAP ════════════ */}
        <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
          <MapContainer center={mapCenter} zoom={6} zoomControl style={{ width: '100%', height: '100%' }}>
            <TileLayer className="dark-map-tiles" attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFlyTo center={mapCenter} />
            {startCoords && endCoords && <MapFitBounds start={startCoords} end={endCoords} />}

            {startCoords && (
              <Marker position={startCoords} icon={startIcon}>
                <Popup>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>📍 {startLocation}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Starting point</div>
                </Popup>
              </Marker>
            )}
            {endCoords && (
              <Marker position={endCoords} icon={endIcon}>
                <Popup>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>🏁 {endLocation}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Destination</div>
                </Popup>
              </Marker>
            )}
            {route?.charging_stops?.map((stop, i) =>
              stop.lat && stop.lng ? (
                <Marker key={i} position={[stop.lat, stop.lng]} icon={chargingIcon}>
                  <Popup>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>⚡ {stop.station_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Stop #{i + 1} · {stop.charging_time_minutes} min</div>
                  </Popup>
                </Marker>
              ) : null
            )}
            {route?.route_coords && (
              <Polyline key={routeKey} positions={route.route_coords}
                pathOptions={{ color: '#00D4AA', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }} />
            )}
          </MapContainer>

          {!route && !loading && (
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
              <div style={{ padding: '9px 18px', borderRadius: 100, background: 'rgba(7,11,20,0.92)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', backdropFilter: 'blur(12px)' }}>
                Type a city → pick from dropdown → <strong style={{ color: 'var(--text-1)' }}>Find Best Route</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSummary && route && (
        <TripSummaryModal route={route} car={selectedCar} onClose={() => setShowSummary(false)} />
      )}
    </div>
  )
}
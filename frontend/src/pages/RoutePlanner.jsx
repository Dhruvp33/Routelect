import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import {
  Navigation, Battery, MapPin, Zap, Clock, ChevronLeft,
  X, Download, AlertTriangle, Car, Loader2, ChevronUp, ChevronRight,
  ExternalLink, Wifi, MapPin as MapPinIcon, Plug,
  ChevronDown, Crosshair, ArrowUpDown, Share2, Plus, Trash2,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { API_URL } from '../App'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

/* ═══════════════════════════════════════════════════════
   MOBILE DETECTION HOOK
   ═══════════════════════════════════════════════════════ */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

/* ═══════════════════════════════════════════════════════
   MAP ICONS
   ═══════════════════════════════════════════════════════ */
const mkPin = (color, size = 40) => L.divIcon({
  className: '',
  html: `<div style="position:relative;width:${size}px;height:${size}px;color:${color}">
    <svg viewBox="0 0 24 24" fill="currentColor"
      style="position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);
             filter:drop-shadow(0 0 8px ${color});width:${size * .85}px;height:${size * .85}px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size],
})

const mkChargerPin = (clickable = false) => L.divIcon({
  className: '',
  html: `<div class="${clickable ? 'marker-breathe' : ''}" style="width:36px;height:36px;background:rgba(7,11,20,0.95);border:1.5px solid #FFB547;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,181,71,0.55);cursor:${clickable ? 'pointer' : 'default'}">
    <svg viewBox="0 0 24 24" fill="#FFB547" width="18" height="18"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -24],
})

const startIcon = mkPin('#00D4AA', 44)
const endIcon = mkPin('#FF4D6D', 44)
const waypointIcon = mkPin('#FFB547', 38)
const chargerIcon = mkChargerPin(true)

/* ═══════════════════════════════════════════════════════
   MAP HELPERS
   ═══════════════════════════════════════════════════════ */
function FlyTo({ center }) {
  const map = useMap()
  const isFirst = useRef(true)
  useEffect(() => {
    if (!center) return
    if (isFirst.current) { isFirst.current = false; return }
    map.flyTo(center, 9, { duration: 1.4 })
  }, [center, map])
  return null
}
function FitBounds({ start, end }) {
  const map = useMap()
  useEffect(() => {
    if (start && end) map.fitBounds([start, end], { padding: [70, 70], duration: 1.4 })
  }, [start, end, map])
  return null
}

/* ═══════════════════════════════════════════════════════
   PHOTON AUTOCOMPLETE HOOK  (Komoot — free, no key)
   India bounding box: bbox=68.7,6.5,97.25,35.5
   ═══════════════════════════════════════════════════════ */
function usePhotonAutocomplete(query, active) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const ctrl = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (ctrl.current) ctrl.current.abort()
    if (!active || !query || query.trim().length < 3) {
      setSuggestions([]); setLoading(false); return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      ctrl.current = new AbortController()
      try {
        const params = new URLSearchParams({
          q: query.trim(), limit: 4,
          bbox: '68.7,6.5,97.25,35.5', lang: 'en',
        })
        const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: ctrl.current.signal })
        const data = await res.json()
        const seen = new Set(); const results = []
        for (const f of (data.features || [])) {
          const p = f.properties || {}
          const coords = f.geometry?.coordinates
          if (!coords) continue
          const parts = [p.name, p.locality || p.suburb || p.district, p.city || p.town || p.county, p.state].filter(Boolean)
          const label = parts.slice(0, 3).join(', ')
          if (!label || seen.has(label)) continue
          seen.add(label)
          results.push({
            id: p.osm_id || Math.random(), label,
            sub: [p.city || p.town || p.county, p.state].filter(Boolean).join(', '),
            type: p.osm_value || p.type || '',
            lat: coords[1], lng: coords[0],
          })
        }
        setSuggestions(results)
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([])
      } finally { setLoading(false) }
    }, 320)
    return () => { clearTimeout(timer.current); if (ctrl.current) ctrl.current.abort() }
  }, [query, active])

  return { suggestions, loading, clear: () => setSuggestions([]) }
}

/* ── Bold matching text ── */
function Highlight({ text, q }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   LOCATION INPUT
   ═══════════════════════════════════════════════════════ */
function LocationInput({ value, onChange, onSelect, placeholder, accent = '#00D4AA', onInputFocus, onInputBlur }) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const [touched, setTouched] = useState(false)
  const isDark = useStore((s) => s.theme) === 'dark'
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const { suggestions, loading, clear } = usePhotonAutocomplete(value, touched && open)
  const showDrop = open && touched && (loading || suggestions.length > 0 || value.length >= 3)

  // Close drop on outside click (no more scroll/resize close — inline dropdown scrolls naturally)
  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (listRef.current && listRef.current.contains(e.target)) return
      if (wrapRef.current && wrapRef.current.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('touchstart', h)
    }
  }, [open])

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      listRef.current.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: 'nearest' })
    }
  }, [cursor])

  const pick = (item) => {
    onChange(item.label); onSelect([item.lat, item.lng])
    setOpen(false); setCursor(-1); setTouched(false); clear()
  }

  const onKeyDown = (e) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => (c + 1) % suggestions.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => (c - 1 + suggestions.length) % suggestions.length) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(cursor >= 0 ? suggestions[cursor] : suggestions[0]) }
    else if (e.key === 'Escape') { setOpen(false); setCursor(-1) }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: `4px solid ${accent}`, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="input-field"
          style={{ paddingLeft: 38, paddingRight: 34, borderRadius: showDrop ? '12px 12px 0 0' : 12, borderColor: open && suggestions.length ? accent : 'var(--border)', boxShadow: open && suggestions.length ? `0 0 0 3px ${accent}18` : undefined, background: 'var(--surface)', borderBottomWidth: showDrop ? 0 : 1 }}
          value={value}
          onChange={e => { onChange(e.target.value); setTouched(true); setOpen(true); setCursor(-1) }}
          onFocus={(e) => { 
            if (onInputFocus) onInputFocus(e)
            if (value.length >= 3) setOpen(true) 
          }}
          onBlur={() => {
            if (onInputBlur) setTimeout(() => onInputBlur(), 200)
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <Loader2 style={{ width: 13, height: 13, color: 'var(--text-3)', animation: 'spin 0.8s linear infinite' }} />
            : value
              ? <button onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(''); onSelect(null); clear(); setTouched(false); inputRef.current?.focus() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                <X style={{ width: 12, height: 12 }} />
              </button>
              : null
          }
        </div>
      </div>

      {/* Inline dropdown — anchored directly below the input, no portal */}
      {showDrop && (
        <div ref={listRef} role="listbox" className="no-scrollbar"
          style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 1000, background: isDark ? 'rgba(7,11,20,0.95)' : 'rgba(255,255,255,0.97)', border: isDark ? `1px solid ${accent}40` : '1px solid rgba(0,0,0,0.12)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.08)', maxHeight: 280, overflowY: 'auto' }}>
          {loading && !suggestions.length && (
            <div style={{ padding: '8px 10px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 38, borderRadius: 8 }} />)}
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '2px 0 6px' }}>Searching India…</div>
            </div>
          )}
          {suggestions.map((item, idx) => (
            <button key={item.id} role="option" data-idx={idx} aria-selected={cursor === idx}
              onMouseDown={e => e.preventDefault()} onClick={() => pick(item)} onMouseEnter={() => setCursor(idx)}
              style={{ width: '100%', background: cursor === idx ? `${accent}10` : 'transparent', border: 'none', borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.1s' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: cursor === idx ? `${accent}18` : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin style={{ width: 12, height: 12, color: cursor === idx ? accent : 'var(--text-3)' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Highlight text={item.label} q={value} />
                </div>
                {item.sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>}
              </div>
              {cursor === idx && <span style={{ fontSize: 10, color: accent, opacity: 0.7, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>↵</span>}
            </button>
          ))}
          {!loading && !suggestions.length && value.length >= 3 && (
            <div style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
              No results for "<strong style={{ color: 'var(--text-1)' }}>{value}</strong>"
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Try adding area, city, or pincode</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CHARGER DETAIL (Slide-in Panel)
   ═══════════════════════════════════════════════════════ */
function ChargerDetailModal({ stop, stopIndex, batteryAtArrival = 10, onClose }) {
  if (!stop) return null
  const chargeFrom = Math.round(batteryAtArrival)
  const chargeTo = 80
  const chargePct = chargeTo - chargeFrom
  const gmapsUrl = stop.lat && stop.lng ? `https://maps.google.com/?q=${stop.lat},${stop.lng}` : null
  const statusColor = stop.status === 'Operational' ? '#00D4AA' : stop.status === 'Unknown' ? '#FFB547' : '#FF4D6D'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', animation: 'fade-in-anim 0.3s forwards' }}>
      <div className="surface-2 slide-panel-in" style={{ 
        position: 'absolute', right: window.innerWidth > 768 ? 20 : 0, 
        bottom: window.innerWidth > 768 ? 20 : 0, 
        top: window.innerWidth > 768 ? 80 : 'auto', 
        width: '100%', maxWidth: window.innerWidth > 768 ? 380 : '100%',
        margin: 0, borderRadius: window.innerWidth > 768 ? 24 : '24px 24px 0 0',
        maxHeight: window.innerWidth > 768 ? 'calc(100vh - 100px)' : '85dvh',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ justifyContent: 'center', padding: '12px 0 0', display: window.innerWidth > 768 ? 'none' : 'flex' }}>
          <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
        </div>
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,181,71,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap className="w-4 h-4" style={{ color: '#FFB547' }} />
              </div>
              <span className="badge badge-yellow" style={{ fontSize: 11 }}>Stop #{stopIndex + 1}</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{stop.station_name}</h2>
            {stop.operator && <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>{stop.operator}</p>}
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ flexShrink: 0, marginTop: -4 }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 16, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFB547', marginBottom: 12, fontFamily: 'IBM Plex Mono, monospace' }}>Charging Plan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                  <span>Arrive at</span><span>Depart at</span>
                </div>
                <div style={{ position: 'relative', height: 10, background: 'var(--surface-3)', borderRadius: 10, overflow: 'visible' }}>
                  <div style={{ position: 'absolute', left: `${chargeFrom}%`, width: `${chargePct}%`, height: '100%', background: 'linear-gradient(to right, #FFB547, #00D4AA)', borderRadius: 10 }} />
                  <div style={{ position: 'absolute', left: `${chargeFrom}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#FF4D6D', border: '2px solid var(--surface)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', left: `${chargeTo}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#00D4AA', border: '2px solid var(--surface)', zIndex: 1 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                  <span className="mono" style={{ color: '#FF4D6D' }}>{chargeFrom}%</span>
                  <span className="mono" style={{ color: '#00D4AA' }}>{chargeTo}%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}>Charging time</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{stop.charging_time_minutes}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>min</span></div>
              </div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}>Energy added</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{stop.charge_added_kwh || '—'}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>kWh</span></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>Station Details</p>
            {[
              { label: 'Status', value: stop.status || 'Unknown', color: statusColor, show: true },
              { label: 'Power output', value: `${stop.charger_power_kw || 50} kW`, show: true },
              { label: 'Connector type', value: stop.connector_type || 'CCS Type 2', show: true },
              { label: 'No. of plugs', value: stop.num_points ? `${stop.num_points}` : 'N/A', show: true },
              { label: 'Cost per unit', value: stop.usage_cost || 'Contact operator', show: true },
            ].filter(r => r.show).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                <span className="mono" style={{ fontWeight: 600, color: row.color || 'var(--text-1)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {stop.lat && stop.lng && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
              {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          {gmapsUrl && (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, textDecoration: 'none' }}>
              <ExternalLink className="w-4 h-4" /> Open in Maps
            </a>
          )}
          <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   BATTERY GAUGE
   ═══════════════════════════════════════════════════════ */
function BatteryGauge({ percent, maxRangeKm }) {
  const isDark = useStore((s) => s.theme) === 'dark'
  const r = 26, circ = 2 * Math.PI * r, arc = 0.75
  const fill = (percent / 100) * circ * arc
  const color = percent > 50 ? 'var(--accent)' : percent > 20 ? '#FBBF24' : '#FF4D6D'
  const estKm = Math.round(maxRangeKm * percent / 100 * 0.78)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} strokeDasharray={`${circ * arc} ${circ * (1 - arc)}`} strokeLinecap="round" />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4.5" stroke={color} strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.45s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{percent}</span>
          <span style={{ fontSize: 8, color: 'var(--text-3)' }}>%</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 2 }}>Real-world range</p>
        <p className="mono" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>
          {estKm}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-2)', marginLeft: 3 }}>km</span>
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>incl. 15% safety buffer</p>
        {percent < 20 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#FF4D6D', marginTop: 4 }}>
            <AlertTriangle className="w-3 h-3" />Charging stop likely
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TRIP SUMMARY & TIMELINE MODAL (Premium Glassmorphic)
   ═══════════════════════════════════════════════════════ */
function TripSummaryModal({ route, car, startLoc, endLoc, startBattery, onClose }) {
  const isDark = useStore((s) => s.theme) === 'dark'
  if (!route || !car) return null
  const kwh100 = (car.battery_capacity_kwh / car.range_km) * 100
  const energy = route.energy_kwh_used ?? +((route.total_distance_km / 100 * kwh100).toFixed(1))
  const cost = route.estimated_charge_cost_inr ?? Math.round(energy * 8.5)
  const petrol = Math.round(route.total_distance_km * 7)
  const savings = Math.max(0, petrol - cost)
  const co2 = (route.total_distance_km * 0.12).toFixed(1)

  const stops = route.charging_stops || []
  const timelineNodes = []
  timelineNodes.push({ type: 'start', label: startLoc || 'Starting Point', bat: startBattery || 100 })

  let lastDist = 0
  stops.forEach((stop, i) => {
    const driven = Math.round((stop.route_dist || 0) - lastDist)
    if (driven > 0) timelineNodes.push({ type: 'drive', dist: driven })
    timelineNodes.push({
      type: 'charge', name: stop.station_name || stop.name, 
      arriveBat: stop.battery_at_arrival_pct, 
      departBat: stop.battery_at_departure_pct,
      time: stop.charging_time_minutes, kwh: stop.charge_added_kwh
    })
    lastDist = stop.route_dist || 0
  })

  const finalDist = Math.round(route.total_distance_km - lastDist)
  if (finalDist > 0) timelineNodes.push({ type: 'drive', dist: finalDist })
  timelineNodes.push({ type: 'end', label: endLoc || 'Destination', bat: route.battery_at_arrival_pct })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 99999 }}>
      <div className="scale-up-modal" style={{ width: '100%', maxWidth: 520, margin: '20px auto', background: isDark ? 'rgba(13,17,23,0.85)' : 'rgba(255,255,255,0.97)', border: `1px solid ${isDark ? 'rgba(0,212,170,0.3)' : 'rgba(0,184,148,0.25)'}`, borderRadius: 24, boxShadow: isDark ? '0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,212,170,0.05)' : '0 0 50px rgba(0,0,0,0.1), inset 0 0 20px rgba(0,184,148,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg, rgba(0,212,170,0.1), transparent)' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Trip Summary</h2>
            <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>{car.brand} {car.name || car.model}</p>
          </div>
          <button className="btn-ghost" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Money Saved</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', textShadow: '0 0 20px rgba(0,212,170,0.4)' }}>₹{savings}</div>
            </div>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>CO₂ Reduced</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: '#34D399', textShadow: '0 0 20px rgba(52,211,153,0.4)' }}>{co2}kg</div>
            </div>
          </div>

          {route.elevation_stats && (
            <div style={{ background: isDark ? 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' : 'linear-gradient(145deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Topography Impact</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: route.elevation_stats.net_impact_kwh > 0 ? '#FFB547' : '#00D4AA', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {route.elevation_stats.net_impact_kwh > 0 ? <AlertTriangle className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  {route.elevation_stats.net_impact_kwh > 0 ? `⚠️ Hills used +${Math.abs(route.elevation_stats.net_impact_kwh)} kWh` : `✅ Downhills extended range!`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,77,109,0.06)', borderRadius: 10, padding: '8px 12px' }}>
                  <ChevronUp style={{ width: 16, height: 16, color: '#FF4D6D' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Total Ascent</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>+{route.elevation_stats.ascent_m}m</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,170,0.06)', borderRadius: 10, padding: '8px 12px' }}>
                  <ChevronDown style={{ width: 16, height: 16, color: '#00D4AA' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Total Descent</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>-{route.elevation_stats.descent_m}m</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 16, fontFamily: 'IBM Plex Mono, monospace' }}>Journey Details</p>
          
          <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: '20px' }}>
            {timelineNodes.map((n, i) => {
              if (n.type === 'start') return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00D4AA', boxShadow: '0 0 10px #00D4AA', zIndex: 2 }} />
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{n.label.split(',')[0]}</div>
                  <div className="mono" style={{ fontSize: 13, color: '#00D4AA', fontWeight: 700 }}>{n.bat}%</div>
                </div>
              )
              if (n.type === 'drive') return (
                <div key={i} style={{ display: 'flex', gap: 12, margin: '2px 0' }}>
                  <div style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                    <div className="timeline-glow" style={{ width: 2, minHeight: 28, borderRadius: 2 }} />
                  </div>
                  <div style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', fontFamily: 'IBM Plex Mono, monospace' }}>
                    ↓ {n.dist} km driven
                  </div>
                </div>
              )
              if (n.type === 'charge') return (
                <div key={i} style={{ display: 'flex', gap: 12, margin: '4px 0' }}>
                  <div style={{ width: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB547', outline: '2px solid rgba(255,181,71,0.3)' }} />
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{n.name}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <div><span style={{ color: 'var(--text-2)' }}>Arrived:</span> <span className="mono" style={{ color: '#FF4D6D', fontWeight: 600 }}>{n.arriveBat}%</span></div>
                      <div><span style={{ color: 'var(--text-2)' }}>Charged:</span> <span className="mono" style={{ color: '#00D4AA', fontWeight: 600 }}>{n.departBat}%</span></div>
                    </div>
                    {n.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{n.time} min</span> charge time
                      </div>
                    )}
                  </div>
                </div>
              )
              if (n.type === 'end') return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF4D6D', boxShadow: '0 0 10px #FF4D6D', zIndex: 2 }} />
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{n.label.split(',')[0]}</div>
                  <div className="mono" style={{ fontSize: 13, color: '#FF4D6D', fontWeight: 700 }}>{n.bat}%</div>
                </div>
              )
              return null
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════ */
function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, fontSize: 11, color: 'var(--text-2)' }}>{icon} {label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   JOURNEY TIMELINE
   Visual Start → Stop → Destination flow
   ═══════════════════════════════════════════════════════ */
function JourneyTimeline({ route, startLoc, endLoc, onStopClick }) {
  const stops = route?.charging_stops || []

  // Compute real distances between consecutive points (start → stop1 → stop2 → ... → end)
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Build waypoint list: start → each stop → end
  const routeCoords = route?.route_coords || []
  const startPt = routeCoords[0] || [0, 0]
  const endPt = routeCoords[routeCoords.length - 1] || [0, 0]

  const points = [
    { lat: startPt[0], lng: startPt[1] },
    ...stops.map(s => ({ lat: s.latitude || s.lat, lng: s.longitude || s.lng })),
    { lat: endPt[0], lng: endPt[1] },
  ]

  const segDistances = []
  for (let i = 0; i < points.length - 1; i++) {
    segDistances.push(Math.round(haversine(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng)))
  }

  const nodeDot = (color) => ({
    width: 10, height: 10, borderRadius: '50%',
    background: color, flexShrink: 0,
    boxShadow: `0 0 8px ${color}60`,
    marginTop: 2,
  })

  const Connector = ({ dist }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', margin: '4px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 4, flexShrink: 0 }}>
        <div style={{ width: 2, flex: 1, minHeight: 22, background: 'var(--border)', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
        ~{dist} km
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* START */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={nodeDot('#00D4AA')} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {startLoc?.split(',')[0] || 'Start'}
        </span>
      </div>

      {stops.map((stop, i) => (
        <div key={i}>
          <Connector dist={segDistances[i] || '?'} />
          <button
            onClick={() => onStopClick({ stop, index: i })}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'rgba(255,181,71,0.05)', border: '1px solid rgba(255,181,71,0.18)', borderRadius: 10, padding: '9px 11px', cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'Outfit, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,181,71,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,181,71,0.05)'}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,181,71,0.12)', border: '1px solid rgba(255,181,71,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap style={{ width: 13, height: 13, color: '#FFB547' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.station_name || stop.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                {stop.charger_power_kw || stop.power_kw || '?'} kW · {stop.charging_time_minutes} min · Stop #{i + 1}
              </div>
            </div>
            <ChevronRight style={{ width: 13, height: 13, color: 'var(--text-3)', flexShrink: 0 }} />
          </button>
        </div>
      ))}

      <Connector dist={segDistances[segDistances.length - 1] || '?'} />

      {/* END */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={nodeDot('#FF4D6D')} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {endLoc?.split(',')[0] || 'Destination'}
        </span>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>
        Tap a stop for full charger details
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOADING MESSAGES
   ═══════════════════════════════════════════════════════ */
const LOADING_MSGS = [
  'Scanning 1,200+ chargers…',
  'Mapping optimal route…',
  'Calculating charging stops…',
  'Checking real-world range…',
  'Almost there…',
]

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function RoutePlanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const {
    selectedCar,
    currentBatteryPercent, setCurrentBatteryPercent,
    addToast, addToHistory,
    tripHistory,
  } = useStore()
  const { user, saveTrip } = useAuth()
  const isDark = useStore((s) => s.theme) === 'dark'
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const hasRestoredRef = useRef(false)

  const [startLoc, setStartLoc] = useState('')
  const [endLoc, setEndLoc] = useState('')
  const [startCoords, setStartCoords] = useState(null)
  const [endCoords, setEndCoords] = useState(null)
  const [mapCenter, setMapCenter] = useState([22.97, 78.66])
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const [showSummary, setShowSummary] = useState(false)
  const [routingErr, setRoutingErr] = useState(null)
  const [routeKey, setRouteKey] = useState(0)
  const [partialWarning, setPartialWarning] = useState(null)

  // Mobile Bottom Sheet — 3-state: 'peek' | 'half' | 'full'
  const [sheetOpen, setSheetOpen] = useState('half')
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchEndY, setTouchEndY] = useState(0)

  const handleTouchStart = (e) => setTouchStartY(e.targetTouches[0].clientY)
  const handleTouchMove = (e) => setTouchEndY(e.targetTouches[0].clientY)
  const handleTouchEnd = () => {
    if (!touchStartY || !touchEndY) return
    const distance = touchStartY - touchEndY
    if (distance > 40) {
      // Swipe up: peek → half → full
      setSheetOpen(prev => prev === 'peek' ? 'half' : prev === 'half' ? 'full' : 'full')
    }
    if (distance < -40) {
      // Swipe down: full → half → peek
      setSheetOpen(prev => prev === 'full' ? 'half' : prev === 'half' ? 'peek' : 'peek')
    }
    setTouchStartY(0)
    setTouchEndY(0)
  }

  /* ═══ INITIALIZATION & SYNC ═══ */
  const [selectedStop, setSelectedStop] = useState(null)
  const [gaugeExpanded, setGaugeExpanded] = useState(true)
  const [locating, setLocating] = useState(false)
  const [waypoints, setWaypoints] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => { if (!selectedCar) navigate('/select-brand') }, [selectedCar, navigate])

  const [sharedRoutePending, setSharedRoutePending] = useState(false)

  /* ── Restore route from Dashboard (location.state) ── */
  useEffect(() => {
    if (hasRestoredRef.current) return
    const state = location.state
    if (state?.restoreTrip) {
      hasRestoredRef.current = true
      const trip = state.restoreTrip
      if (trip.startCoords) { setStartCoords(trip.startCoords); setMapCenter(trip.startCoords) }
      if (trip.endCoords) setEndCoords(trip.endCoords)
      if (trip.startLoc) setStartLoc(trip.startLoc)
      if (trip.endLoc) setEndLoc(trip.endLoc)
      if (trip.waypoints) setWaypoints(trip.waypoints)
      if (trip.route) {
        setRoute(trip.route)
        setRouteKey(k => k + 1)
        addToast('success', 'Route restored from your trip history')
      }
      // Clear the state so refresh doesn't re-restore
      window.history.replaceState({}, '')
      return
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  /* ── Parse shared URL params + auto-calculate ── */
  useEffect(() => {
    if (hasRestoredRef.current) return
    const params = new URLSearchParams(window.location.search)
    const fromStr = params.get('from')
    const fromName = params.get('fromName')
    const toStr = params.get('to')
    const toName = params.get('toName')

    const wpCoordsStr = params.get('wpCoords')
    const wpLabelsStr = params.get('wpLabels')

    if (fromStr && fromName) {
      const [lat, lng] = fromStr.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        hasRestoredRef.current = true
        setStartLoc(fromName); setStartCoords([lat, lng]); setMapCenter([lat, lng])
        
        let initialWps = []
        if (wpCoordsStr) {
          const coordsArr = wpCoordsStr.split('|')
          const labelsArr = wpLabelsStr ? wpLabelsStr.split('|') : []
          initialWps = coordsArr.map((cStr, i) => {
            const c = cStr.split(',').map(Number)
            return { coords: c, label: labelsArr[i] || '' }
          })
          setWaypoints(initialWps)
        }

        if (toStr && toName) {
          const [tlat, tlng] = toStr.split(',').map(Number)
          if (!isNaN(tlat) && !isNaN(tlng)) {
            setEndLoc(toName); setEndCoords([tlat, tlng])
            setTimeout(() => setSharedRoutePending(true), 100)
          }
        }
        return
      }
    }
    // No hardcoded default — user picks their own start location
  }, [])

  /* ── Cycle loading messages ── */
  useEffect(() => {
    if (!loading) { setLoadingMsg(LOADING_MSGS[0]); return }
    let i = 0
    const iv = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]) }, 1800)
    return () => clearInterval(iv)
  }, [loading])

  const handleStartSelect = useCallback((coords) => {
    if (!coords) { setStartCoords(null); return }
    setStartCoords(coords); setMapCenter(coords)
  }, [])

  const handleEndSelect = useCallback((coords) => {
    if (!coords) { setEndCoords(null); return }
    setEndCoords(coords); setMapCenter(coords)
    addToast('info', 'Destination pinned — tap Find Best Route')
  }, [addToast])

  /* ── Use my location ── */
  const handleLocateMe = () => {
    if (!navigator.geolocation) { addToast('error', 'Geolocation not supported by your browser'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`)
          const data = await res.json()
          const p = data.features?.[0]?.properties || {}
          const label = [p.name, p.city || p.town, p.state].filter(Boolean).slice(0, 2).join(', ')
            || `${lat.toFixed(3)}, ${lng.toFixed(3)}`
          setStartLoc(label); setStartCoords([lat, lng]); setMapCenter([lat, lng])
          addToast('success', 'Location found!')
        } catch {
          setStartLoc(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setStartCoords([lat, lng]); setMapCenter([lat, lng])
        }
        setLocating(false)
      },
      () => { addToast('error', 'Could not get location — check permissions'); setLocating(false) },
      { timeout: 8000 }
    )
  }

  /* ── Swap locations ── */
  const handleSwap = () => {
    const [sl, sc, el, ec] = [startLoc, startCoords, endLoc, endCoords]
    setStartLoc(el); setStartCoords(ec)
    setEndLoc(sl); setEndCoords(sc)
    if (ec) setMapCenter(ec)
  }

  /* ── Share route ── */
  const handleShare = () => {
    if (!startCoords || !endCoords) { addToast('warning', 'Plan a route first to share it'); return }
    const params = new URLSearchParams({
      from: startCoords.join(','), fromName: startLoc,
      to: endCoords.join(','), toName: endLoc,
    })
    
    const validWps = waypoints.filter(wp => wp.coords)
    if (validWps.length > 0) {
      params.append('wpCoords', validWps.map(wp => wp.coords.join(',')).join('|'))
      params.append('wpLabels', validWps.map(wp => wp.label).join('|'))
    }
    
    const url = `${window.location.origin}/plan-route?${params.toString()}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => addToast('success', 'Route link copied to clipboard!'))
    } else {
      addToast('info', 'Share: ' + url)
    }
  }

  /* ── Calculate route ── */
  const handleCalculate = async () => {
    if (!startCoords || !endCoords) { addToast('warning', 'Pick both locations from the dropdown'); return }
    setLoading(true); setPartialWarning(null)
    try {
      const res = await fetch(`${API_URL}/api/route/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startCoords[0], start_lng: startCoords[1],
          end_lat: endCoords[0], end_lng: endCoords[1],
          current_battery_percent: currentBatteryPercent,
          car_model_id: selectedCar.id,
          waypoints: waypoints
            .filter(wp => wp.coords)
            .map(wp => ({ lat: wp.coords[0], lng: wp.coords[1], label: wp.label || '' })),
        }),
      })
      if (!res.ok) {
        let errMsg = 'Route calculation failed'
        try { const e = await res.json(); if (e?.detail) errMsg = e.detail } catch (_) { }
        setRoutingErr(errMsg)
        addToast('error', errMsg)
        setLoading(false)
        return
      }
      const data = await res.json()
      setRoutingErr(null)
      setRoute(data); setRouteKey(k => k + 1)
      setLoading(false) // Give immediate UI feedback that calculation is done

      if (data.low_battery_mode) {
        setPartialWarning({ message: data.message, uncoveredKm: 0, lowBattery: true })
        addToast('warning', data.message)
      } else if (data.partial_route && data.coverage_warning) {
        setPartialWarning({ message: data.coverage_warning, uncoveredKm: data.uncovered_km })
        addToast('warning', `Partial route — last ~${data.uncovered_km} km has no charger coverage`)
      } else {
        setPartialWarning(null)
        if (data.low_arrival_warning) {
          addToast('warning', data.low_arrival_warning)
        } else {
          addToast('success', `Route found — ${data.total_distance_km} km · ${data.estimated_total_time_minutes} min`)
        }
      }

      // Non-blocking background tasks
      try {
        addToHistory({ car: selectedCar, route: data, date: new Date().toISOString(), startLoc, endLoc, startCoords, endCoords, waypoints })
        if (user) saveTrip(user.id, { startCoords, endCoords, route: data }).catch(() => { })
      } catch (e) {
        console.error('Background task failed', e)
      }

      if (isMobile && data) setSheetOpen('half')
    } catch (err) {
      console.error(err)
      addToast('error', 'Route calculation failed — check backend')
    } finally {
      setLoading(false)
    }
  }

  /* ── Effect to auto-calculate shared route once dependencies are met ── */
  useEffect(() => {
    if (sharedRoutePending && startCoords && endCoords && selectedCar) {
      setSharedRoutePending(false)
      handleCalculate()
    }
  }, [sharedRoutePending, startCoords, endCoords, selectedCar]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputFocus = (e) => {
    if (isMobile) {
      setSheetOpen('full')
      setIsTyping(true)
      const target = e.target
      setTimeout(() => {
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 350)
    }
  }

  const handleInputBlur = () => {
    if (isMobile) {
      setIsTyping(false)
    }
  }

  if (!selectedCar) return null

  const recentRoutes = (tripHistory || []).filter(h => h.startLoc && h.endLoc).slice(-3).reverse()
  const batteryColor = currentBatteryPercent > 50 ? 'var(--accent)' : currentBatteryPercent > 20 ? '#FBBF24' : '#FF4D6D'
  const estKmCompact = Math.round((selectedCar.range_km || 300) * currentBatteryPercent / 100 * 0.78)
  const ctaReady = !!(startCoords && endCoords && !route && !loading)

  /* ════════════════════════════════════════════════════
     SIDEBAR CONTENT
     ════════════════════════════════════════════════════ */
  const sidebarContent = (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Dashboard EV Gauge (Restored Premium Visualization) ── */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 12px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>Initial Charge</p>
        </div>
        
        {/* Circular Battery visual & Stats */}
        <BatteryGauge percent={currentBatteryPercent} maxRangeKm={selectedCar.range_km || 300} />
        
        {/* Adjustment Slider */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Adjust</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: batteryColor }}>{currentBatteryPercent}%</span>
          </div>
          <input type="range" min="5" max="100" value={currentBatteryPercent}
            onChange={e => setCurrentBatteryPercent(parseInt(e.target.value))}
            className="range-slider"
            style={{ width: '100%', background: `linear-gradient(to right, ${batteryColor} 0%, ${batteryColor} ${currentBatteryPercent}%, var(--surface-3) ${currentBatteryPercent}%, var(--surface-3) 100%)` }}
          />
        </div>
      </div>

      {/* ── Unified Route Timeline ── */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px', paddingLeft: 10, position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 12, marginLeft: 4 }}>Trip Timeline</p>
        
        {/* The glowing connecting vertical line */}
        <div className="timeline-glow" style={{ position: 'absolute', left: 32, top: 75, bottom: 45, width: 2, borderRadius: 2, zIndex: 1 }} />
        
        {/* Start input */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, position: 'relative', zIndex: 10 }}>
          <div style={{ flex: 1 }}>
            <LocationInput value={startLoc} onChange={setStartLoc} onSelect={handleStartSelect} placeholder="Starting Point" accent="#00D4AA" onInputFocus={handleInputFocus} onInputBlur={handleInputBlur} />
          </div>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            title="Use my location"
            style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: locating ? 'rgba(0,212,170,0.15)' : 'var(--surface-3)', border: '1px solid var(--border)', cursor: locating ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!locating) { e.currentTarget.style.borderColor = '#00D4AA'; e.currentTarget.style.background = 'rgba(0,212,170,0.08)' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = locating ? 'rgba(0,212,170,0.15)' : 'var(--surface-3)' }}
          >
            {locating
              ? <Loader2 style={{ width: 16, height: 16, color: '#00D4AA', animation: 'spin 0.8s linear infinite' }} />
              : <Crosshair style={{ width: 16, height: 16, color: 'var(--text-2)' }} />
            }
          </button>
        </div>

        {/* Waypoints */}
        {waypoints.map((wp, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, position: 'relative', zIndex: 9 - idx }}>
            <div style={{ flex: 1 }}>
              <LocationInput
                value={wp.label}
                onChange={(v) => setWaypoints(w => w.map((item, i) => i === idx ? { ...item, label: v } : item))}
                onSelect={(coords) => setWaypoints(w => w.map((item, i) => i === idx ? { ...item, coords } : item))}
                placeholder={`Stop ${idx + 1}`}
                accent="#FFB547"
                onInputFocus={handleInputFocus}
                onInputBlur={handleInputBlur}
              />
            </div>
            <button
              onClick={() => setWaypoints(w => w.filter((_, i) => i !== idx))}
              style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 style={{ width: 14, height: 14, color: 'var(--error)' }} />
            </button>
          </div>
        ))}

        {/* Add stop button along timeline */}
        {waypoints.length < 5 && (
          <div style={{ paddingLeft: 46, marginBottom: 8, position: 'relative', zIndex: 4 }}>
            <button
              onClick={() => setWaypoints(w => [...w, { label: '', coords: null }])}
              style={{ border: 'none', background: 'none', color: '#FFB547', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,181,71,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus style={{ width: 10, height: 10 }} />
              </div>
              Add Stop
            </button>
          </div>
        )}

        {/* Destination */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative', zIndex: 3 }}>
          <div style={{ flex: 1 }}>
            <LocationInput value={endLoc} onChange={setEndLoc} onSelect={handleEndSelect} placeholder="Destination" accent="#FF4D6D" onInputFocus={handleInputFocus} onInputBlur={handleInputBlur} />
          </div>
          <button
            onClick={handleSwap}
            title="Swap start and destination"
            style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
          >
            <ArrowUpDown style={{ width: 14, height: 14, color: 'inherit' }} />
          </button>
        </div>
      </div>

      {/* ── Route results ── */}
      {route && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>Route Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon={<MapPin className="w-3 h-3" />} label="Distance" value={`${route.total_distance_km} km`} />
            <StatCard icon={<Clock className="w-3 h-3" />} label="Total Time" value={`${Math.floor(route.estimated_total_time_minutes / 60)}h ${route.estimated_total_time_minutes % 60}m`} />
          </div>

          {route.needs_charging ? (
            <div style={{ background: 'rgba(255,181,71,0.04)', border: '1px solid rgba(255,181,71,0.18)', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap className="w-4 h-4" style={{ color: '#FFB547' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFB547' }}>
                  {route.charging_stops.length} charging stop{route.charging_stops.length !== 1 ? 's' : ''}
                </span>
              </div>
              <JourneyTimeline
                route={route}
                startLoc={startLoc}
                endLoc={endLoc}
                onStopClick={setSelectedStop}
              />
            </div>
          ) : (
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Direct trip possible</p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Arriving with ~{route.battery_at_arrival_pct}% battery</p>
              </div>
            </div>
          )}

          {/* Low arrival warning for direct routes */}
          {route.low_arrival_warning && (
            <div style={{ background: 'rgba(255,181,71,0.08)', border: '1.5px solid rgba(255,181,71,0.35)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle style={{ width: 15, height: 15, color: '#FFB547', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#FFB547', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{route.low_arrival_warning}</p>
            </div>
          )}

          {/* ── Partial route warning panel ── */}
          {partialWarning && (
            <div style={{ background: partialWarning.lowBattery ? 'rgba(255,77,109,0.06)' : 'rgba(255,181,71,0.06)', border: `1.5px solid ${partialWarning.lowBattery ? 'rgba(255,77,109,0.38)' : 'rgba(255,181,71,0.38)'}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: partialWarning.lowBattery ? 'rgba(255,77,109,0.13)' : 'rgba(255,181,71,0.13)', borderBottom: `1px solid ${partialWarning.lowBattery ? 'rgba(255,77,109,0.22)' : 'rgba(255,181,71,0.22)'}`, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 14, height: 14, color: partialWarning.lowBattery ? '#FF4D6D' : '#FFB547', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: partialWarning.lowBattery ? '#FF4D6D' : '#FFB547', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {partialWarning.lowBattery ? 'Low Battery · Charge First' : 'Partial Route · Coverage Gap'}
                </span>
              </div>
              {/* Body */}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Gap pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 20, padding: '5px 13px', alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FF4D6D', fontFamily: 'IBM Plex Mono, monospace' }}>~{partialWarning.uncoveredKm} km</span>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>without charger data</span>
                </div>
                {/* Message */}
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{partialWarning.message}</p>
                {/* Checklist */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>Before you depart</p>
                  {['Charge to 100% at the last confirmed stop', 'Check Tata Power / BPCL Pulse app for this region', "Call ahead — some stations aren't listed online yet"].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                      <span style={{ color: '#FFB547', fontSize: 12, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
                {/* Map legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="36" height="8"><line x1="0" y1="4" x2="36" y2="4" stroke="#FFB547" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Dashed line on map = uncovered segment</span>
                </div>
              </div>
            </div>
          )}

          {/* Summary + Share */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSummary(true)}>
              <Navigation className="w-4 h-4" />View Trip Summary
            </button>
            <button
              className="btn-secondary"
              title="Share this route"
              style={{ width: 44, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleShare}
            >
              <Share2 style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* ── CTA footer ── */
  const footerCTA = (
    <div style={{ padding: '12px 14px', background: isDark ? 'rgba(7,11,20,0.85)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--border)', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 10 }}>
      {route ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(() => {
            const allStops = route.charging_stops || [];
            if (allStops.length <= 8) {
              return (
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: isMobile ? '8px 12px' : '12px', fontSize: isMobile ? 12 : 14, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,212,170,0.2)', minHeight: isMobile ? 40 : 44 }}
                  onClick={() => {
                    const origin = `${startCoords[0]},${startCoords[1]}`;
                    const destination = `${endCoords[0]},${endCoords[1]}`;
                    const wps = allStops.map(stop => `${stop.lat},${stop.lng}`).join('|');
                    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                    if (wps) url += `&waypoints=${wps}`;
                    url += '&travelmode=driving';
                    window.open(url, '_blank');
                  }}
                >
                  <MapPinIcon className="w-5 h-5" style={{ marginRight: 8 }} /> Start Navigation in G-Maps
                </button>
              );
            } else {
              const chunks = [];
              for (let i = 0; i < allStops.length; i += 8) {
                chunks.push(allStops.slice(i, i + 8));
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 18, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
                    <MapPinIcon style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Route too long for one map. Pick a leg:</span>
                  </div>
                  {chunks.map((chunk, idx) => {
                    const isLast = idx === chunks.length - 1;
                    return (
                      <button
                        key={idx}
                        className="btn-primary"
                        style={{ width: '100%', padding: isMobile ? '7px 10px' : '10px', fontSize: isMobile ? 11 : 13, borderRadius: 10, boxShadow: '0 4px 15px rgba(0,212,170,0.1)', minHeight: isMobile ? 36 : 40 }}
                        onClick={() => {
                          const legOrigin = idx === 0 
                            ? `${startCoords[0]},${startCoords[1]}` 
                            : `${chunks[idx-1][chunks[idx-1].length-1].lat},${chunks[idx-1][chunks[idx-1].length-1].lng}`;
                            
                          const legDest = isLast 
                            ? `${endCoords[0]},${endCoords[1]}` 
                            : `${chunk[chunk.length-1].lat},${chunk[chunk.length-1].lng}`;
                          
                          const wpArr = isLast ? chunk : chunk.slice(0, -1);
                          const wps = wpArr.map(stop => `${stop.lat},${stop.lng}`).join('|');
                            
                          let url = `https://www.google.com/maps/dir/?api=1&origin=${legOrigin}&destination=${legDest}&travelmode=driving`;
                          if (wps) url += `&waypoints=${wps}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Navigate Leg {idx + 1} <span style={{ opacity: 0.7, marginLeft: 6, fontSize: 12 }}>({chunk.length} stops)</span>
                      </button>
                    )
                  })}
                </div>
              );
            }
          })()}
          <button
            className="btn-secondary"
            style={{ width: '100%', padding: isMobile ? '8px 12px' : '11px', fontSize: isMobile ? 12 : 13, borderRadius: 12, background: 'var(--surface-3)', border: '1px solid var(--border)', minHeight: isMobile ? 40 : 44 }}
            onClick={handleCalculate}
            disabled={loading || !startCoords || !endCoords}
          >
            {loading
              ? <>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                {loadingMsg}
              </>
              : <><Navigation className="w-4 h-4" />Update Route Data</>
            }
          </button>
        </div>
      ) : (
        <button
          className="btn-primary pulse-cta"
          style={{ width: '100%', padding: isMobile ? '8px 12px' : '12px', fontSize: isMobile ? 13 : 15, borderRadius: 12, background: 'linear-gradient(135deg, #00D4AA 0%, #00a887 100%)', boxShadow: '0 8px 24px rgba(0,212,170,0.25)', minHeight: isMobile ? 40 : 48 }}
          onClick={handleCalculate}
          disabled={loading || !startCoords || !endCoords}
        >
          {loading
            ? <>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              {loadingMsg}
            </>
            : <><Zap className="w-5 h-5" style={{ color: '#000' }} /><span style={{ color: '#000', fontWeight: 700 }}>Find Best Route</span></>
          }
        </button>
      )}
      {(!startCoords || !endCoords) && !loading && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          {!startCoords ? 'Set your start location above' : 'Set your destination above'}
        </p>
      )}

      {/* ── Subtle disclaimer link ── */}
      <button
        onClick={() => setShowDisclaimer(d => !d)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'var(--text-2)', opacity: 0.8, fontWeight: 600,
          textAlign: 'center', width: '100%', marginTop: 8,
          fontFamily: 'Outfit, sans-serif', padding: '4px 0',
          transition: 'opacity 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#FFB547'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.color = 'var(--text-2)'; }}
      >
        {showDisclaimer ? '▾ Close disclaimer' : '⚠ Important disclaimer'}
      </button>
      {showDisclaimer && (
        <div style={{
          background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.15)',
          borderRadius: 10, padding: '10px 12px', marginTop: 6,
          fontSize: 11, lineHeight: 1.6, color: 'var(--text-2)',
          animation: 'fade-up 0.2s ease',
        }}>
          <p style={{ fontWeight: 700, color: '#FFB547', marginBottom: 4, fontSize: 12 }}>⚠ Disclaimer</p>
          <p>
            Routelect provides <strong>estimated</strong> route plans based on manufacturer specifications and 
            publicly available charger data. Actual range may vary significantly due to driving conditions, 
            weather, elevation, vehicle health, and charger availability. <strong>Always verify charger 
            status before departing</strong> and maintain a safe battery margin. Routelect is not liable 
            for any inconvenience, breakdown, or damage resulting from route suggestions. Use at your own discretion.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <SEO 
        title="Plan Route" 
        description="Calculate the best and most optimal charging stops for your EV trip in India. Accurate to your car model, battery health, and driving conditions."
      />

      {/* ── Leaflet popup overrides + pulse CTA ── */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: var(--surface) !important;
          border: 1px solid var(--border) !important;
          border-radius: 14px !important;
          box-shadow: 0 14px 44px rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          color: var(--text-1) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          color: var(--text-1) !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .leaflet-popup-tip {
          background: var(--surface) !important;
          box-shadow: none !important;
        }
        .leaflet-popup-close-button {
          color: var(--text-3) !important;
          font-size: 18px !important;
          top: 8px !important; right: 10px !important;
          width: 22px !important; height: 22px !important;
          line-height: 22px !important;
        }
        .leaflet-popup-close-button:hover { color: var(--text-1) !important; }

        @keyframes pulse-cta {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,212,170,0.45); }
          50%      { box-shadow: 0 0 0 9px rgba(0,212,170,0); }
        }
        .pulse-cta { animation: pulse-cta 2.2s ease-in-out infinite !important; }

        @keyframes loading-text-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }

        /* Logo Drawing Animations */
        @keyframes draw-path-loop {
          0%, 5% { stroke-dashoffset: 1500; opacity: 0; }
          15% { opacity: 1; }
          45%, 65% { stroke-dashoffset: 0; opacity: 1; }
          85% { opacity: 0; }
          100% { stroke-dashoffset: 1500; opacity: 0; }
        }
        @keyframes accent-fade-loop {
          0%, 55% { opacity: 0; }
          70%, 85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes logo-glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(74,190,161,0.25)); }
          50% { filter: drop-shadow(0 0 15px rgba(74,190,161,0.5)); }
        }

        .logo-path-pin {
          stroke-dasharray: 1500;
          stroke-dashoffset: 1500;
          animation: draw-path-loop 4s ease-in-out infinite;
        }
        .logo-path-main {
          stroke-dasharray: 1500;
          stroke-dashoffset: 1500;
          animation: draw-path-loop 4s ease-in-out 0.4s infinite;
        }
        .logo-path-accent {
          opacity: 0;
          animation: accent-fade-loop 4s ease-in-out infinite;
        }
        .logo-paths-group {
          animation: logo-glow 3s ease-in-out infinite;
        }
        
        .logo-svg-container {
          animation: logo-float 4s ease-in-out infinite;
        }

        @keyframes logo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

      `}</style>

      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', marginTop: 56 }}>

        {/* ═══ DESKTOP SIDEBAR ═══ */}
        {!isMobile && (
          <div className="glass-sidebar no-scrollbar" style={{ width: 370, height: '100%', position: 'relative', zIndex: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <button className="btn-ghost" style={{ marginLeft: -8 }} onClick={() => navigate('/select-brand')}>
                  <ChevronLeft className="w-3.5 h-3.5" />Change vehicle
                </button>
              </div>
              {/* Car name prominent, "Route Planner" as small label */}
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 1 }}>Route Planner</p>
              <h1 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 0 }}>
                {selectedCar.brand} {selectedCar.name || selectedCar.model}
              </h1>
            </div>
            {sidebarContent}
            {footerCTA}
          </div>
        )}

        {/* ═══ MAP ═══ */}
        <div className={`${isDark ? 'dark-tiles' : ''}${route?.route_coords ? ' route-active' : ''}`} style={{ flex: 1, position: 'relative', zIndex: 0, height: '100%' }}>

          {/* ═══ FULL-SCREEN LOADING OVERLAY ═══ */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 500,
              background: isDark ? 'rgba(7, 11, 20, 0.7)' : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20,
              animation: 'fade-in 0.3s ease',
            }}>
              {/* Animated spinner ring */}
              <div className="logo-svg-container" style={{ position: 'relative', width: 90, height: 90, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="260 160 330 480" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <g className="logo-paths-group">
                    <path className="logo-path-pin" style={{ fill: 'transparent', stroke: 'var(--accent)', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 3 }} d="M389.25,224.84c-29,0.5-64.54,29.54-54.97,73c0.97,6.5,29.86,57.79,54.97,88.5 c22.18-27.25,55-80,56-89C454.25,257.34,423.25,224.34,389.25,224.84z M389.75,316.34c-18.5,0-33.5-15-33.5-33.5s15-33.5,33.5-33.5s33.5,15,33.5,33.5 S408.25,316.34,389.75,316.34z"/>
                    <path className="logo-path-main" style={{ fill: 'transparent', stroke: 'var(--accent)', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 3 }} d="M510.25,499.34l-27,23l-33-49c24.99-14.76,47.18-31.85,61-49 c38.74-43.63,55.84-169.82-28-230c-112.28-77.49-241.16,8.11-204,120 c13.13,39.08,36.88,80.05,70.88,122.85c8-4.09,16.39-8.03,25.12-11.85 c-32.07-32.97-54.88-68.65-72-106c-22.5-60.5,17.32-122.61,83-125 c65.14-2.37,99.18,48.21,85,123c-12.56,50.62-47.98,84.05-96,108 l-25,12c-0.04-0.05-0.08-0.1-0.12-0.15 c-53.89,27.49-89.96,61.71-90.49,112.65v70 c0.61,14.5,15.61,38.5,39.61,38.5c32,0,42-23,42.18-38.5l0.34-70 c-0.52-12.5,29.32-33.19,50.48-44.5l79,119l26-28l85,81L510.25,499.34z M318.25,549.34v70.37c0,7.63-8,9.63-17,9.63c-10,0-18-4-18.03-9.5v-70 c0.03-63.5,49.6-83.37,119.03-116.17c94-47.33,110.4-134.11,86.5-208.83 c59.5,82.5,44.5,191.5-86.5,247.81 C358.25,492.34,320.25,523.34,318.25,549.34z M496.25,569.34l-24,20l-62-93l25-15l46,66l24-15l33,77L496.25,569.34z"/>
                    <polygon className="logo-path-accent" style={{ fill: 'transparent', stroke: 'var(--accent)', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 3 }} points="374.61,424.96 349.73,436.32 351.09,439.16 375.98,427.8"/>
                  </g>
                </svg>
              </div>

              {/* Cycling loading text */}
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700,
                  color: 'var(--text-1)', marginBottom: 6,
                  animation: 'loading-text-pulse 1.8s ease infinite',
                }}>
                  {loadingMsg}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  This may take a few seconds for long routes
                </p>
              </div>

              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--accent)',
                    opacity: 0.3,
                    animation: `pulse-dot 1.5s ease ${i * 0.25}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <MapContainer center={mapCenter} zoom={6} zoomControl style={{ width: '100%', height: '100%' }}>
            {/* Standard OSM tiles — maximum detail; dark mode via CSS invert */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              maxZoom={19}
            />
            <FlyTo center={mapCenter} />
            {startCoords && endCoords && <FitBounds start={startCoords} end={endCoords} />}

            {startCoords && (
              <Marker position={startCoords} icon={startIcon}>
                <Popup>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>📍 {startLoc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Start</div>
                </Popup>
              </Marker>
            )}
            {endCoords && (
              <Marker position={endCoords} icon={endIcon}>
                <Popup>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🏁 {endLoc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Destination</div>
                </Popup>
              </Marker>
            )}

            {waypoints.map((wp, i) =>
              wp.coords ? (
                <Marker key={`wp-${i}`} position={wp.coords} icon={waypointIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>🛑 {wp.label || `Stop ${i + 1}`}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>User added stop</div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {route?.charging_stops?.map((stop, i) =>
              stop.lat && stop.lng ? (
                <Marker key={i} position={[stop.lat, stop.lng]} icon={chargerIcon}
                  eventHandlers={{ click: () => setSelectedStop({ stop, index: i }) }}>
                  <Popup>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>⚡ {stop.station_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Stop #{i + 1} · {stop.charging_time_minutes} min</div>
                    <button onClick={() => setSelectedStop({ stop, index: i })} style={{ marginTop: 7, fontSize: 11, color: '#00D4AA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Outfit' }}>
                      View details →
                    </button>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Dual polyline: white glow + teal on top + animated pulse */}
            {route?.route_coords && <>
              <Polyline key={`glow-${routeKey}`} positions={route.route_coords} pathOptions={{ color: isDark ? '#ffffff' : '#000000', weight: 9, opacity: isDark ? 0.07 : 0.06, lineCap: 'round', lineJoin: 'round' }} />
              <Polyline key={`line-${routeKey}`} positions={route.route_coords} pathOptions={{ color: isDark ? '#00D4AA' : '#0E7660', weight: isDark ? 3.5 : 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
              <Polyline key={`pulse-${routeKey}`} positions={route.route_coords} pathOptions={{ color: isDark ? '#ffffff' : '#00D4AA', weight: 3.5, opacity: isDark ? 0.8 : 0.5, className: 'energy-pulse-line' }} />
            </>}

            {/* Dashed amber line: last confirmed stop → destination (coverage gap) */}
            {route?.partial_route && route?.charging_stops?.length > 0 && endCoords && (() => {
              const last = route.charging_stops[route.charging_stops.length - 1]
              const lp = [last.lat ?? last.latitude, last.lng ?? last.longitude]
              if (!lp[0] || !lp[1]) return null
              return <>
                <Polyline key={`gap-glow-${routeKey}`} positions={[lp, endCoords]} pathOptions={{ color: '#FFB547', weight: 12, opacity: 0.07, lineCap: 'round' }} />
                <Polyline key={`gap-dash-${routeKey}`} positions={[lp, endCoords]} pathOptions={{ color: '#FFB547', weight: 2.5, opacity: 0.85, dashArray: '7 9', lineCap: 'round' }} />
              </>
            })()}

            {/* Road/highway name labels along the route */}
            {route?.road_names?.map((road, i) => (
              <Marker
                key={`road-label-${i}`}
                position={[road.lat, road.lng]}
                icon={L.divIcon({
                  className: 'road-label-icon',
                  html: `<span class="road-label ${isDark ? 'dark' : 'light'}">${road.name}</span>`,
                  iconSize: null,
                  iconAnchor: [0, 12],
                })}
                interactive={false}
              />
            ))}
          </MapContainer>

          {/* Map hint */}
          {!route && !loading && (
            <div style={{ position: 'absolute', bottom: isMobile ? '56vh' : 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <div style={{ padding: '8px 16px', borderRadius: 100, background: isDark ? 'rgba(7,11,20,0.92)' : 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', backdropFilter: 'blur(12px)', boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                Type a location → pick suggestion → <strong style={{ color: 'var(--text-1)' }}>Find Best Route</strong>
              </div>
            </div>
          )}

          {/* Mobile FAB removed for a cleaner, professional UI. The user will use the internal chevron button or the drag handle on the bottom sheet. */}
        </div>

        {/* ═══ MOBILE BOTTOM SHEET ═══ */}
        {isMobile && (
          <div
            className="mobile-sheet"
            style={{
              height: sheetOpen === 'full' ? '90dvh'
                : sheetOpen === 'half' ? '55dvh'
                  : route ? '96px' : '88px',
            }}
          >
            {/* Drag handle */}
            <div
              className="sheet-handle"
              onClick={() => setSheetOpen(prev =>
                prev === 'peek' ? 'half' : prev === 'half' ? 'full' : 'half'
              )}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="sheet-handle-bar" />
            </div>

            {/* Sheet header */}
            <div className="sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>
                    {route ? 'Route Found ✓' : 'Route Planner'}
                  </p>
                  {route ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 3 }}>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{route.total_distance_km} km</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{route.charging_stops?.length || 0} stop{route.charging_stops?.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{Math.floor(route.estimated_total_time_minutes / 60)}h {route.estimated_total_time_minutes % 60}m</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {selectedCar.brand} · {selectedCar.name || selectedCar.model}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/select-brand') }}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft style={{ width: 18, height: 18, color: 'var(--text-1)' }} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setSheetOpen(prev => {
                        if (prev === 'peek') {
                          return route ? 'full' : 'half'
                        }
                        return 'peek'
                      })
                    }}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronDown style={{
                      width: 18, height: 18, color: 'var(--text-1)',
                      transition: 'transform 0.3s',
                      transform: sheetOpen === 'peek' ? 'rotate(180deg)' : 'none',
                    }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sheet scrollable content */}
            <div className="sheet-content" style={{
              opacity: sheetOpen !== 'peek' ? 1 : 0,
              transition: 'opacity 0.2s',
              visibility: sheetOpen !== 'peek' ? 'visible' : 'hidden',
              paddingBottom: isTyping ? '55dvh' : undefined,
            }}>
              {sidebarContent}
            </div>
            {sheetOpen !== 'peek' && footerCTA}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSummary && route && (
        <TripSummaryModal 
          route={route} 
          car={selectedCar} 
          startLoc={startLoc}
          endLoc={endLoc}
          startBattery={currentBatteryPercent}
          onClose={() => setShowSummary(false)} 
        />
      )}
      {selectedStop && (
        <ChargerDetailModal
          stop={selectedStop.stop}
          stopIndex={selectedStop.index}
          batteryAtArrival={selectedStop.stop.battery_at_arrival_pct ?? 10}
          onClose={() => setSelectedStop(null)}
        />
      )}
    </div>
  )
}
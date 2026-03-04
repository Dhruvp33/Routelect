import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate }    from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import {
  Navigation, Battery, MapPin, Zap, Clock, ChevronLeft,
  X, Download, AlertTriangle, Car, Loader2, ChevronUp,ChevronRight,
  ExternalLink, Wifi, MapPin as MapPinIcon, Plug,
  ChevronDown
} from 'lucide-react'
import { useStore }  from '../store/useStore'
import { useAuth }   from '../hooks/useAuth'
import { API_URL }   from '../App'
import Navbar        from '../components/Navbar'
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
             filter:drop-shadow(0 0 8px ${color});width:${size*.85}px;height:${size*.85}px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>`,
  iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -size],
})

const mkChargerPin = (clickable = false) => L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:rgba(7,11,20,0.95);border:1.5px solid #FFB547;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,181,71,0.55);cursor:${clickable?'pointer':'default'}">
    <svg viewBox="0 0 24 24" fill="#FFB547" width="18" height="18"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -24],
})

const startIcon    = mkPin('#00D4AA', 44)
const endIcon      = mkPin('#FF4D6D', 44)
const chargerIcon  = mkChargerPin(true)

/* ═══════════════════════════════════════════════════════
   MAP HELPERS
   ═══════════════════════════════════════════════════════ */
function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 9, { duration: 1.4 }) }, [center, map])
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
   Much better POI depth than Nominatim: handles societies,
   localities, street names, landmarks across India.
   India bounding box: bbox=68.7,6.5,97.25,35.5
   ═══════════════════════════════════════════════════════ */
function usePhotonAutocomplete(query, active) {
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const timer = useRef(null)
  const ctrl  = useRef(null)

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
          q:    query.trim(),
          limit: 8,
          bbox: '68.7,6.5,97.25,35.5',  // India bounding box
          lang: 'en',
        })
        const res  = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: ctrl.current.signal })
        const data = await res.json()

        const seen    = new Set()
        const results = []

        for (const f of (data.features || [])) {
          const p    = f.properties || {}
          const coords = f.geometry?.coordinates  // [lng, lat]
          if (!coords) continue

          // Build label — Photon gives very detailed locality data
          const parts = [
            p.name,
            p.locality || p.suburb || p.district,
            p.city || p.town || p.county,
            p.state,
          ].filter(Boolean)

          const label = parts.slice(0, 3).join(', ')
          if (!label || seen.has(label)) continue
          seen.add(label)

          results.push({
            id:    p.osm_id || Math.random(),
            label,
            sub:   [p.city || p.town || p.county, p.state].filter(Boolean).join(', '),
            type:  p.osm_value || p.type || '',
            lat:   coords[1],
            lng:   coords[0],
          })
        }
        setSuggestions(results)
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
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
   LOCATION INPUT  (reusable, with Photon dropdown)
   ═══════════════════════════════════════════════════════ */
function LocationInput({ value, onChange, onSelect, placeholder, accent = '#00D4AA' }) {
  const [open,    setOpen]    = useState(false)
  const [cursor,  setCursor]  = useState(-1)
  const [touched, setTouched] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  const { suggestions, loading, clear } = usePhotonAutocomplete(value, touched && open)

  // Close on outside click
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setCursor(-1) } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Scroll active row into view
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      listRef.current.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: 'nearest' })
    }
  }, [cursor])

  const pick = (item) => {
    onChange(item.label)
    onSelect([item.lat, item.lng])
    setOpen(false); setCursor(-1); setTouched(false); clear()
  }

  const onKeyDown = (e) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => (c + 1) % suggestions.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => (c - 1 + suggestions.length) % suggestions.length) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(cursor >= 0 ? suggestions[cursor] : suggestions[0]) }
    else if (e.key === 'Escape') { setOpen(false); setCursor(-1) }
  }

  const showDrop = open && touched && (loading || suggestions.length > 0 || value.length >= 3)

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        {/* Coloured dot */}
        <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${accent}`, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="input-field"
          style={{ paddingRight: 34, borderRadius: 10, borderColor: open && suggestions.length ? accent : undefined, boxShadow: open && suggestions.length ? `0 0 0 3px ${accent}18` : undefined }}
          value={value}
          onChange={e => { onChange(e.target.value); setTouched(true); setOpen(true); setCursor(-1) }}
          onFocus={() => { if (value.length >= 3) setOpen(true) }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Right: spinner / clear */}
        <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <Loader2 style={{ width: 13, height: 13, color: 'var(--text-3)', animation: 'spin 0.8s linear infinite' }} />
            : value
              ? <button onMouseDown={e => e.preventDefault()} onClick={() => { onChange(''); onSelect(null); clear(); setTouched(false); inputRef.current?.focus() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              : null
          }
        </div>
      </div>

      {/* Dropdown */}
      {showDrop && (
        <div ref={listRef} role="listbox" className="no-scrollbar animate-fade-up"
          style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999, background: 'var(--surface)', border: `1px solid ${accent}40`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.4)', maxHeight: 300, overflowY: 'auto' }}>

          {/* Loading skeletons */}
          {loading && !suggestions.length && (
            <div style={{ padding: '8px 10px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[80, 60, 72].map((w, i) => <div key={i} className="skeleton" style={{ height: 38, borderRadius: 8 }} />)}
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '2px 0 6px' }}>
                Searching India…
              </div>
            </div>
          )}

          {/* Results */}
          {suggestions.map((item, idx) => (
            <button key={item.id} role="option" data-idx={idx} aria-selected={cursor === idx}
              onMouseDown={e => e.preventDefault()} onClick={() => pick(item)} onMouseEnter={() => setCursor(idx)}
              style={{ width: '100%', background: cursor === idx ? `${accent}10` : 'transparent', border: 'none', borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none', padding: '9px 13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: cursor === idx ? `${accent}18` : 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.1s' }}>
                <MapPin style={{ width: 12, height: 12, color: cursor === idx ? accent : 'var(--text-3)' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Highlight text={item.label} q={value} />
                </div>
                {item.sub && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                )}
              </div>
              {cursor === idx && (
                <span style={{ fontSize: 10, color: accent, opacity: 0.7, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>↵</span>
              )}
            </button>
          ))}

          {/* No results */}
          {!loading && !suggestions.length && value.length >= 3 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
              No results for "<strong style={{ color: 'var(--text-1)' }}>{value}</strong>"
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Try adding area, city, or pincode</div>
            </div>
          )}

          {/* Attribution */}
          {(loading || suggestions.length > 0) && (
            <div style={{ padding: '6px 13px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface-2)' }}>
              <MapPin style={{ width: 9, height: 9 }} />
              Powered by Photon / OpenStreetMap · Free &amp; open
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CHARGER DETAIL MODAL
   Shows all info returned from routing engine / OCM
   ═══════════════════════════════════════════════════════ */
function ChargerDetailModal({ stop, stopIndex, batteryAtArrival = 10, onClose }) {
  if (!stop) return null

  const chargeFrom  = Math.round(batteryAtArrival)
  const chargeTo    = 80
  const chargePct   = chargeTo - chargeFrom
  const gmapsUrl    = stop.lat && stop.lng
    ? `https://maps.google.com/?q=${stop.lat},${stop.lng}`
    : null

  const statusColor = stop.status === 'Operational'
    ? '#00D4AA'
    : stop.status === 'Unknown' ? '#FFB547' : '#FF4D6D'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 440 }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,181,71,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap className="w-4 h-4" style={{ color: '#FFB547' }} />
              </div>
              <span className="badge badge-yellow" style={{ fontSize: 11 }}>Stop #{stopIndex + 1}</span>
              {stop.status && (
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
                  ● {stop.status}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em' }}>{stop.station_name}</h2>
            {stop.operator && (
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>{stop.operator}</p>
            )}
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ flexShrink: 0, marginTop: -4 }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Charging plan for this stop */}
          <div style={{ background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFB547', marginBottom: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
              Charging Plan
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {/* Battery bar: from → to */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginBottom: 5 }}>
                  <span>Arrive at</span>
                  <span>Depart at</span>
                </div>
                <div style={{ position: 'relative', height: 8, background: 'var(--surface-3)', borderRadius: 10, overflow: 'visible' }}>
                  {/* Fill */}
                  <div style={{ position: 'absolute', left: `${chargeFrom}%`, width: `${chargePct}%`, height: '100%', background: 'linear-gradient(to right, #FFB547, #00D4AA)', borderRadius: 10, transition: 'width 0.4s' }} />
                  {/* Arrive marker */}
                  <div style={{ position: 'absolute', left: `${chargeFrom}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: '#FF4D6D', border: '2px solid var(--surface)', zIndex: 1 }} />
                  {/* Depart marker */}
                  <div style={{ position: 'absolute', left: `${chargeTo}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: '#00D4AA', border: '2px solid var(--surface)', zIndex: 1 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 5 }}>
                  <span className="mono" style={{ color: '#FF4D6D' }}>{chargeFrom}%</span>
                  <span className="mono" style={{ color: '#00D4AA' }}>{chargeTo}%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>Charging time</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{stop.charging_time_minutes}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>min</span></div>
              </div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>Energy added</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{stop.charge_added_kwh || '—'}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>kWh</span></div>
              </div>
            </div>
          </div>

          {/* Charger specs */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>Station Details</p>
            {[
              { label: 'Power output',     value: `${stop.charger_power_kw || 50} kW`,             show: true },
              { label: 'Connector type',   value: stop.connector_type || 'CCS Type 2',             show: true },
              { label: 'No. of points',    value: stop.num_points ? `${stop.num_points} plugs` : 'N/A', show: true },
              { label: 'Network',          value: stop.operator || 'Independent',                  show: !!stop.operator },
              { label: 'Cost per unit',    value: stop.usage_cost || 'Contact operator',           show: true },
            ].filter(r => r.show).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                <span className="mono" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Coordinates */}
          {stop.lat && stop.lng && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
              {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Footer */}
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
  const r = 34, circ = 2 * Math.PI * r, arc = 0.75
  const fill  = (percent / 100) * circ * arc
  const color = percent > 50 ? 'var(--accent)' : percent > 20 ? '#FBBF24' : '#FF4D6D'
  const estKm = Math.round(maxRangeKm * percent / 100 * 0.78) // apply real-world factor in display too

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="42" cy="42" r={r} fill="none" strokeWidth="5" stroke="rgba(255,255,255,0.06)" strokeDasharray={`${circ*arc} ${circ*(1-arc)}`} strokeLinecap="round"/>
          <circle cx="42" cy="42" r={r} fill="none" strokeWidth="5" stroke={color} strokeDasharray={`${fill} ${circ-fill}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.45s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 5px ${color})` }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{percent}</span>
          <span style={{ fontSize: 9, color: 'var(--text-3)' }}>%</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>Real-world range</p>
        <p className="mono" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1 }}>
          {estKm}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginLeft: 3 }}>km</span>
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>incl. 15% safety buffer</p>
        {percent < 20 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#FF4D6D', marginTop: 6 }}>
            <AlertTriangle className="w-3 h-3" />Charging stop likely
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TRIP SUMMARY MODAL
   ═══════════════════════════════════════════════════════ */
function TripSummaryModal({ route, car, onClose }) {
  if (!route || !car) return null
  const kwh100    = (car.battery_capacity_kwh / car.range_km) * 100
  const energy    = route.energy_kwh_used ?? +((route.total_distance_km / 100 * kwh100).toFixed(1))
  const cost      = route.estimated_charge_cost_inr ?? Math.round(energy * 8.5)
  const petrol    = Math.round(route.total_distance_km * 7)
  const savings   = Math.max(0, petrol - cost)
  const hrs       = Math.floor(route.estimated_total_time_minutes / 60)
  const mins      = route.estimated_total_time_minutes % 60
  const co2       = (route.total_distance_km * 0.12).toFixed(1)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
        </div>
        <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Trip Summary</h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{car.brand} · {car.name || car.model}</p>
          </div>
          <button className="btn-ghost" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { e: '📍', l: 'Distance',  v: `${route.total_distance_km} km` },
              { e: '⏱️', l: 'Total Time', v: `${hrs}h ${mins}m` },
              { e: '⚡', l: 'Stops',      v: `${route.charging_stops?.length || 0}` },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{m.e}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{m.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>{m.l}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 14 }}>Cost Analysis</p>
            {[
              { l: 'Energy consumed',        v: `${energy} kWh` },
              { l: 'Estimated charging cost', v: `₹${cost}` },
              { l: 'Equivalent petrol cost',  v: `₹${petrol}`, s: true },
              { l: 'CO₂ saved',              v: `${co2} kg`,   g: true },
            ].map((row, i) => (
              <div key={i}>
                {i === 3 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 3 ? 10 : 0, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>{row.l}</span>
                  <span className="mono" style={{ fontWeight: 600, textDecoration: row.s ? 'line-through' : 'none', opacity: row.s ? 0.5 : 1, color: row.g ? '#34D399' : 'var(--text-1)' }}>{row.v}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>You save vs petrol</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>₹{savings}</span>
            </div>
          </div>
        </div>

        <div className="no-print" style={{ padding: '12px 22px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
            <Download className="w-4 h-4" />Export PDF
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>Back to Map</button>
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
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function RoutePlanner() {
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const { selectedCar, currentBatteryPercent, setCurrentBatteryPercent, addToast, addToHistory } = useStore()
  const { user, saveTrip } = useAuth()

  const [startLoc,     setStartLoc]     = useState('Ahmedabad')
  const [endLoc,       setEndLoc]       = useState('')
  const [startCoords,  setStartCoords]  = useState(null)
  const [endCoords,    setEndCoords]    = useState(null)
  const [mapCenter,    setMapCenter]    = useState([22.97, 78.66])
  const [route,        setRoute]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [showSummary,  setShowSummary]  = useState(false)
  const [routeKey,     setRouteKey]     = useState(0)
  const [sheetOpen,    setSheetOpen]    = useState(true) // mobile bottom sheet
  const [selectedStop, setSelectedStop] = useState(null) // charger detail modal

  useEffect(() => { if (!selectedCar) navigate('/select-brand') }, [selectedCar, navigate])

  // Geocode default start on mount
  useEffect(() => {
    fetch('https://photon.komoot.io/api/?q=Ahmedabad,Gujarat&limit=1&bbox=68.7,6.5,97.25,35.5&lang=en')
      .then(r => r.json())
      .then(d => {
        const f = d.features?.[0]
        if (f) { const c = [f.geometry.coordinates[1], f.geometry.coordinates[0]]; setStartCoords(c); setMapCenter(c) }
      }).catch(() => {})
  }, [])

  const handleStartSelect = useCallback((coords) => {
    if (!coords) { setStartCoords(null); return }
    setStartCoords(coords); setMapCenter(coords)
  }, [])

  const handleEndSelect = useCallback((coords) => {
    if (!coords) { setEndCoords(null); return }
    setEndCoords(coords); setMapCenter(coords)
    addToast('info', 'Destination pinned — tap Find Best Route')
  }, [addToast])

  const handleCalculate = async () => {
    if (!startCoords || !endCoords) { addToast('warning', 'Pick both locations from the dropdown'); return }
    if (isMobile) setSheetOpen(false) // collapse sheet to show map on mobile
    setLoading(true); setRoute(null)
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
      setRoute(data); setRouteKey(k => k + 1)
      addToHistory({ car: selectedCar, route: data, date: new Date().toISOString() })
      if (user) await saveTrip(user.id, { startCoords, endCoords, route: data })
      addToast('success', `Route found — ${data.total_distance_km} km · ${data.estimated_total_time_minutes} min`)
      if (isMobile && data) setSheetOpen(true) // re-open to show results
    } catch { addToast('error', 'Route calculation failed — check backend') }
    setLoading(false)
  }

  if (!selectedCar) return null

  /* ── Sidebar / Sheet content ── */
  const sidebarContent = (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Battery gauge */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 13, padding: '16px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 12, fontFamily: 'IBM Plex Mono, monospace' }}>
          Initial Charge Level
        </p>
        <BatteryGauge percent={currentBatteryPercent} maxRangeKm={selectedCar.range_km || 300} />
        <div style={{ marginTop: 14 }}>
          <input type="range" min="5" max="100" value={currentBatteryPercent}
            onChange={e => setCurrentBatteryPercent(parseInt(e.target.value))}
            className="range-slider"
            style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${currentBatteryPercent}%, var(--surface-3) ${currentBatteryPercent}%, var(--surface-3) 100%)` }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--text-3)' }}>
            <span>5%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Location inputs */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 13, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>Route</p>
        <LocationInput value={startLoc} onChange={setStartLoc} onSelect={handleStartSelect} placeholder="Start — society, area, city…" accent="#00D4AA" />
        {/* Dots connector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />)}
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <LocationInput value={endLoc} onChange={setEndLoc} onSelect={handleEndSelect} placeholder="Destination — where to?" accent="#FF4D6D" />
        {!endCoords && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
            ↑ Pick from the dropdown to pin on map
          </p>
        )}
      </div>

      {/* Results */}
      {route && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)', fontFamily: 'IBM Plex Mono, monospace' }}>Route Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon={<MapPin className="w-3 h-3" />} label="Distance" value={`${route.total_distance_km} km`} />
            <StatCard icon={<Clock  className="w-3 h-3" />} label="Total Time" value={`${Math.floor(route.estimated_total_time_minutes/60)}h ${route.estimated_total_time_minutes%60}m`} />
          </div>

          {route.needs_charging ? (
            <div style={{ background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Zap className="w-4 h-4" style={{ color: '#FFB547' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFB547' }}>
                  {route.charging_stops.length} charging stop{route.charging_stops.length !== 1 ? 's' : ''}
                </span>
              </div>
              {route.charging_stops.map((stop, i) => (
                <button key={i}
                  onClick={() => setSelectedStop({ stop, index: i })}
                  style={{ width: '100%', background: 'rgba(255,181,71,0.04)', border: '1px solid rgba(255,181,71,0.15)', borderRadius: 9, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginTop: i > 0 ? 8 : 0, transition: 'background 0.15s', fontFamily: 'Outfit' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,181,71,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,181,71,0.04)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Plug className="w-3.5 h-3.5" style={{ color: '#FFB547', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.station_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: '#FFB547' }}>{stop.charging_time_minutes}m</span>
                    <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                  </div>
                </button>
              ))}
              <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Tap a stop for full charger details</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Direct trip possible</p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>No charging stop needed</p>
              </div>
            </div>
          )}

          <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowSummary(true)}>
            <Navigation className="w-4 h-4" />View Full Trip Summary
          </button>
        </div>
      )}
    </div>
  )

  /* ── CTA footer ── */
  const footerCTA = (
    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'rgba(7,11,20,0.98)', flexShrink: 0 }}>
      <button className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15 }} onClick={handleCalculate} disabled={loading || !startCoords || !endCoords}>
        {loading
          ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Calculating…</>
          : <><Navigation className="w-4 h-4" />Find Best Route</>
        }
      </button>
      {(!startCoords || !endCoords) && !loading && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          {!startCoords ? 'Set your start location above' : 'Set your destination above'}
        </p>
      )}
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ═══ DESKTOP SIDEBAR ═══ */}
        {!isMobile && (
          <div className="glass-sidebar no-scrollbar" style={{ width: 370, height: '100%', position: 'relative', zIndex: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar header */}
            <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button className="btn-ghost" style={{ marginLeft: -8 }} onClick={() => navigate('/select-brand')}>
                  <ChevronLeft className="w-3.5 h-3.5" />Change vehicle
                </button>
                <span className="badge badge-green" style={{ fontSize: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', animation: 'pulse-dot 1.5s ease infinite' }} />Live
                </span>
              </div>
              <h1 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Route Planner</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                <Car className="w-3.5 h-3.5" />
                {selectedCar.brand} · {selectedCar.name || selectedCar.model}
              </div>
            </div>
            {sidebarContent}
            {footerCTA}
          </div>
        )}

        {/* ═══ MAP ═══ */}
        <div style={{ flex: 1, position: 'relative', zIndex: 0, height: '100%' }}>
          <MapContainer center={mapCenter} zoom={6} zoomControl style={{ width: '100%', height: '100%' }}>
            <TileLayer className="dark-map-tiles" attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo center={mapCenter} />
            {startCoords && endCoords && <FitBounds start={startCoords} end={endCoords} />}

            {startCoords && <Marker position={startCoords} icon={startIcon}>
              <Popup><div style={{ fontWeight: 600, fontSize: 13 }}>📍 {startLoc}</div><div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>Start</div></Popup>
            </Marker>}
            {endCoords && <Marker position={endCoords} icon={endIcon}>
              <Popup><div style={{ fontWeight: 600, fontSize: 13 }}>🏁 {endLoc}</div><div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>Destination</div></Popup>
            </Marker>}

            {route?.charging_stops?.map((stop, i) =>
              stop.lat && stop.lng ? (
                <Marker key={i} position={[stop.lat, stop.lng]} icon={chargerIcon}
                  eventHandlers={{ click: () => setSelectedStop({ stop, index: i }) }}>
                  <Popup>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>⚡ {stop.station_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Stop #{i+1} · {stop.charging_time_minutes} min</div>
                    <button onClick={() => setSelectedStop({ stop, index: i })} style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Outfit' }}>
                      View details →
                    </button>
                  </Popup>
                </Marker>
              ) : null
            )}

            {route?.route_coords && (
              <Polyline key={routeKey} positions={route.route_coords} pathOptions={{ color: '#00D4AA', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }} />
            )}
          </MapContainer>

          {/* Map hint */}
          {!route && !loading && (
            <div style={{ position: 'absolute', bottom: isMobile ? '56vh' : 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <div style={{ padding: '8px 16px', borderRadius: 100, background: 'rgba(7,11,20,0.92)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', backdropFilter: 'blur(12px)' }}>
                Type a location → pick suggestion → <strong style={{ color: 'var(--text-1)' }}>Find Best Route</strong>
              </div>
            </div>
          )}

          {/* Mobile FAB to toggle sheet */}
          {isMobile && route && !sheetOpen && (
            <button
              onClick={() => setSheetOpen(true)}
              style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 500, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,212,170,0.5)' }}
            >
              <ChevronUp className="w-5 h-5" style={{ color: '#000' }} />
            </button>
          )}
        </div>

        {/* ═══ MOBILE BOTTOM SHEET ═══ */}
        {isMobile && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid var(--border)',
            borderBottom: 'none',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            height: sheetOpen ? '65dvh' : '72px',
            transition: 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            overflow: 'hidden',
          }}>
            {/* Drag handle + header */}
            <div
              onClick={() => setSheetOpen(o => !o)}
              style={{ flexShrink: 0, padding: '10px 16px 12px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>
                    {route ? 'Route Found ✓' : 'Route Planner'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
                    {selectedCar.brand} · {selectedCar.name || selectedCar.model}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn-ghost" style={{ padding: '5px 8px', marginRight: -8 }} onClick={e => { e.stopPropagation(); navigate('/select-brand') }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <ChevronUp style={{ width: 16, height: 16, color: 'var(--text-2)', transition: 'transform 0.3s', transform: sheetOpen ? 'none' : 'rotate(180deg)' }} />
                </div>
              </div>
            </div>

            {sidebarContent}
            {footerCTA}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSummary && route && (
        <TripSummaryModal route={route} car={selectedCar} onClose={() => setShowSummary(false)} />
      )}

      {selectedStop && (
        <ChargerDetailModal
          stop={selectedStop.stop}
          stopIndex={selectedStop.index}
          batteryAtArrival={selectedStop.index === 0 ? currentBatteryPercent * 0.12 : 10}
          onClose={() => setSelectedStop(null)}
        />
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Zap, Search, MapPin, ExternalLink, Loader2, Filter, X, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import Navbar from '../components/Navbar'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* Custom Charger Icon */
const chargerHtml = `
  <div style="width:32px;height:32px;background:rgba(7,11,20,0.95);border:1.5px solid #FFB547;border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,181,71,0.45);cursor:pointer">
    <svg viewBox="0 0 24 24" fill="#FFB547" width="16" height="16"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
  </div>
`
const chargerIcon = L.divIcon({
    html: chargerHtml,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
})

export default function ChargersMap() {
    const [chargers, setChargers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [operatorFilter, setOperatorFilter] = useState('')
    const { addToast, theme } = useStore()

    const isDark = theme === 'dark'

    // Mobile Bottom Sheet
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [touchStartY, setTouchStartY] = useState(0)
    const [touchEndY, setTouchEndY] = useState(0)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleTouchStart = (e) => setTouchStartY(e.targetTouches[0].clientY)
    const handleTouchMove = (e) => setTouchEndY(e.targetTouches[0].clientY)
    const handleTouchEnd = () => {
        if (!touchStartY || !touchEndY) return
        const distance = touchStartY - touchEndY
        if (distance > 40) setSheetOpen(true)
        if (distance < -40) setSheetOpen(false)
        setTouchStartY(0)
        setTouchEndY(0)
    }

    useEffect(() => {
        async function fetchChargers() {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/chargers/all?lat=22.97&lng=78.66&radius_km=3000&limit=500`)
                if (!res.ok) throw new Error('API Response was not ok')
                const data = await res.json()
                setChargers(data.stations || [])
            } catch (err) {
                addToast('error', 'Failed to load chargers — check backend')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchChargers()
    }, [addToast])

    // Filtered chargers
    const operators = [...new Set(chargers.map(c => c.operator).filter(Boolean))].sort()
    const filtered = chargers.filter(c => {
        if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.operator?.toLowerCase().includes(search.toLowerCase())) return false
        if (operatorFilter && c.operator !== operatorFilter) return false
        return true
    })

    // Stats
    const totalPower = chargers.reduce((sum, c) => sum + (c.power_kw || 0), 0)
    const avgPower = chargers.length ? Math.round(totalPower / chargers.length) : 0

    return (
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
            <Navbar />

            <div className="map-layout-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', position: 'relative', marginTop: 56 }}>

                {/* ═══ DESKTOP SIDEBAR ═══ */}
                {!isMobile && (
                    <div className="glass-sidebar no-scrollbar" style={{
                        width: 340, height: '100%', position: 'relative', zIndex: 100, flexShrink: 0,
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Header */}
                        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 9,
                                    background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Zap style={{ width: 15, height: 15, color: '#FFB547' }} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                        Charger Map
                                    </h1>
                                    <p style={{ fontSize: 11, color: 'var(--text-2)' }}>All India charging stations</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, borderBottom: '1px solid var(--border)' }}>
                            {[
                                { label: 'Stations', value: chargers.length, color: '#FFB547' },
                                { label: 'Showing', value: filtered.length, color: 'var(--accent)' },
                                { label: 'Avg kW', value: avgPower, color: 'var(--text-1)' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                                }}>
                                    <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Search + Filter */}
                        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
                                <input
                                    type="text"
                                    placeholder="Search stations or operators…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: 36, fontSize: 13, borderRadius: 10 }}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}
                                    >
                                        <X style={{ width: 12, height: 12 }} />
                                    </button>
                                )}
                            </div>

                            {operators.length > 0 && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setOperatorFilter('')}
                                        className={`badge ${!operatorFilter ? 'badge-green' : 'badge-gray'}`}
                                        style={{ cursor: 'pointer', fontSize: 10 }}
                                    >
                                        All
                                    </button>
                                    {operators.slice(0, 8).map(op => (
                                        <button
                                            key={op}
                                            onClick={() => setOperatorFilter(operatorFilter === op ? '' : op)}
                                            className={`badge ${operatorFilter === op ? 'badge-yellow' : 'badge-gray'}`}
                                            style={{ cursor: 'pointer', fontSize: 10 }}
                                        >
                                            {op.length > 15 ? op.slice(0, 15) + '…' : op}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Charger list */}
                        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px' }}>
                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-2)', fontSize: 13 }}>
                                    No chargers match your filters
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {filtered.slice(0, 50).map((station, i) => (
                                        <div key={i} style={{
                                            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
                                            padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                                            transition: 'border-color 0.15s', cursor: 'default',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                                background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Zap style={{ width: 14, height: 14, color: '#FFB547' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {station.name || 'Unnamed Station'}
                                                </div>
                                                {station.operator && (
                                                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1, fontWeight: 500 }}>
                                                        {station.operator}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                    <span className="badge badge-yellow" style={{ fontSize: 9, padding: '1px 7px' }}>
                                                        {station.power_kw || '?'} kW
                                                    </span>
                                                    {station.charger_type && (
                                                        <span className="badge badge-gray" style={{ fontSize: 9, padding: '1px 7px' }}>
                                                            {station.charger_type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {station.latitude && station.longitude && (
                                                <a
                                                    href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ flexShrink: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                                                    title="Open in Google Maps"
                                                >
                                                    <ExternalLink style={{ width: 13, height: 13 }} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                    {filtered.length > 50 && (
                                        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', padding: '8px 0' }}>
                                            Showing 50 of {filtered.length} stations
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ MAP ═══ */}
                <div className={isDark ? 'dark-tiles' : ''} style={{ flex: 1, position: 'relative', height: '100%', zIndex: 0 }}>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,10,18,0.7)', backdropFilter: 'blur(4px)' }}>
                            <div style={{ padding: '16px 24px', background: 'var(--surface-2)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Loader2 style={{ width: 16, height: 16, color: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Fetching nationwide chargers…</span>
                            </div>
                        </div>
                    )}
                    <MapContainer center={[22.97, 78.66]} zoom={5} zoomControl style={{ width: '100%', height: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                            maxZoom={19}
                        />
                        {filtered.map((station, i) => (
                            <Marker key={i} position={[station.latitude, station.longitude]} icon={chargerIcon}>
                                <Popup>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#FFB547', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Zap size={14} />
                                        {station.name}
                                    </div>
                                    {station.operator && (
                                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>{station.operator}</div>
                                    )}
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: 'rgba(255,181,71,0.1)', color: '#FFB547', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,181,71,0.2)' }}>
                                            {station.power_kw} kW
                                        </span>
                                        {station.charger_type && (
                                            <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border)' }}>
                                                {station.charger_type}
                                            </span>
                                        )}
                                    </div>
                                    {station.latitude && station.longitude && (
                                        <a
                                            href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                                        >
                                            <ExternalLink size={11} /> Open in Maps
                                        </a>
                                    )}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Mobile FAB */}
                    {isMobile && !sheetOpen && (
                        <button
                            onClick={() => setSheetOpen(true)}
                            style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 500, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,212,170,0.5)' }}
                        >
                            <ChevronUp style={{ width: 20, height: 20, color: '#000' }} />
                        </button>
                    )}
                </div>

                {/* ═══ MOBILE BOTTOM SHEET ═══ */}
                {isMobile && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 200,
                        background: 'var(--surface)',
                        borderRadius: '20px 20px 0 0',
                        border: '1px solid var(--border)', borderBottom: 'none',
                        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
                        display: 'flex', flexDirection: 'column',
                        height: sheetOpen ? '75dvh' : '72px',
                        transition: 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                        overflow: 'hidden',
                    }}>
                        {/* Drag handle + header */}
                        <div
                            onClick={() => setSheetOpen(o => !o)}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ flexShrink: 0, padding: '10px 16px 12px', cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                                <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 700 }}>
                                        Charger Map
                                    </p>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{filtered.length} stations</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{avgPower} avg kW</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: sheetOpen ? 1 : 0, transition: 'opacity 0.2s', visibility: sheetOpen ? 'visible' : 'hidden' }}>
                            {/* Inner Header - omitted for space since it's on drag handle */}

                            {/* Stats */}
                            <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, borderBottom: '1px solid var(--border)' }}>
                                {[
                                    { label: 'Stations', value: chargers.length, color: '#FFB547' },
                                    { label: 'Showing', value: filtered.length, color: 'var(--accent)' },
                                    { label: 'Avg kW', value: avgPower, color: 'var(--text-1)' },
                                ].map((s, i) => (
                                    <div key={i} style={{
                                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                                        borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                                    }}>
                                        <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Search + Filter */}
                            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search stations or operators…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="input-field"
                                        style={{ paddingLeft: 36, fontSize: 13, borderRadius: 10 }}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}
                                        >
                                            <X style={{ width: 12, height: 12 }} />
                                        </button>
                                    )}
                                </div>

                                {operators.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setOperatorFilter('')}
                                            className={`badge ${!operatorFilter ? 'badge-green' : 'badge-gray'}`}
                                            style={{ cursor: 'pointer', fontSize: 10 }}
                                        >
                                            All
                                        </button>
                                        {operators.slice(0, 8).map(op => (
                                            <button
                                                key={op}
                                                onClick={() => setOperatorFilter(operatorFilter === op ? '' : op)}
                                                className={`badge ${operatorFilter === op ? 'badge-yellow' : 'badge-gray'}`}
                                                style={{ cursor: 'pointer', fontSize: 10 }}
                                            >
                                                {op.length > 15 ? op.slice(0, 15) + '…' : op}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Charger list */}
                            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
                                        ))}
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-2)', fontSize: 13 }}>
                                        No chargers match your filters
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {filtered.slice(0, 50).map((station, i) => (
                                            <div key={i} style={{
                                                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
                                                padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                                                transition: 'border-color 0.15s', cursor: 'default',
                                            }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                                    background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Zap style={{ width: 14, height: 14, color: '#FFB547' }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {station.name || 'Unnamed Station'}
                                                    </div>
                                                    {station.operator && (
                                                        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1, fontWeight: 500 }}>
                                                            {station.operator}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                        <span className="badge badge-yellow" style={{ fontSize: 9, padding: '1px 7px' }}>
                                                            {station.power_kw || '?'} kW
                                                        </span>
                                                        {station.charger_type && (
                                                            <span className="badge badge-gray" style={{ fontSize: 9, padding: '1px 7px' }}>
                                                                {station.charger_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {station.latitude && station.longitude && (
                                                    <a
                                                        href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ flexShrink: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                                                        title="Open in Google Maps"
                                                    >
                                                        <ExternalLink style={{ width: 13, height: 13 }} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

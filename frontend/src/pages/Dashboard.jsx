import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Clock, Zap, Car, ChevronRight, LogIn, TrendingUp, Leaf, ArrowLeft, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { API_URL } from '../App'

export default function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { selectedCar, tripHistory, removeFromHistory, clearHistory } = useStore()

    const [dashData, setDashData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [confirmClear, setConfirmClear] = useState(false)

    /* ── Redirect if not logged in ── */
    if (!user) {
        return (
            <div style={{
                minHeight: 'calc(100vh - 56px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 20,
                padding: 24, textAlign: 'center',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <LogIn style={{ width: 28, height: 28, color: 'var(--accent)' }} />
                </div>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Sign in to view your Dashboard</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 360 }}>
                        Track your trips, savings, and environmental impact — all in one place.
                    </p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    Back to Home
                </button>
            </div>
        )
    }

    /* ── Use local trip history as primary source ── */
    const trips = tripHistory || []
    const totalKm = trips.reduce((sum, t) => sum + (t.route?.total_distance_km || 0), 0)
    const totalStops = trips.reduce((sum, t) => sum + (t.route?.charging_stops?.length || 0), 0)
    // Savings: petrol cost (₹7/km) minus EV charging cost (₹1.3/km avg)
    const savedInr = Math.round(totalKm * 5.7)
    const co2Saved = (totalKm * 0.12).toFixed(1)

    const displayName = user?.user_metadata?.full_name
        || user?.email?.split('@')[0]
        || 'Driver'

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>Welcome back</p>
                <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em' }}>
                    {displayName}
                </h1>
                {selectedCar && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px', borderRadius: 100,
                        background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
                        marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                    }}>
                        <Car style={{ width: 14, height: 14 }} />
                        {selectedCar.brand} {selectedCar.name || selectedCar.model}
                    </div>
                )}
            </div>

            {/* ── Stats Grid ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12, marginBottom: 32,
            }}>
                {[
                    { emoji: '🗺️', label: 'Total Trips', value: trips.length, accent: false },
                    { emoji: '📍', label: 'Km Driven', value: `${Math.round(totalKm)}`, accent: false },
                    { emoji: '⚡', label: 'Charging Stops', value: totalStops, accent: false },
                    { emoji: '💰', label: 'Saved vs Petrol', value: `₹${savedInr}`, accent: true },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: s.accent ? 'rgba(0,212,170,0.06)' : 'var(--surface-2)',
                        border: `1px solid ${s.accent ? 'rgba(0,212,170,0.2)' : 'var(--border)'}`,
                        borderRadius: 14, padding: '20px 18px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{s.emoji}</div>
                        <div className="mono" style={{
                            fontSize: 22, fontWeight: 700,
                            color: s.accent ? 'var(--accent)' : 'var(--text-1)',
                        }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── CO₂ Impact Banner ── */}
            <div style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 22px', marginBottom: 32,
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Leaf style={{ width: 22, height: 22, color: '#34D399' }} />
                </div>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>
                        You've saved <span className="mono" style={{ color: '#34D399', fontWeight: 700 }}>{co2Saved} kg</span> of CO₂
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                        That's equivalent to planting {Math.max(1, Math.round(parseFloat(co2Saved) / 22))} tree{Math.round(parseFloat(co2Saved) / 22) !== 1 ? 's' : ''} 🌳
                    </p>
                </div>
            </div>

            {/* ── Recent Trips ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Recent Trips</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {trips.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirmClear) { clearHistory(); setConfirmClear(false) }
                                    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000) }
                                }}
                                style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}
                            >
                                {confirmClear ? 'Tap again to confirm' : 'Clear all'}
                            </button>
                        )}
                        <Link to="/plan-route" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                            Plan new trip →
                        </Link>
                    </div>
                </div>

                {trips.length === 0 ? (
                    <div style={{
                        padding: '40px 24px', textAlign: 'center',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 14,
                    }}>
                        <MapPin style={{ width: 32, height: 32, color: 'var(--text-3)', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>No trips yet</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            Plan your first route to start tracking your EV journey
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {trips.slice(0, 10).map((trip, i) => (
                            <div
                                key={trip.id || i}
                                onClick={() => navigate('/plan-route')}
                                role="button"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 18px', borderRadius: 13,
                                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                    transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                            >
                                {/* Route icon */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 11,
                                    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <MapPin style={{ width: 18, height: 18, color: 'var(--accent)' }} />
                                </div>

                                {/* Trip info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {trip.startLoc?.split(',')[0] || 'Start'} → {trip.endLoc?.split(',')[0] || 'End'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-2)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin style={{ width: 11, height: 11 }} />
                                            {trip.route?.total_distance_km || '?'} km
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Zap style={{ width: 11, height: 11 }} />
                                            {trip.route?.charging_stops?.length || 0} stop{(trip.route?.charging_stops?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                        {trip.date && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock style={{ width: 11, height: 11 }} />
                                                {new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight style={{ width: 16, height: 16, color: 'var(--text-3)', flexShrink: 0 }} />

                                {/* Delete button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFromHistory(trip.id) }}
                                    style={{
                                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                        background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.15)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.12s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.15)' }}
                                >
                                    <Trash2 style={{ width: 14, height: 14, color: 'var(--error)' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

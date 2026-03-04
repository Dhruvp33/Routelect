import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Battery, Zap, ChevronLeft, Gauge, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { API_URL } from '../App'

/* ═══════════════════════════════════════════════════════════
   INLINE SVG CAR SILHOUETTES — professional side-profile views
   No emoji, no external images
═══════════════════════════════════════════════════════════ */
function SUVSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 55" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M8 38 L8 30 Q10 22 22 20 L35 14 Q48 9 72 9 L90 9 Q102 9 108 18 L112 25 L114 38 Z" fill={color} opacity="0.9"/>
      <ellipse cx="28" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="28" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      <ellipse cx="92" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="92" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      <path d="M37 20 L46 11 L78 11 L86 20 Z" fill="rgba(255,255,255,0.2)"/>
      <line x1="60" y1="11" x2="60" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    </svg>
  )
}

function SedanSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 55" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M6 38 L6 32 Q8 26 16 25 L30 18 Q40 12 58 11 Q76 11 84 14 L100 19 Q110 22 114 28 L114 38 Z" fill={color} opacity="0.9"/>
      <ellipse cx="26" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="26" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      <ellipse cx="90" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="90" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      {/* 3-box roof */}
      <path d="M32 24 L44 13 L74 13 L88 24 Z" fill="rgba(255,255,255,0.2)"/>
    </svg>
  )
}

function HatchbackSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 55" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M8 38 L8 32 Q10 26 20 24 L34 17 Q44 11 62 11 Q78 11 90 15 L106 24 Q114 27 114 33 L114 38 Z" fill={color} opacity="0.9"/>
      <ellipse cx="28" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="28" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      <ellipse cx="91" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="91" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      {/* Hatchback sloped rear */}
      <path d="M36 23 L50 12 L76 12 L92 23 Z" fill="rgba(255,255,255,0.2)"/>
    </svg>
  )
}

function SportsSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 55" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Low, wide, aggressive */}
      <path d="M4 40 L4 35 Q5 29 12 27 L24 21 Q36 14 55 13 Q72 13 84 16 L102 22 Q113 26 116 32 L116 40 Z" fill={color} opacity="0.9"/>
      <ellipse cx="24" cy="41" rx="10" ry="10" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="24" cy="41" rx="5" ry="5" fill={color} opacity="0.6"/>
      <ellipse cx="94" cy="41" rx="10" ry="10" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="94" cy="41" rx="5" ry="5" fill={color} opacity="0.6"/>
      <path d="M28 26 L42 14 L76 14 L96 26 Z" fill="rgba(255,255,255,0.2)"/>
      {/* Spoiler */}
      <line x1="100" y1="22" x2="116" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}

function ScooterSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Body */}
      <path d="M48 44 Q46 32 50 24 L56 17 Q62 12 70 14 L78 18 Q84 22 84 30 L84 38 L78 40 L60 42 Z" fill={color} opacity="0.9"/>
      {/* Rear wheel */}
      <ellipse cx="30" cy="44" rx="14" ry="14" fill={color} opacity="0.25" stroke={color} strokeWidth="2.5"/>
      <ellipse cx="30" cy="44" rx="7" ry="7" fill={color} opacity="0.5"/>
      {/* Front wheel */}
      <ellipse cx="92" cy="44" rx="13" ry="13" fill={color} opacity="0.25" stroke={color} strokeWidth="2.5"/>
      <ellipse cx="92" cy="44" rx="6.5" ry="6.5" fill={color} opacity="0.5"/>
      {/* Fork */}
      <path d="M84 30 L88 35 L92 31" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      {/* Handlebar */}
      <path d="M78 18 L82 14 L88 13" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      {/* Seat */}
      <path d="M52 22 Q60 18 68 18 Q66 22 60 24 Q54 24 52 22Z" fill="rgba(255,255,255,0.25)"/>
    </svg>
  )
}

function MPVSilhouette({ color }) {
  return (
    <svg viewBox="0 0 120 55" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Tall, boxy van/MPV */}
      <path d="M6 38 L6 22 Q7 14 18 14 L88 14 Q100 14 108 20 L114 28 L114 38 Z" fill={color} opacity="0.9"/>
      <ellipse cx="26" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="26" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      <ellipse cx="92" cy="39" rx="11" ry="11" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="92" cy="39" rx="6" ry="6" fill={color} opacity="0.6"/>
      {/* Windows */}
      <rect x="14" y="18" width="22" height="14" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="40" y="18" width="22" height="14" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="66" y="18" width="18" height="14" rx="2" fill="rgba(255,255,255,0.2)"/>
    </svg>
  )
}

function MicroEVSilhouette({ color }) {
  return (
    <svg viewBox="0 0 100 55" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Small, cute, boxy */}
      <path d="M12 38 L12 26 Q14 18 24 16 L38 12 Q52 9 66 12 L76 16 Q84 20 84 28 L84 38 Z" fill={color} opacity="0.9"/>
      <ellipse cx="26" cy="39" rx="10" ry="10" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="26" cy="39" rx="5.5" ry="5.5" fill={color} opacity="0.6"/>
      <ellipse cx="70" cy="39" rx="10" ry="10" fill={color} opacity="0.3" stroke={color} strokeWidth="2"/>
      <ellipse cx="70" cy="39" rx="5.5" ry="5.5" fill={color} opacity="0.6"/>
      <path d="M28 22 L38 13 L58 13 L66 22 Z" fill="rgba(255,255,255,0.2)"/>
    </svg>
  )
}

const SILHOUETTES = {
  'SUV':        SUVSilhouette,
  'Crossover':  SUVSilhouette,
  'Coupe SUV':  SportsSilhouette,
  'Sedan':      SedanSilhouette,
  'Hatchback':  HatchbackSilhouette,
  'Sports':     SportsSilhouette,
  'Performance':SportsSilhouette,
  'Scooter':    ScooterSilhouette,
  'MPV':        MPVSilhouette,
  'Micro EV':   MicroEVSilhouette,
}

const SEGMENT_COLORS = {
  'SUV':        '#00D4AA',
  'Hatchback':  '#A78BFA',
  'Sedan':      '#60A5FA',
  'Crossover':  '#34D399',
  'Coupe SUV':  '#F59E0B',
  'MPV':        '#FB923C',
  'Sports':     '#F43F5E',
  'Performance':'#EF4444',
  'Micro EV':   '#06B6D4',
  'Scooter':    '#FBBF24',
}

const rangeColor = km => km >= 500 ? '#00D4AA' : km >= 300 ? '#FBBF24' : '#FF4D6D'

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 110 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ width: '60%', height: 18, borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '80%', height: 8, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '65%', height: 8, borderRadius: 6 }} />
      </div>
    </div>
  )
}

function ModelCard({ model, onClick }) {
  const color     = SEGMENT_COLORS[model.segment] || '#00D4AA'
  const Silhouette = SILHOUETTES[model.segment] || SUVSilhouette
  const efficiency = ((model.battery_capacity_kwh / model.range_km) * 1000).toFixed(0)
  const rangePct   = Math.min(100, (model.range_km / 700) * 100)

  return (
    <button
      onClick={onClick}
      className="card card-interactive animate-fade-up"
      style={{ textAlign: 'left', border: 'none', cursor: 'pointer', width: '100%', overflow: 'hidden', padding: 0 }}
    >
      {/* Card header — gradient background + car silhouette */}
      <div style={{
        height: 110,
        background: `linear-gradient(160deg, ${color}20 0%, ${color}08 60%, transparent 100%)`,
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Segment label */}
        <span style={{
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color, fontFamily: 'IBM Plex Mono, monospace',
        }}>
          {model.segment || 'EV'}
        </span>

        {/* Model name */}
        <div style={{
          fontSize: 16, fontWeight: 800,
          letterSpacing: '-0.02em', lineHeight: 1.2,
          marginTop: 4, color: 'var(--text-1)',
        }}>
          {model.name}
        </div>

        {/* Car silhouette — positioned bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: -4, right: -6,
          width: 120, height: 56,
          opacity: 0.85,
        }}>
          <Silhouette color={color} />
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        {/* Range bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Range (ARAI)</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: rangeColor(model.range_km) }}>
            {model.range_km} km
          </span>
        </div>
        <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${rangePct}%`, background: `linear-gradient(to right, ${rangeColor(model.range_km)}, ${color})`, borderRadius: 10 }} />
        </div>

        {/* Specs row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {[
            { icon: <Battery className="w-3.5 h-3.5" style={{ color: 'var(--accent)'}} />, l: 'Battery',   v: `${model.battery_capacity_kwh} kWh` },
            { icon: <Zap     className="w-3.5 h-3.5" style={{ color: '#FBBF24'}}     />, l: 'Max charge', v: `${model.charging_speed_kw} kW` },
            { icon: <Gauge   className="w-3.5 h-3.5" style={{ color: '#A78BFA'}}     />, l: 'Efficiency', v: `${efficiency} Wh/km` },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>{s.icon}{s.l}</div>
              <span className="mono" style={{ fontWeight: 600 }}>{s.v}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Select this model</span>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}16`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </button>
  )
}

export default function ModelSelection() {
  const { brandId }  = useParams()
  const navigate     = useNavigate()
  const { setSelectedCar, addToast } = useStore()
  const { user, saveCarPreference }  = useAuth()

  const [models,    setModels]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [brandName, setBrandName] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/brands/${brandId}/models`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setModels(d); if (d[0]) setBrandName(d[0].brand || ''); setLoading(false) })
      .catch(() => { addToast('error', 'Could not load models'); setLoading(false) })
  }, [brandId])

  const handleSelect = async (model) => {
    setSelectedCar(model)
    if (user) await saveCarPreference(user.id, model.id)
    addToast('success', `${model.name} selected — let's plan your route!`)
    navigate('/plan-route')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', padding: '36px 16px 80px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginLeft: -8, marginBottom: 16 }}>
            <ChevronLeft className="w-4 h-4" />Back to brands
          </button>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace' }}>
            Step 2 of 2
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 800, marginBottom: 6 }}>
            {brandName || 'Select your model'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Accurate range &amp; charging calculations based on your exact model
          </p>
        </div>

        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : models.map(m => <ModelCard key={m.id} model={m} onClick={() => handleSelect(m)} />)
          }
        </div>

        {!loading && models.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
            <p style={{ fontWeight: 500 }}>No models found for this brand</p>
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: 14 }}>
              <ChevronLeft className="w-4 h-4" />Go back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
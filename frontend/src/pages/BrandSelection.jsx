import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Car, Bike } from 'lucide-react'
import { API_URL } from '../App'

/* ═══════════════════════════════════════════════════════════
   LOGO MAP
═══════════════════════════════════════════════════════════ */
const LOGO_MAP = {
  'Tata Motors':   '/logos/tata motor.png',
  'Mahindra':      '/logos/mahindra.png',
  'MG Motor':      '/logos/mg.png',
  'Hyundai':       '/logos/hyundai.png',
  'Kia':           '/logos/kia.png',
  'Volvo':         '/logos/volvo.png',
  'Tesla':         '/logos/tesla.png',
  'Ather Energy':  '/logos/ather.png',
  'Maruti Suzuki': '/logos/suzuki.png',
  'Citroen':       '/logos/citroen.png',
  'BYD':           '/logos/byd.png',
  'Ola Electric':  '/logos/ola.png',
}

/* Original neon accent colours — kept as-is for glows/borders */
const BRAND_ACCENT = {
  'Tata Motors':   '#4B6FBE',
  'Mahindra':      '#A0926B',
  'MG Motor':      '#C8102E',
  'Hyundai':       '#0078D4',
  'BYD':           '#1B4F72',
  'Kia':           '#CE1126',
  'Volvo':         '#003057',
  'Tesla':         '#CC0000',
  'Ola Electric':  '#F97316',
  'Ather Energy':  '#00B0FF',
  'Maruti Suzuki': '#003399',
  'Citroen':       '#C40404',
}

const BRAND_CATEGORY = {
  'Tata Motors':   'Cars',
  'Mahindra':      'Cars',
  'MG Motor':      'Cars',
  'Hyundai':       'Cars',
  'BYD':           'Cars',
  'Kia':           'Cars',
  'Volvo':         'Cars',
  'Tesla':         'Cars',
  'Maruti Suzuki': 'Cars',
  'Citroen':       'Cars',
  'Ola Electric':  'Two-wheelers',
  'Ather Energy':  'Two-wheelers',
}

const CATEGORIES = ['All', 'Cars', 'Two-wheelers']

/* ── Fallback initials badge ── */
function InitialsBadge({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const accent   = BRAND_ACCENT[name] || '#00D4AA'
  return (
    <div style={{
      width: 72, height: 72, borderRadius: 18,
      background: `${accent}18`,
      border: `2px solid ${accent}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontSize: 24, fontWeight: 900,
        /* FIX: initials always white — not the neon accent which can be unreadable */
        color: 'var(--text-1)',
        fontFamily: 'IBM Plex Mono, monospace',
        letterSpacing: '-0.04em',
      }}>
        {initials}
      </span>
    </div>
  )
}

/* ── Logo image with white pill background ── */
function BrandLogo({ name }) {
  const src = LOGO_MAP[name]
  const [err, setErr] = useState(false)

  if (!src || err) return <InitialsBadge name={name} />

  return (
    <div style={{
      width: 80, height: 80, borderRadius: 20,
      background: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 10,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '28px 22px 22px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 20 }} />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div className="skeleton" style={{ width: '65%', height: 14, borderRadius: 7 }} />
        <div className="skeleton" style={{ width: '40%', height: 10, borderRadius: 6 }} />
      </div>
    </div>
  )
}

/* ── Brand card ── */
function BrandCard({ brand, onClick, index }) {
  const [hovered, setHovered] = useState(false)
  const accent = BRAND_ACCENT[brand.name] || '#00D4AA'
  const cat    = BRAND_CATEGORY[brand.name]

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="animate-fade-up"
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16,
        padding: '28px 22px 22px',
        width: '100%', textAlign: 'center',
        background: hovered
          ? `linear-gradient(160deg, ${accent}0D 0%, var(--surface) 60%)`
          : 'var(--surface)',
        border: hovered
          ? `1px solid ${accent}60`
          : '1px solid var(--border)',
        borderRadius: 20,
        cursor: 'pointer', outline: 'none',
        transition: 'border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 40px ${accent}20, 0 4px 16px rgba(0,0,0,0.3)`
          : '0 1px 4px rgba(0,0,0,0.2)',
        animationDelay: `${index * 40}ms`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Glow orb */}
      {hovered && (
        <div style={{
          position: 'absolute', top: -20, left: '50%',
          transform: 'translateX(-50%)',
          width: 120, height: 80, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accent}28 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      <BrandLogo name={brand.name} />

      <div style={{ width: '100%' }}>
        {/* FIX: brand name always var(--text-1), never neon */}
        <p style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--text-1)',
          lineHeight: 1.3, marginBottom: 4,
          letterSpacing: '-0.01em',
        }}>
          {brand.name}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          {/* FIX: country always var(--text-3) — was sometimes accent-colored */}
          {brand.country && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {brand.country}
            </span>
          )}
          {cat && (
            <>
              {brand.country && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>·</span>}
              {/* FIX: category tag uses accent for color only at reduced opacity */}
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: accent,
                opacity: 0.75,   /* toned down so it's readable, not glaring */
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                {cat === 'Two-wheelers' ? '2W' : 'Car'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 600,
        /* FIX: use var(--text-1) so it's always legible against dark bg */
        color: 'var(--text-1)',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}>
        Select <ChevronRight style={{ width: 12, height: 12 }} />
      </div>
    </button>
  )
}

/* ── Category filter pill ── */
function FilterPill({ label, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 100,
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', outline: 'none',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'rgba(0,212,170,0.1)' : 'var(--surface)',
        /* FIX: active text is var(--accent) which is fine since it's on dark bg;
                inactive text bumped to var(--text-1) for better readability */
        color: active ? 'var(--accent)' : 'var(--text-1)',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}{label}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function BrandSelection() {
  const [brands,   setBrands]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const navigate = useNavigate()

  const fetchBrands = () => {
    setLoading(true); setError(null)
    fetch(`${API_URL}/api/brands`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d  => { setBrands(d); setLoading(false) })
      .catch(() => { setError('Could not load brands — is the backend running?'); setLoading(false) })
  }

  useEffect(() => { fetchBrands() }, [])

  const filtered = brands.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = category === 'All' || BRAND_CATEGORY[b.name] === category
    return matchSearch && matchCat
  })

  const counts = {
    'All':          brands.length,
    'Cars':         brands.filter(b => BRAND_CATEGORY[b.name] === 'Cars').length,
    'Two-wheelers': brands.filter(b => BRAND_CATEGORY[b.name] === 'Two-wheelers').length,
  }

  const pillIcon = (cat) => {
    if (cat === 'Cars') return <Car style={{ width: 12, height: 12 }} />
    if (cat === 'Two-wheelers') return <Bike style={{ width: 12, height: 12 }} />
    return null
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      padding: '44px 20px 96px',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 12,
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            Step 1 of 2
          </span>
          <h1 style={{
            fontSize: 'clamp(26px, 5vw, 36px)',
            fontWeight: 800, letterSpacing: '-0.03em',
            marginBottom: 10, lineHeight: 1.1,
          }}>
            Choose your EV brand
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
            Select the manufacturer of your electric vehicle
          </p>
        </div>

        {/* ── Search + filters ── */}
        {!error && (
          <div className="animate-fade-up" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16,
            marginBottom: 36, animationDelay: '60ms',
          }}>
            <div style={{ maxWidth: 340, width: '100%', position: 'relative' }}>
              <Search style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                width: 15, height: 15,
                color: 'var(--text-3)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search brands…"
                className="input-field"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 42, borderRadius: 12 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {CATEGORIES.map(cat => (
                <FilterPill
                  key={cat}
                  label={cat === 'All' ? `All (${counts['All']})` : `${cat} (${counts[cat]})`}
                  active={category === cat}
                  icon={pillIcon(cat)}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '56px 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,77,109,0.08)',
              border: '1px solid rgba(255,77,109,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Car style={{ width: 20, height: 20, color: 'var(--error)' }} />
            </div>
            <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>Connection Error</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>{error}</p>
            <button className="btn-secondary" onClick={fetchBrands}>Try again</button>
          </div>
        )}

        {/* ── Grid ── */}
        {!error && (
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14,
            }}
          >
            {loading
              ? Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map((brand, i) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    index={i}
                    onClick={() => navigate(`/select-model/${brand.id}`)}
                  />
                ))
            }
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '56px 0' }}>
            <Search style={{ width: 32, height: 32, margin: '0 auto 14px', opacity: 0.25 }} />
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>
              No brands found{search ? ` for "${search}"` : ''}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
              Try a different search or category
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && !error && filtered.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-3)' }}>
            {filtered.length} brand{filtered.length !== 1 ? 's' : ''} available · Tap to see models
          </p>
        )}

      </div>
    </div>
  )
}
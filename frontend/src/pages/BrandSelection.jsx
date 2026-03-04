import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Search, ChevronRight } from 'lucide-react'
import { API_URL } from '../App'

/* ═══════════════════════════════════════════════════════════
   BRAND LOGOS — 100% inline SVG, no network, never breaks.
   Each one is hand-coded to match the actual brand identity.
═══════════════════════════════════════════════════════════ */
function TataLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#00205B"/>
      <ellipse cx="30" cy="30" rx="21" ry="13" stroke="white" strokeWidth="2.8"/>
      <text x="30" y="34.5" textAnchor="middle" fill="white" fontSize="12.5" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1.5">TATA</text>
    </svg>
  )
}

function MahindraLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#BE0000"/>
      {/* M shape */}
      <path d="M11 44 L11 20 L30 36 L49 20 L49 44" stroke="white" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function MGLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#C8102E"/>
      <rect x="7" y="7" width="46" height="46" rx="9" stroke="white" strokeWidth="2.5"/>
      <text x="30" y="37" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">MG</text>
    </svg>
  )
}

function HyundaiLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#002C5F"/>
      {/* Italic H in oval */}
      <ellipse cx="30" cy="30" rx="22" ry="15" stroke="white" strokeWidth="2.5" transform="rotate(-8 30 30)"/>
      <text x="31" y="36.5" textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="Arial,sans-serif" fontStyle="italic">H</text>
    </svg>
  )
}

function BYDLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#1B4F72"/>
      <rect x="6" y="19" width="48" height="22" rx="5" stroke="white" strokeWidth="2"/>
      <text x="30" y="34.5" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="2">BYD</text>
    </svg>
  )
}

function KiaLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#05141F"/>
      <rect x="5" y="18" width="50" height="24" rx="12" fill="white" opacity="0.07"/>
      <text x="30" y="36" textAnchor="middle" fill="white" fontSize="21" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="2.5" fontStyle="italic">KIA</text>
    </svg>
  )
}

function VolvoLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#003057"/>
      <circle cx="29" cy="33" r="16" stroke="white" strokeWidth="2.8"/>
      {/* Arrow top-right */}
      <line x1="41" y1="19" x2="52" y2="8" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
      <polyline points="44,8 52,8 52,16" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="29" y="37" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="0.3">VOLVO</text>
    </svg>
  )
}

function TeslaLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#CC0000"/>
      {/* Tesla T — top crossbar with curved notch, vertical stem */}
      <path d="M14 17 Q22 13 30 12 Q38 13 46 17 Q39 20 30 20 Q21 20 14 17Z" fill="white"/>
      <path d="M27 20 L27 48 L33 48 L33 20" fill="white"/>
    </svg>
  )
}

function OlaLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#1C1C1C"/>
      {/* Lightning bolt */}
      <path d="M35 9 L25 33 L33 33 L25 51 L41 27 L32 27 L40 9 Z" fill="#F97316"/>
    </svg>
  )
}

function AtherLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#007BFF"/>
      {/* A letterform */}
      <path d="M30 11 L48 48 L38 48 L30 28 L22 48 L12 48 Z" fill="white"/>
      <rect x="19" y="35" width="22" height="4" rx="2" fill="#007BFF"/>
    </svg>
  )
}

function MarutiLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#003399"/>
      {/* S curve — Suzuki S */}
      <path d="M40 18 Q24 14 20 22 Q16 30 30 31 Q44 32 40 41 Q36 48 18 43" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function CitroenLogo({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#C40404"/>
      {/* Double chevron — Citroën's iconic mark */}
      <path d="M13 21 L30 33 L47 21" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 33 L30 45 L47 33" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const LOGOS = {
  'Tata Motors':   TataLogo,
  'Mahindra':      MahindraLogo,
  'MG Motor':      MGLogo,
  'Hyundai':       HyundaiLogo,
  'BYD':           BYDLogo,
  'Kia':           KiaLogo,
  'Volvo':         VolvoLogo,
  'Tesla':         TeslaLogo,
  'Ola Electric':  OlaLogo,
  'Ather Energy':  AtherLogo,
  'Maruti Suzuki': MarutiLogo,
  'Citroen':       CitroenLogo,
}

function BrandLogo({ name, size = 58 }) {
  const Logo = LOGOS[name]
  if (Logo) return <Logo s={size} />
  /* Generic fallback for any new brand */
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="13" fill="#1A2235"/>
      <text x="30" y="38" textAnchor="middle" fill="#00D4AA" fontSize="20" fontWeight="900" fontFamily="Arial,sans-serif">{initials}</text>
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div className="skeleton" style={{ width: 58, height: 58, borderRadius: 14 }} />
      <div className="skeleton" style={{ width: 68, height: 12, borderRadius: 8 }} />
    </div>
  )
}

export default function BrandSelection() {
  const [brands,  setBrands]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const navigate = useNavigate()

  const fetchBrands = () => {
    setLoading(true); setError(null)
    fetch(`${API_URL}/api/brands`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setBrands(d); setLoading(false) })
      .catch(() => { setError('Could not load brands — is the backend running?'); setLoading(false) })
  }

  useEffect(() => { fetchBrands() }, [])

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', padding: '36px 16px 80px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto' }}>

        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
            Step 1 of 2
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 800, marginBottom: 8 }}>Select your brand</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Choose your EV manufacturer to see available models</p>
        </div>

        {!error && (
          <div className="animate-fade-up" style={{ maxWidth: 300, margin: '0 auto 32px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search brands…" className="input-field" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
        )}

        {error && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Car className="w-5 h-5" style={{ color: 'var(--error)' }} />
            </div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Connection Error</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>{error}</p>
            <button className="btn-secondary" onClick={fetchBrands}>Try again</button>
          </div>
        )}

        {!error && (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 12 }}>
            {loading
              ? Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => navigate(`/select-model/${brand.id}`)}
                    className="card card-interactive animate-fade-up"
                    style={{ padding: '20px 12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  >
                    <BrandLogo name={brand.name} size={58} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.3, display: 'block' }}>
                        {brand.name}
                      </span>
                      {brand.country && (
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'block' }}>
                          {brand.country}
                        </span>
                      )}
                    </div>
                  </button>
                ))
            }
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p style={{ fontWeight: 500 }}>No brands found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
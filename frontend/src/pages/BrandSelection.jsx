import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Search } from 'lucide-react'
import { API_URL } from '../App'

/* ─── Skeleton ─────────────────────────────────────────── */
function SkeletonBrandCard() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
      <div className="skeleton" style={{ width: 72, height: 14, borderRadius: 8 }} />
    </div>
  )
}

/* ─── Error State ──────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }} className="animate-fade-in">
      <div
        style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(255,77,109,0.08)',
          border: '1px solid rgba(255,77,109,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Car className="w-6 h-6" style={{ color: 'var(--error)' }} />
      </div>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>Connection Error</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>{message}</p>
      <button className="btn-secondary" onClick={onRetry}>Try again</button>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function BrandSelection() {
  const [brands, setBrands]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const navigate = useNavigate()

  const fetchBrands = () => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/api/brands`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        return res.json()
      })
      .then(data => {
        setBrands(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Could not load brands. Make sure the backend is running.')
        setLoading(false)
      })
  }

  useEffect(() => { fetchBrands() }, [])

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--bg)',
        padding: '48px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: 12,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            Step 1 of 2
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>
            Select your brand
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15 }}>
            Choose your EV manufacturer to see available models
          </p>
        </div>

        {/* ── Search ── */}
        {!error && (
          <div
            className="animate-fade-up"
            style={{ maxWidth: 340, margin: '0 auto 40px', position: 'relative' }}
          >
            <Search
              className="w-4 h-4"
              style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3)', pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search brands..."
              className="input-field"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>
        )}

        {/* ── Error ── */}
        {error && <ErrorState message={error} onRetry={fetchBrands} />}

        {/* ── Grid ── */}
        {!error && (
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 14,
            }}
          >
            {loading
              ? Array(12).fill(0).map((_, i) => <SkeletonBrandCard key={i} />)
              : filtered.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => navigate(`/select-model/${brand.id}`)}
                  className="card card-interactive animate-fade-up"
                  style={{
                    padding: '22px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  {/* Logo */}
                  <div
                    style={{
                      width: 60, height: 60,
                      background: '#fff',
                      borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Car className="w-7 h-7" style={{ color: '#555' }} />
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 13, fontWeight: 600,
                      color: 'var(--text-1)', lineHeight: 1.3,
                    }}
                  >
                    {brand.name}
                  </span>
                </button>
              ))
            }
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div
            className="animate-fade-in"
            style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-2)' }}
          >
            <Search className="w-8 h-8 mx-auto mb-4 opacity-30" />
            <p style={{ fontWeight: 500 }}>No brands found for "{search}"</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Try a different search term</p>
          </div>
        )}

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Battery, Zap, ChevronLeft, Gauge, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { API_URL } from '../App'

/* ─── Skeleton ─────────────────────────────────────────── */
function SkeletonModelCard() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 100 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 12, borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: '80%',  height: 12, borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: '65%',  height: 12, borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 10 }} />
    </div>
  )
}

/* ─── Range color helper ───────────────────────────────── */
const rangeColor = (km) => {
  if (km >= 400) return 'var(--accent)'
  if (km >= 250) return '#FBBF24'
  return '#FF4D6D'
}

/* ─── Page ──────────────────────────────────────────────── */
export default function ModelSelection() {
  const { brandId }  = useParams()
  const navigate     = useNavigate()
  const { setSelectedCar, addToast } = useStore()

  const [models,    setModels]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [brandName, setBrandName] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/brands/${brandId}/models`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setModels(data)
        if (data.length > 0) setBrandName(data[0].brand || '')
        setLoading(false)
      })
      .catch(() => {
        addToast('error', 'Could not load models — check backend connection')
        setLoading(false)
      })
  }, [brandId])

  const handleSelect = (model) => {
    setSelectedCar(model)
    addToast('success', `${model.name} selected — now let's plan your route`)
    navigate('/plan-route')
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--bg)',
        padding: '40px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* ── Back + Header ── */}
        <div className="animate-fade-up" style={{ marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost"
            style={{ marginBottom: 20, marginLeft: -10 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to brands
          </button>

          <span
            style={{
              display: 'block',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: 10,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            Step 2 of 2
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
            {brandName || 'Select your model'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15 }}>
            Choose your exact model for accurate range and charging calculations
          </p>
        </div>

        {/* ── Grid ── */}
        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonModelCard key={i} />)
            : models.map(model => {
                const efficiency = (model.battery_capacity_kwh / model.range_km * 1000).toFixed(0)

                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model)}
                    className="card card-interactive animate-fade-up"
                    style={{
                      padding: 24,
                      textAlign: 'left',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {/* Model name + range */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                        gap: 12,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 16, fontWeight: 700,
                          color: 'var(--text-1)', lineHeight: 1.3,
                        }}
                      >
                        {model.name}
                      </h3>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: 20, fontWeight: 700,
                            color: rangeColor(model.range_km),
                            lineHeight: 1,
                          }}
                        >
                          {model.range_km}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>km range</div>
                      </div>
                    </div>

                    {/* Range bar */}
                    <div
                      style={{
                        height: 3, background: 'var(--surface-3)',
                        borderRadius: 10, overflow: 'hidden', marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (model.range_km / 600) * 100)}%`,
                          background: rangeColor(model.range_km),
                          borderRadius: 10,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>

                    {/* Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {[
                        {
                          icon: <Battery className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />,
                          label: 'Battery',
                          value: `${model.battery_capacity_kwh} kWh`,
                        },
                        {
                          icon: <Zap className="w-3.5 h-3.5" style={{ color: '#FBBF24' }} />,
                          label: 'Max Charging',
                          value: `${model.charging_speed_kw} kW`,
                        },
                        {
                          icon: <Gauge className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />,
                          label: 'Efficiency',
                          value: `${efficiency} Wh/km`,
                        },
                      ].map((spec, si) => (
                        <div
                          key={si}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 13,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              color: 'var(--text-2)',
                            }}
                          >
                            {spec.icon}
                            {spec.label}
                          </div>
                          <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer CTA */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 16,
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        Select this model
                      </span>
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'rgba(0,212,170,0.08)',
                          color: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                )
              })
          }
        </div>

        {/* ── Empty ── */}
        {!loading && models.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-2)' }}>
            <p style={{ fontWeight: 500 }}>No models found for this brand</p>
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
              <ChevronLeft className="w-4 h-4" /> Go back
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
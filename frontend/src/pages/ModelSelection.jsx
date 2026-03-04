import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Battery, Zap, ChevronLeft, Gauge, ArrowRight, Search, ImageOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { API_URL } from '../App'

/* ═══════════════════════════════════════════════════════════
   MODEL IMAGE MAP — add file to /public/models/ → auto shows
═══════════════════════════════════════════════════════════ */
const MODEL_IMAGE_MAP = {
  /* ── Tata Motors ── */
  'Nexon EV':              '/models/tata-nexon-ev.png',
  'Nexon EV Long Range':   '/models/tata-nexon-ev.png',
  'Nexon EV Max':          '/models/tata-nexon-ev.png',
  'Tiago EV':              '/models/tata-tiago-ev.png',
  'Punch EV':              '/models/tata-punch-ev.png',
  'Curvv EV':              '/models/tata-curvv-ev.png',
  'Sierra EV':             '/models/tata-sierra-ev.png',
  'Harrier EV':            '/models/harrierev.png',
  'Tigor EV':              '/models/tigorev.png',
  /* ── Mahindra ── */
  'BE 6e':                 '/models/mahindra-be6e.png',
  'BE 6':                  '/models/mahindra-be6e.png',
  'XEV 9e':                '/models/mahindra-xev9e.png',
  'XEV 7e':                '/models/XEV-9e.png',
  'XUV400 EC Pro':         '/models/mahindra-xuv400.png',
  'XUV400 EL Pro':         '/models/mahindra-xuv400.png',
  /* ── MG Motor ── */
  'Windsor EV':            '/models/mg-windsor-ev.png',
  'Comet EV':              '/models/mg-comet-ev.png',
  'ZS EV':                 '/models/mg-zs-ev.png',
  'ZS EV 2024':            '/models/mg-zs-ev.png',
  'Cyberster':             '/models/cyberster.png',
  /* ── Hyundai ── */
  'Creta EV':              '/models/hyundai-creta-electric.png',
  'IONIQ 5':               '/models/hyundai-ioniq5.png',
  'IONIQ 5 N':             '/models/hyundai-ioniq5.png',
  'IONIQ 6':               '/models/hyundai-ioniq6.png',
  'IONIQ 9':               '/models/ionix9.png',
  'Kona Electric':         '/models/Kona.png',
  /* ── Kia ── */
  'EV6':                   '/models/kia-ev6.png',
  'EV6 GT':                '/models/kia-ev6.png',
  'EV9':                   '/models/kia-ev9.png',
  /* ── Volvo ── */
  'XC40 Recharge':         '/models/volvo-xc40-recharge.png',
  'C40 Recharge':          '/models/volvo-c40-recharge.png',
  'EX30':                  '/models/volvo-ex30.png',
  'EX90':                  '/models/volvo-ex90.png',
  /* ── Tesla ── */
  'Model 3 Long Range':    '/models/tesla-model3.png',
  'Model 3 Standard':      '/models/tesla-model3.png',
  'Model Y Long Range':    '/models/tesla-modely.png',
  'Model Y Standard':      '/models/tesla-modely.png',
  'Model S':               '/models/tesla-models.png',
  'Model X':               '/models/tesla-modelx.png',
  /* ── Ola Electric ── */
  'S1 Pro':                '/models/ola-s1-pro.png',
  'S1 Air':                '/models/ola-s1-air.png',
  'S1 X':                  '/models/ola-s1-x.png',
  'S1 X+':                 '/models/ola-s1-pro.png',
  'S1':                    '/models/ola-s1-air.png',
  /* ── Ather Energy ── */
  '450X':                  '/models/ather-450x.png',
  '450S':                  '/models/ather-450s.png',
  'Rizta Z':               '/models/ather-rizta.png',
  '450 Apex':              '/models/ather-450x.png',
  /* ── Maruti Suzuki ── */
  'eVitara':               '/models/maruti-evitara.png',
  /* ── Citroen ── */
  'eC3':                   '/models/citroen-ec3.png',
  'eC3 Aircross':          '/models/citroen-ec3-aircross.png',
  /* ── BYD ── */
  'Seal':                  '/models/byd-seal.png',
  'Atto 3':                '/models/byd-atto3.png',
  'Sealion 6':             '/models/byd-sealion6.png',
  'Dolphin':               '/models/byd-dolphin.png',
}

/* ── Original neon segment colours — unchanged ── */
const SEGMENT_COLORS = {
  'SUV':         '#00D4AA',
  'Hatchback':   '#A78BFA',
  'Sedan':       '#60A5FA',
  'Crossover':   '#34D399',
  'Coupe SUV':   '#F59E0B',
  'MPV':         '#FB923C',
  'Sports':      '#F43F5E',
  'Performance': '#EF4444',
  'Micro EV':    '#06B6D4',
  'Scooter':     '#FBBF24',
}

/* ── Original range colours — unchanged ── */
const rangeColor = km =>
  km >= 500 ? '#00D4AA' : km >= 300 ? '#FBBF24' : '#FF4D6D'

/* ═══════════════════════════════════════════════════════════
   MODEL IMAGE — real photo or placeholder box
═══════════════════════════════════════════════════════════ */
function ModelImage({ name, color }) {
  const src = MODEL_IMAGE_MAP[name]
  const [status, setStatus] = useState(src ? 'loading' : 'missing')

  useEffect(() => { setStatus(src ? 'loading' : 'missing') }, [src])

  if (status === 'missing') {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: `${color}07`,
        border: `1.5px dashed ${color}28`,
        borderRadius: 10,
      }}>
        <ImageOff style={{ width: 20, height: 20, color: `${color}45` }} />
        {/* FIX: placeholder text readable — was ${color}55 which was often invisible */}
        <span style={{
          fontSize: 11,
          color: 'var(--text-3)',
          letterSpacing: '0.04em',
        }}>
          image coming soon
        </span>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {status === 'loading' && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 10 }} />
      )}
      <img
        src={src}
        alt={name}
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('missing')}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          display: 'block',
          padding: '8px 14px',
          opacity: status === 'ok' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          filter: status === 'ok' ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))' : 'none',
        }}
      />
    </div>
  )
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20, overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ width: '55%', height: 15, borderRadius: 7 }} />
        <div className="skeleton" style={{ width: '35%', height: 11, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: '100%', height: 4, borderRadius: 6, marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MODEL CARD
   FIX 1: CARD_BODY_H raised from 118 → 150 so hover panel
           never clips "Select model" at the bottom.
   FIX 2: All human-readable text uses var(--text-*) tokens.
           Neon accent colours kept only for borders/glows/icons.
═══════════════════════════════════════════════════════════ */
const CARD_BODY_H = 150

function ModelCard({ model, onClick, index }) {
  const [hovered, setHovered] = useState(false)

  const color    = SEGMENT_COLORS[model.segment] || '#00D4AA'
  const rColor   = rangeColor(model.range_km)
  const rangePct = Math.min(100, (model.range_km / 700) * 100)
  const eff      = ((model.battery_capacity_kwh / model.range_km) * 1000).toFixed(0)

  const specs = [
    {
      /* Keep the neon icon colours — they're decorative, not text */
      icon:  <Battery style={{ width: 13, height: 13, color: '#00D4AA' }} />,
      label: 'Battery',
      value: `${model.battery_capacity_kwh} kWh`,
    },
    {
      icon:  <Zap style={{ width: 13, height: 13, color: '#FBBF24' }} />,
      label: 'Max charge',
      value: `${model.charging_speed_kw} kW`,
    },
    {
      icon:  <Gauge style={{ width: 13, height: 13, color: '#A78BFA' }} />,
      label: 'Efficiency',
      value: `${eff} Wh/km`,
    },
  ]

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="animate-fade-up"
      style={{
        width: '100%', textAlign: 'left',
        border: `1px solid ${hovered ? color + '50' : 'var(--border)'}`,
        borderRadius: 20,
        background: hovered
          ? `linear-gradient(160deg, ${color}0B 0%, var(--surface) 55%)`
          : 'var(--surface)',
        cursor: 'pointer', outline: 'none',
        overflow: 'hidden', padding: 0,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 36px ${color}18, 0 4px 14px rgba(0,0,0,0.28)`
          : '0 1px 3px rgba(0,0,0,0.15)',
        transition:
          'border-color 0.2s ease, background 0.2s ease, ' +
          'box-shadow 0.2s ease, transform 0.2s ease',
        animationDelay: `${index * 45}ms`,
      }}
    >
      {/* ── IMAGE ZONE ── */}
      <div style={{
        height: 160, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(160deg, ${color}14 0%, ${color}05 60%, transparent 100%)`,
        borderBottom: `1px solid ${hovered ? color + '28' : 'var(--border)'}`,
        transition: 'border-color 0.2s ease',
      }}>
        {/* Segment tag — FIX: was using full ${color} text on dark bg, now softer */}
        <span style={{
          position: 'absolute', top: 12, left: 14, zIndex: 2,
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          /* Keep accent for segment tag but at reduced opacity so it doesn't scream */
          color, opacity: 0.8,
          fontFamily: 'IBM Plex Mono, monospace',
        }}>
          {model.segment || 'EV'}
        </span>

        {/* Range badge — FIX: white text on dim pill, not raw rColor on dark bg */}
        <div style={{
          position: 'absolute', top: 10, right: 14, zIndex: 2,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 100,
          background: `${rColor}18`,
          border: `1px solid ${rColor}40`,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            /* FIX: range text white — was rColor directly which could be nearly invisible */
            color: 'var(--text-1)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            {model.range_km} km
          </span>
        </div>

        {/* Car image */}
        <div style={{
          position: 'absolute', inset: '30px 0 0 0',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.28s ease',
        }}>
          <ModelImage name={model.name} color={color} />
        </div>

        {/* Bottom glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 110%, ${color}1A 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }} />
      </div>

      {/* ── CARD BODY — fixed height, two overlapping panels ── */}
      <div style={{ position: 'relative', height: CARD_BODY_H, overflow: 'hidden' }}>

        {/* DEFAULT PANEL */}
        <div style={{
          position: 'absolute', inset: 0,
          padding: '16px 18px 18px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.16s ease, transform 0.16s ease',
        }}>
          <div>
            {/* FIX: model name always var(--text-1) — was sometimes inheriting neon */}
            <p style={{
              fontSize: 16, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--text-1)',
              marginBottom: 3, lineHeight: 1.25,
            }}>
              {model.name}
            </p>
            {model.brand && (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{model.brand}</p>
            )}
          </div>

          {/* Range bar */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, marginBottom: 6,
            }}>
              {/* FIX: label was too dim — bumped to var(--text-2) */}
              <span style={{ color: 'var(--text-2)' }}>Range (ARAI)</span>
              {/* FIX: value uses rColor accent but on readable background */}
              <span style={{
                color: rColor, fontWeight: 600,
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                {model.range_km} km
              </span>
            </div>
            <div style={{
              height: 3, background: 'var(--surface-3)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${rangePct}%`,
                background: `linear-gradient(to right, ${rColor}, ${color})`,
                borderRadius: 10,
              }} />
            </div>
          </div>
        </div>

        {/* HOVER PANEL */}
        <div style={{
          position: 'absolute', inset: 0,
          padding: '16px 18px 18px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.2s ease 0.03s, transform 0.2s ease 0.03s',
        }}>
          {/* Spec rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {specs.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 7, fontSize: 13,
                  /* FIX: spec labels use var(--text-2) — was too dim before */
                  color: 'var(--text-2)',
                }}>
                  {s.icon}{s.label}
                </div>
                {/* FIX: spec values use var(--text-1) — plain white, fully readable */}
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 600, fontSize: 13,
                  color: 'var(--text-1)',
                }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* CTA — FIX: taller padding so it's never clipped */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: `1px solid ${color}25`,
            /* extra bottom breathing room */
            marginBottom: 2,
          }}>
            {/* FIX: "Select model" always var(--text-1) white — was color (neon) */}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
              Select model
            </span>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `${color}18`,
              border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Keep neon color on icon — decorative, not text */}
              <ArrowRight style={{ width: 13, height: 13, color }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Segment filter pill ── */
function FilterPill({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 100,
        fontSize: 12, fontWeight: 600,
        cursor: 'pointer', outline: 'none',
        /* Keep neon border when active — that's the style */
        border: `1px solid ${active ? (color || 'var(--accent)') : 'var(--border)'}`,
        background: active ? `${color || 'var(--accent)'}15` : 'var(--surface)',
        /* FIX: active label = var(--text-1) white, not raw neon on dark surface
                neon is already visible as the border — no need to double up on text */
        color: active ? 'var(--text-1)' : 'var(--text-2)',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
        fontFamily: 'IBM Plex Mono, monospace',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function ModelSelection() {
  const { brandId }                  = useParams()
  const navigate                     = useNavigate()
  const { setSelectedCar, addToast } = useStore()
  const { user, saveCarPreference }  = useAuth()

  const [models,    setModels]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [brandName, setBrandName] = useState('')
  const [search,    setSearch]    = useState('')
  const [segment,   setSegment]   = useState('All')

  useEffect(() => {
    fetch(`${API_URL}/api/brands/${brandId}/models`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        setModels(d)
        if (d[0]) setBrandName(d[0].brand || '')
        setLoading(false)
      })
      .catch(() => {
        addToast('error', 'Could not load models')
        setLoading(false)
      })
  }, [brandId])

  const handleSelect = async (model) => {
    setSelectedCar(model)
    if (user) await saveCarPreference(user.id, model.id)
    addToast('success', `${model.name} selected — let's plan your route!`)
    navigate('/plan-route')
  }

  const segments = [
    'All',
    ...Array.from(new Set(models.map(m => m.segment).filter(Boolean))),
  ]

  const counts = segments.reduce((acc, seg) => {
    acc[seg] = seg === 'All'
      ? models.length
      : models.filter(m => m.segment === seg).length
    return acc
  }, {})

  const filtered = models.filter(m => {
    const matchSearch  = m.name.toLowerCase().includes(search.toLowerCase())
    const matchSegment = segment === 'All' || m.segment === segment
    return matchSearch && matchSegment
  })

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      padding: '44px 20px 96px',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="animate-fade-up" style={{ marginBottom: 36 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost"
            style={{ marginLeft: -8, marginBottom: 20 }}
          >
            <ChevronLeft style={{ width: 15, height: 15 }} />
            Back to brands
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: 12,
              fontFamily: 'IBM Plex Mono, monospace',
            }}>
              Step 2 of 2
            </span>
            <h1 style={{
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 800, letterSpacing: '-0.03em',
              marginBottom: 10, lineHeight: 1.1,
            }}>
              {loading ? 'Loading models…' : `${brandName} models`}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
              Accurate range &amp; charging calculations based on your exact model
            </p>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        {!loading && models.length > 0 && (
          <div className="animate-fade-up" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, marginBottom: 36,
            animationDelay: '60ms',
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
                placeholder="Search models…"
                className="input-field"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 42, borderRadius: 12 }}
              />
            </div>

            {segments.length > 2 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {segments.map(seg => (
                  <FilterPill
                    key={seg}
                    label={`${seg === 'All' ? 'All' : seg} (${counts[seg]})`}
                    active={segment === seg}
                    color={seg === 'All' ? undefined : SEGMENT_COLORS[seg]}
                    onClick={() => setSegment(seg)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((m, i) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  index={i}
                  onClick={() => handleSelect(m)}
                />
              ))
          }
        </div>

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '56px 0' }}>
            <Search style={{
              width: 32, height: 32,
              margin: '0 auto 14px',
              color: 'var(--text-3)', opacity: 0.3,
            }} />
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>
              No models found{search ? ` for "${search}"` : ''}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
              Try a different search or segment
            </p>
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: 20 }}>
              <ChevronLeft style={{ width: 14, height: 14 }} />Go back
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && filtered.length > 0 && (
          <p style={{
            textAlign: 'center', marginTop: 32,
            fontSize: 12, color: 'var(--text-3)',
          }}>
            {filtered.length} model{filtered.length !== 1 ? 's' : ''} available
            &nbsp;·&nbsp;Hover for specs&nbsp;·&nbsp;Click to select
          </p>
        )}

      </div>
    </div>
  )
}
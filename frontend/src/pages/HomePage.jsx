import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Zap, Navigation, ChevronRight, Battery,
  Shield, Clock, TrendingUp, ArrowRight, Car
} from 'lucide-react'
import Footer from '../components/Footer'
import SEO from '../components/SEO'

/* ─── Mobile Detection ─────────────────────────────────── */
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
  { value: '1,200+', label: 'Charging Stations' },
  { value: '50+', label: 'EV Models' },
  { value: '28', label: 'States Covered' },
  { value: '< 2 mins', label: 'Route Calculation' },
]

const FEATURES = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#60A5FA',
    title: 'Topography & Gravity Math',
    desc: 'Our engine reads exact mountain elevations. Uphills actively drain energy, downhills recharge your battery via regenerative braking.',
    tag: 'Planetary Physics',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: '#FBBF24',
    title: 'Live Charger Network',
    desc: 'Real-time routing utilizing data from Tata Power, EESL, ChargeZone, Statiq & 20+ other networks.',
    tag: 'Active Nodes',
  },
  {
    icon: <Battery className="w-5 h-5" />,
    color: '#00D4AA',
    title: 'Model-Accurate Range',
    desc: 'Consumption profiles for each EV — intricately tracking exact battery percentages, load offsets, and real-world efficiency at 78%.',
    tag: 'Precision',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    color: '#A78BFA',
    title: '15% Hard Safety Buffer',
    desc: "We enforce strict mechanical limits. We never route you below a 15% charge, preventing ghost charging or dead batteries.",
    tag: 'Unbreakable',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    color: '#F472B6',
    title: 'Multi-Point Waypoints',
    desc: 'Design complex road trips. Drop custom stops and our engine seamlessly calculates detours and localized charging logic.',
    tag: 'Flexible Planner',
  },
  {
    icon: <Navigation className="w-5 h-5" />,
    color: '#34D399',
    title: 'Glassmorphic Trip Insights',
    desc: 'Visualize your journey through stunning slide-in panels, topographical impact metrics, and real-world fuel cost comparisons.',
    tag: 'Premium UI',
  },
]

const STEPS = [
  {
    step: '01',
    icon: <Car className="w-6 h-6" />,
    title: 'Pick your EV',
    desc: 'Select brand and model. We have specs for 50+ Indian market EVs with accurate consumption data.',
  },
  {
    step: '02',
    icon: <MapPin className="w-6 h-6" />,
    title: 'Enter your route',
    desc: 'Type start and destination. Set your current battery charge with our interactive gauge.',
  },
  {
    step: '03',
    icon: <Navigation className="w-6 h-6" />,
    title: 'Get your plan',
    desc: 'Receive an optimized route with charging stops, times, energy breakdown, and cost estimate.',
  },
]

/* ─── Components ────────────────────────────────────────── */
function FeatureCard({ icon, color, title, desc, tag, delay = 0 }) {
  return (
    <div
      className="card card-interactive p-6 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${color}14`,
            color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <span className="badge badge-gray" style={{ fontSize: 10 }}>{tag}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>{desc}</p>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const isMobile = useIsMobile()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SEO
        title="Smart EV Trip Planner for India"
        description="Plan your EV road trip seamlessly across India. Find exactly where to charge your Tata Nexon EV, MG ZS EV, and more based on real-world battery conditions."
        keywords="EV trip planner India, EV Route Planner, Charging Stations Map India, Tata Nexon EV Route, MG ZS EV"
      />

      {/* ── Background atmosphere ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Green glow top-right */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-8%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,212,170,0.07) 0%, transparent 65%)',
        }} />
        {/* Purple glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: '10%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 65%)',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 100%)',
        }} />
      </div>

      <div
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1100, margin: '0 auto',
          paddingTop: isMobile ? 112 : 160, paddingBottom: isMobile ? 48 : 80, textAlign: 'center',
        }}
      >

        {/* ══════════════════ HERO ══════════════════ */}
        <div style={{ paddingTop: isMobile ? 48 : 96, paddingBottom: isMobile ? 48 : 80, textAlign: 'center' }}>

          {/* Label pill */}
          <div
            className="animate-fade-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(0,212,170,0.08)',
              border: '1px solid rgba(0,212,170,0.2)',
              color: 'var(--accent)',
              fontSize: isMobile ? 11 : 12, fontWeight: 600,
              marginBottom: isMobile ? 20 : 28,
              animationDelay: '0ms',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'currentColor',
                animation: 'pulse-dot 1.5s ease infinite',
              }}
            />
            Built for Indian Roads · 1,200+ Chargers Live
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up"
            style={{
              fontSize: isMobile ? 'clamp(32px, 9vw, 44px)' : 'clamp(40px, 7vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: isMobile ? 16 : 24,
              animationDelay: '80ms',
            }}
          >
            Plan your EV trip.{isMobile ? ' ' : <br />}
            <span
              style={{
                background: 'linear-gradient(135deg, #00D4AA 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Without the anxiety.
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-up"
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.6,
              color: 'var(--text-2)',
              maxWidth: isMobile ? 380 : 520,
              margin: isMobile ? '0 auto 28px' : '0 auto 36px',
              animationDelay: '160ms',
            }}
          >
            The intelligent route planner for Indian EV drivers. Real battery math,
            real chargers, real confidence.
          </p>

          {/* CTAs — Stack vertically on mobile */}
          <div
            className="animate-fade-up"
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 10 : 12,
              justifyContent: 'center',
              alignItems: 'center',
              animationDelay: '240ms',
              maxWidth: isMobile ? 320 : undefined,
              margin: isMobile ? '0 auto' : undefined,
            }}
          >
            <Link to="/select-brand" className="btn-primary" style={{
              padding: isMobile ? '15px 28px' : '13px 26px',
              fontSize: 15,
              width: isMobile ? '100%' : undefined,
            }}>
              Start Planning
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{
              padding: isMobile ? '14px 26px' : '13px 26px',
              fontSize: 15,
              width: isMobile ? '100%' : undefined,
            }}>
              See how it works
            </a>
          </div>
        </div>

        {/* ══════════════════ STATS ══════════════════ */}
        <div
          className="animate-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'var(--border)',
            borderRadius: isMobile ? 18 : 16,
            overflow: 'hidden',
            marginBottom: isMobile ? 56 : 96,
            animationDelay: '320ms',
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface)',
                padding: isMobile ? '22px 16px' : '28px 24px',
                textAlign: 'center',
              }}
            >
              <div
                className="mono"
                style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-2)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════ FEATURES ══════════════════ */}
        <div style={{ marginBottom: isMobile ? 56 : 96 }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 48 }}>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, marginBottom: 8 }}>Everything you need</h2>
            <p style={{ color: 'var(--text-2)', fontSize: isMobile ? 14 : 15 }}>
              Built from scratch for the Indian EV experience
            </p>
          </div>

          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: isMobile ? 12 : 16,
            }}
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 60} />
            ))}
          </div>
        </div>

        {/* ══════════════════ HOW IT WORKS ══════════════════ */}
        <div id="how-it-works" style={{ marginBottom: isMobile ? 56 : 96 }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 48 }}>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, marginBottom: 8 }}>How it works</h2>
            <p style={{ color: 'var(--text-2)', fontSize: isMobile ? 14 : 15 }}>Three steps to drive without range anxiety</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: isMobile ? 12 : 16,
            }}
          >
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 28,
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {/* Big step number (background) */}
                <div
                  className="mono"
                  style={{
                    position: 'absolute', top: 16, right: 20,
                    fontSize: 56, fontWeight: 900,
                    color: 'var(--accent)', opacity: 0.07,
                    lineHeight: 1, userSelect: 'none',
                  }}
                >
                  {s.step}
                </div>

                <div
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'rgba(0,212,170,0.08)',
                    color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════ BOTTOM CTA ══════════════════ */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: isMobile ? 20 : 20,
            padding: isMobile ? '40px 20px' : '64px 24px',
            textAlign: 'center',
            marginBottom: isMobile ? 40 : 80,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '-30%', left: '50%',
            transform: 'translateX(-50%)',
            width: 400, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,212,170,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <p
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: 12, position: 'relative',
            }}
          >
            Start for free
          </p>
          <h2
            style={{
              fontSize: isMobile ? 'clamp(24px, 7vw, 32px)' : 'clamp(28px, 5vw, 42px)',
              fontWeight: 800,
              marginBottom: 10, position: 'relative',
            }}
          >
            Ready to drive smarter?
          </h2>
          <p
            style={{
              color: 'var(--text-2)', fontSize: isMobile ? 14 : 15,
              marginBottom: isMobile ? 24 : 32,
              position: 'relative',
            }}
          >
            Join thousands of Indian EV drivers who never worry about range.
          </p>
          <Link
            to="/select-brand"
            className="btn-primary"
            style={{
              padding: isMobile ? '15px 28px' : '14px 28px',
              fontSize: 15, position: 'relative',
              width: isMobile ? '100%' : undefined,
              maxWidth: isMobile ? 280 : undefined,
            }}
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
      <Footer />
    </div>
  )
}
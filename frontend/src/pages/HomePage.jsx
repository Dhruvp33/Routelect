import { Link } from 'react-router-dom'
import {
  MapPin, Zap, Navigation, ChevronRight, Battery,
  Shield, Clock, TrendingUp, ArrowRight, Car
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
  { value: '1,200+', label: 'Charging Stations' },
  { value: '50+', label: 'EV Models' },
  { value: '28', label: 'States Covered' },
  { value: '< 10s', label: 'Route Calculation' },
]

const FEATURES = [
  {
    icon: <Navigation className="w-5 h-5" />,
    color: '#60A5FA',
    title: 'Smart Indian Routing',
    desc: 'Algorithms built for NH highways, state roads, and city traffic. Every pothole accounted for.',
    tag: 'AI Powered',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: '#FBBF24',
    title: 'Live Charger Network',
    desc: 'Real-time data from Tata Power, EESL, ChargeZone, Statiq & 20+ networks.',
    tag: 'Live Data',
  },
  {
    icon: <Battery className="w-5 h-5" />,
    color: '#00D4AA',
    title: 'Model-Accurate Range',
    desc: 'Consumption profiles per EV model — accounting for speed, AC usage, load, and terrain.',
    tag: 'Precise',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    color: '#A78BFA',
    title: '10% Safety Buffer',
    desc: "We never route you below critical charge. Configurable safety margins, always.",
    tag: 'Safe',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    color: '#F472B6',
    title: 'Time-Optimal Stops',
    desc: 'Charging stops computed to minimize total trip time — not just driving distance.',
    tag: 'Optimized',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#34D399',
    title: 'Cost vs Petrol',
    desc: 'See exact energy cost and how much you save compared to an equivalent petrol car.',
    tag: 'Savings',
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
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

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
          maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        }}
      >

        {/* ══════════════════ HERO ══════════════════ */}
        <div style={{ paddingTop: 96, paddingBottom: 80, textAlign: 'center' }}>

          {/* Label pill */}
          <div
            className="animate-fade-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(0,212,170,0.08)',
              border: '1px solid rgba(0,212,170,0.2)',
              color: 'var(--accent)',
              fontSize: 12, fontWeight: 600,
              marginBottom: 28,
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
            Built for Indian Roads · 1,200+ Charging Stations Live
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up"
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 24,
              animationDelay: '80ms',
            }}
          >
            Plan your EV trip.<br />
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
              fontSize: 17,
              lineHeight: 1.65,
              color: 'var(--text-2)',
              maxWidth: 520,
              margin: '0 auto 36px',
              animationDelay: '160ms',
            }}
          >
            The intelligent route planner for Indian EV drivers. Real battery math,
            real chargers, real confidence.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up"
            style={{
              display: 'flex', gap: 12, justifyContent: 'center',
              flexWrap: 'wrap', animationDelay: '240ms',
            }}
          >
            <Link to="/select-brand" className="btn-primary" style={{ padding: '13px 26px', fontSize: 15 }}>
              Start Planning
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ padding: '13px 26px', fontSize: 15 }}>
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
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 96,
            animationDelay: '320ms',
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface)',
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════ FEATURES ══════════════════ */}
        <div style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>Everything you need</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>
              Built from scratch for the Indian EV experience — nothing generic
            </p>
          </div>

          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 60} />
            ))}
          </div>
        </div>

        {/* ══════════════════ HOW IT WORKS ══════════════════ */}
        <div id="how-it-works" style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>How it works</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>Three steps to drive without range anxiety</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
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
            borderRadius: 20,
            padding: '64px 24px',
            textAlign: 'center',
            marginBottom: 80,
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
              marginBottom: 16, position: 'relative',
            }}
          >
            Start for free
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800,
              marginBottom: 12, position: 'relative',
            }}
          >
            Ready to drive smarter?
          </h2>
          <p
            style={{
              color: 'var(--text-2)', fontSize: 15, marginBottom: 32,
              position: 'relative',
            }}
          >
            Join thousands of Indian EV drivers who never worry about range.
          </p>
          <Link
            to="/select-brand"
            className="btn-primary"
            style={{ padding: '14px 28px', fontSize: 15, position: 'relative' }}
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
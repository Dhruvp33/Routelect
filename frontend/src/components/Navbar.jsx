import { Link, useLocation } from 'react-router-dom'
import { Zap, Car, MapPin, ChevronRight, Wifi, WifiOff, Menu, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useState } from 'react'

export default function Navbar() {
  const { selectedCar, clearData, backendStatus } = useStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header
        style={{
          background: 'rgba(7, 11, 20, 0.96)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 500,
        }}
        className="backdrop-blur-xl"
      >
        <div
          className="max-w-7xl mx-auto px-5"
          style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 28, height: 28,
                background: 'var(--accent)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Zap className="w-4 h-4" style={{ color: '#000' }} fill="currentColor" />
            </div>
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '-0.02em',
                color: 'var(--text-1)',
              }}
            >
              Rout<span style={{ color: 'var(--accent)' }}>elect</span>
            </span>
          </Link>

          {/* ── Center breadcrumb (desktop) ── */}
          {selectedCar && (
            <div
              className="hidden md:flex items-center gap-2"
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                padding: '5px 12px',
              }}
            >
              <Car className="w-3 h-3" />
              <span>{selectedCar.brand}</span>
              <ChevronRight className="w-3 h-3" style={{ opacity: 0.4 }} />
              <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                {selectedCar.name || selectedCar.model}
              </span>
            </div>
          )}

          {/* ── Right side (desktop) ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Status pill */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontFamily: 'IBM Plex Mono, monospace',
                color: backendStatus ? 'var(--accent)' : 'var(--error)',
              }}
            >
              {backendStatus
                ? <Wifi className="w-3.5 h-3.5" />
                : <WifiOff className="w-3.5 h-3.5" />
              }
              <span>{backendStatus ? 'Online' : 'Offline'}</span>
            </div>

            <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

            <Link to="/select-brand" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>
              <Car className="w-3.5 h-3.5" />
              {selectedCar ? 'Change Car' : 'Select Car'}
            </Link>

            {selectedCar && (
              <Link to="/plan-route" className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
                <MapPin className="w-3.5 h-3.5" />
                Plan Route
              </Link>
            )}
          </div>

          {/* ── Mobile menu button ── */}
          <button
            className="md:hidden btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div
          className="md:hidden animate-fade-up"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'sticky',
            top: 56,
            zIndex: 499,
          }}
        >
          {selectedCar && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text-2)',
                padding: '8px 12px',
                background: 'var(--surface-2)',
                borderRadius: 10, border: '1px solid var(--border)',
              }}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{selectedCar.brand}</span>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                {selectedCar.name || selectedCar.model}
              </span>
            </div>
          )}

          <Link
            to="/select-brand"
            className="btn-secondary"
            onClick={() => setMenuOpen(false)}
            style={{ justifyContent: 'flex-start' }}
          >
            <Car className="w-4 h-4" />
            {selectedCar ? 'Change Car' : 'Select Car'}
          </Link>

          {selectedCar && (
            <Link
              to="/plan-route"
              className="btn-primary"
              onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'flex-start' }}
            >
              <MapPin className="w-4 h-4" />
              Plan Route
            </Link>
          )}

          {selectedCar && (
            <button
              onClick={() => { clearData(); setMenuOpen(false) }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--error)', fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
                padding: '6px 0', fontFamily: 'Outfit',
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </>
  )
}
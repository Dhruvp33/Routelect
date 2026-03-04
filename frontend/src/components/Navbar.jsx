import { Link, useLocation } from 'react-router-dom'
import { Navigation, Car, MapPin, Menu, X, LogOut, User, ChevronDown, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef, useEffect, useCallback } from 'react'
import AuthModal from './AuthModal'

/* ─────────────────────────────────────────────
   Routelect Logo Mark — custom SVG route icon
───────────────────────────────────────────── */
const RoutelectMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="19" r="2.5" fill="#000" />
    <circle cx="19" cy="5" r="2.5" fill="#000" />
    <path
      d="M5 16.5V11C5 8.79 6.79 7 9 7H15C17.21 7 19 5.21 19 3"
      stroke="#000"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M12 7L10 4.5L14 4.5L12 7Z" fill="#000" />
  </svg>
)

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function Navbar() {
  const location = useLocation()
  const { selectedCar, backendStatus } = useStore()
  const { user, signOut } = useAuth()

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [showAuth,    setShowAuth]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [visible,     setVisible]     = useState(true)

  const profileRef    = useRef(null)
  const lastScrollRef = useRef(0)
  const ticking       = useRef(false)

  const avatarUrl   = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
                   || user?.email?.split('@')[0]
                   || 'You'

  /* ── Hide / show on scroll ── */
  const handleScroll = useCallback(() => {
    if (ticking.current) return
    ticking.current = true

    requestAnimationFrame(() => {
      const currentY = window.scrollY
      if (currentY < 60) {
        setVisible(true)
      } else if (currentY > lastScrollRef.current + 4) {
        // Scrolling down — hide (also close mobile menu)
        setVisible(false)
        setMobileOpen(false)
        setProfileOpen(false)
      } else if (currentY < lastScrollRef.current - 4) {
        // Scrolling up — show
        setVisible(true)
      }
      lastScrollRef.current = currentY
      ticking.current = false
    })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  /* ── Close profile dropdown on outside click ── */
  useEffect(() => {
    const h = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── Lock body scroll when mobile drawer open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ── Close mobile menu on route change ── */
  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const navLinks = [
    {
      to: '/select-brand',
      label: selectedCar ? 'Change Car' : 'Select Car',
      icon: <Car size={14} />,
    },
    ...(selectedCar ? [{
      to: '/plan-route',
      label: 'Plan Route',
      icon: <MapPin size={14} />,
      primary: true,
    }] : []),
  ]

  return (
    <>
      {/* ─────────── Styles ─────────── */}
      <style>{`
        .rl-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 900;
          transform: translateY(0);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.2s ease;
        }
        .rl-header.hidden {
          transform: translateY(-100%);
        }
        .rl-bar {
          background: rgba(6, 10, 18, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.3);
        }
        .rl-inner {
          width: 100%;
          padding: 0 36px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo */
        .rl-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .rl-logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #00D4AA 0%, #00B87A 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(0,212,170,0.3);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          flex-shrink: 0;
        }
        .rl-logo:hover .rl-logo-mark {
          transform: rotate(-8deg) scale(1.06);
          box-shadow: 0 0 28px rgba(0,212,170,0.45);
        }
        .rl-logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.04em;
          color: #fff;
          line-height: 1;
        }
        .rl-logo-text span {
          color: #00D4AA;
        }

        /* Desktop Nav */
        .rl-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .rl-navlink {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9px;
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .rl-navlink:hover {
          background: rgba(255,255,255,0.07);
          color: #fff;
          border-color: rgba(255,255,255,0.08);
        }
        .rl-navlink.active {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.1);
        }
        .rl-navlink.primary {
          background: #00D4AA;
          color: #000 !important;
          border-color: transparent;
          box-shadow: 0 0 18px rgba(0,212,170,0.28);
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .rl-navlink.primary:hover {
          background: #00e5b8;
          box-shadow: 0 0 28px rgba(0,212,170,0.45);
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(0,212,170,0.28); }
          50%       { box-shadow: 0 0 30px rgba(0,212,170,0.5); }
        }

        /* Right cluster */
        .rl-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Status pill */
        .rl-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 100px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }
        .rl-status.live {
          background: rgba(0,212,170,0.1);
          border: 1px solid rgba(0,212,170,0.22);
          color: #00D4AA;
        }
        .rl-status.offline {
          background: rgba(255,77,109,0.1);
          border: 1px solid rgba(255,77,109,0.22);
          color: #FF4D6D;
        }
        .rl-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }
        .rl-status.live .rl-status-dot {
          background: #00D4AA;
          box-shadow: 0 0 6px #00D4AA;
          animation: dot-blink 2.5s ease infinite;
        }
        .rl-status.offline .rl-status-dot {
          background: #FF4D6D;
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        /* Sign in button */
        .rl-signin {
          padding: 8px 20px;
          border-radius: 9px;
          background: #00D4AA;
          border: none;
          color: #000;
          font-family: 'Outfit', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .rl-signin:hover {
          background: #00e8bc;
          box-shadow: 0 0 22px rgba(0,212,170,0.4);
          transform: translateY(-1px);
        }

        /* Profile button */
        .rl-profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 4px 12px 4px 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rl-profile-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
        }
        .rl-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          overflow: hidden;
          background: #1A2235;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1.5px solid rgba(0,212,170,0.4);
        }
        .rl-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .rl-profile-name {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rl-chevron {
          color: rgba(255,255,255,0.35);
          transition: transform 0.2s ease;
        }
        .rl-chevron.open { transform: rotate(180deg); }

        /* Profile dropdown */
        .rl-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: rgba(12, 18, 30, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          min-width: 220px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          overflow: hidden;
          z-index: 910;
          animation: dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top right;
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: scale(0.94) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .rl-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .rl-dropdown-name {
          font-family: 'Outfit', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
        }
        .rl-dropdown-email {
          font-size: 11px;
          color: rgba(255,255,255,0.38);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rl-dropdown-car {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }
        .rl-dropdown-signout {
          width: 100%;
          background: none;
          border: none;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: #FF4D6D;
          text-align: left;
          transition: background 0.12s ease;
        }
        .rl-dropdown-signout:hover {
          background: rgba(255,77,109,0.08);
        }

        /* Hamburger */
        .rl-hamburger {
          display: none;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          padding: 7px;
          cursor: pointer;
          color: rgba(255,255,255,0.8);
          transition: all 0.15s ease;
          align-items: center;
          justify-content: center;
        }
        .rl-hamburger:hover {
          background: rgba(255,255,255,0.1);
        }

        /* Mobile drawer */
        .rl-drawer-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 800;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: overlay-in 0.2s ease;
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .rl-drawer {
          position: fixed;
          top: 64px;
          left: 0; right: 0;
          z-index: 850;
          background: rgba(8, 13, 22, 0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 16px 20px 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: drawer-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top center;
        }
        @keyframes drawer-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0);     }
        }

        .rl-drawer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.15s ease;
          animation: link-stagger 0.3s ease both;
        }
        .rl-drawer-link:nth-child(1) { animation-delay: 0.04s; }
        .rl-drawer-link:nth-child(2) { animation-delay: 0.08s; }
        @keyframes link-stagger {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .rl-drawer-link:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.12);
        }
        .rl-drawer-link.primary {
          background: #00D4AA;
          color: #000 !important;
          border-color: transparent;
          box-shadow: 0 4px 20px rgba(0,212,170,0.25);
        }
        .rl-drawer-link.primary:hover {
          background: #00e5b8;
        }
        .rl-drawer-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 0;
          animation: link-stagger 0.3s ease 0.1s both;
        }
        .rl-drawer-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          animation: link-stagger 0.3s ease 0.12s both;
        }
        .rl-drawer-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: #1A2235;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1.5px solid rgba(0,212,170,0.35);
          overflow: hidden;
        }
        .rl-drawer-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .rl-drawer-signout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          background: rgba(255,77,109,0.07);
          border: 1px solid rgba(255,77,109,0.15);
          color: #FF4D6D;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          animation: link-stagger 0.3s ease 0.15s both;
        }
        .rl-drawer-signout:hover {
          background: rgba(255,77,109,0.12);
          border-color: rgba(255,77,109,0.25);
        }
        .rl-drawer-signin {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(0,212,170,0.1);
          border: 1px solid rgba(0,212,170,0.22);
          color: #00D4AA;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          animation: link-stagger 0.3s ease 0.15s both;
        }
        .rl-drawer-signin:hover {
          background: rgba(0,212,170,0.16);
        }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          .rl-inner {
            padding: 0 20px;
          }
          .rl-nav    { display: none; }
          .rl-status { display: none; }
          .rl-signin { display: none; }
          .rl-profile-btn { display: none; }
          .rl-hamburger { display: flex !important; }
        }
        @media (min-width: 681px) {
          .rl-drawer-overlay { display: none !important; }
          .rl-drawer         { display: none !important; }
        }
      `}</style>

      {/* ─────────── Header bar ─────────── */}
      <header className={`rl-header ${visible ? '' : 'hidden'}`}>
        <div className="rl-bar">
          <div className="rl-inner">

            {/* Logo */}
            <Link to="/" className="rl-logo">
              <div className="rl-logo-mark">
                <RoutelectMark />
              </div>
              <span className="rl-logo-text">
                Route<span>lect</span>
              </span>
            </Link>

            {/* Right cluster — nav links + status + auth all on the right */}
            <div className="rl-right">
              {/* Nav links */}
              <nav className="rl-nav">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rl-navlink ${link.primary ? 'primary' : location.pathname === link.to ? 'active' : ''}`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

              {/* Status pill */}
              <div className={`rl-status ${backendStatus ? 'live' : 'offline'}`}>
                <div className="rl-status-dot" />
                {backendStatus ? 'Live' : 'Offline'}
              </div>

              {/* Auth — desktop */}
              {user ? (
                <div ref={profileRef} style={{ position: 'relative' }}>
                  <button
                    className="rl-profile-btn"
                    onClick={() => setProfileOpen(o => !o)}
                  >
                    <div className="rl-avatar">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={displayName} />
                        : <User size={13} color="rgba(255,255,255,0.45)" />
                      }
                    </div>
                    <span className="rl-profile-name">{displayName}</span>
                    <ChevronDown size={12} className={`rl-chevron ${profileOpen ? 'open' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="rl-dropdown">
                      <div className="rl-dropdown-header">
                        <div className="rl-dropdown-name">{displayName}</div>
                        <div className="rl-dropdown-email">{user.email}</div>
                      </div>
                      {selectedCar && (
                        <div className="rl-dropdown-car">
                          <Car size={12} color="#00D4AA" />
                          {selectedCar.brand} {selectedCar.name}
                        </div>
                      )}
                      <button
                        className="rl-dropdown-signout"
                        onClick={() => { signOut(); setProfileOpen(false) }}
                      >
                        <LogOut size={13} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="rl-signin"
                  onClick={() => setShowAuth(true)}
                >
                  Sign in
                </button>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="rl-hamburger"
                onClick={() => setMobileOpen(o => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── Mobile drawer ─────────── */}
      {mobileOpen && (
        <>
          {/* Overlay — tap to close */}
          <div
            className="rl-drawer-overlay"
            style={{ display: 'block' }}
            onClick={() => setMobileOpen(false)}
          />

          <div className="rl-drawer">
            {/* Nav links */}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`rl-drawer-link ${link.primary ? 'primary' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="rl-drawer-divider" />

            {/* Status inside drawer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              animation: 'link-stagger 0.3s ease 0.1s both',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: backendStatus ? '#00D4AA' : '#FF4D6D',
                boxShadow: backendStatus ? '0 0 8px #00D4AA' : 'none',
              }} />
              <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: backendStatus ? '#00D4AA' : '#FF4D6D', fontWeight: 600 }}>
                Backend {backendStatus ? 'Live' : 'Offline'}
              </span>
            </div>

            <div className="rl-drawer-divider" />

            {/* User section */}
            {user ? (
              <>
                <div className="rl-drawer-user">
                  <div className="rl-drawer-avatar">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} />
                      : <User size={16} color="rgba(255,255,255,0.4)" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  className="rl-drawer-signout"
                  onClick={() => { signOut(); setMobileOpen(false) }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </>
            ) : (
              <button
                className="rl-drawer-signin"
                onClick={() => { setShowAuth(true); setMobileOpen(false) }}
              >
                <User size={16} />
                Sign in / Create account
              </button>
            )}
          </div>
        </>
      )}

      {/* ─────────── Auth modal ─────────── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '40px 24px 32px',
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Top row */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                    gap: 32, marginBottom: 32,
                }}>
                    {/* Brand */}
                    <div style={{ maxWidth: 280 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                        }}>
                            <div style={{
                                width: 28, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <img src="/routelect-logo.svg" alt="Routelect" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                                fontSize: 16, letterSpacing: '-0.03em',
                            }}>
                                ROUT<span style={{ color: 'var(--accent)' }}>ELECT</span>
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                            The intelligent EV route planner built for Indian roads.
                            Real battery math, real chargers, real confidence.
                        </p>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                        <div>
                            <p style={{
                                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12,
                                fontFamily: 'IBM Plex Mono, monospace',
                            }}>
                                Product
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <Link to="/select-brand" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>Choose EV</Link>
                                <Link to="/plan-route" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>Route Planner</Link>
                                <Link to="/chargers-map" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>Charger Map</Link>
                            </div>
                        </div>
                        <div>
                            <p style={{
                                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12,
                                fontFamily: 'IBM Plex Mono, monospace',
                            }}>
                                Tech Stack
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>React + Vite</span>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>FastAPI + OSRM</span>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>OpenStreetMap</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar — clean copyright only */}
                <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: 20,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        © {new Date().getFullYear()} Routelect · Made with ⚡ for Indian EV drivers
                    </p>
                </div>
            </div>
        </footer>
    )
}

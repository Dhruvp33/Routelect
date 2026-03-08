import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

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
                                width: 28, height: 28, borderRadius: 8,
                                background: 'linear-gradient(135deg, #00D4AA, #00B87A)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Zap style={{ width: 14, height: 14, color: '#000' }} />
                            </div>
                            <span style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                                fontSize: 16, letterSpacing: '-0.03em',
                            }}>
                                Route<span style={{ color: 'var(--accent)' }}>lect</span>
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                            The intelligent EV route planner built for Indian roads.
                            Open source · no ads · free forever.
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
                                <Link to="/chargers" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>Charger Map</Link>
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

                {/* Bottom bar */}
                <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: 20,
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                    alignItems: 'center', gap: 12,
                }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        © {new Date().getFullYear()} Routelect · Made with ⚡ for Indian EV drivers
                    </p>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
                        >
                            GitHub
                        </a>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            MIT License
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

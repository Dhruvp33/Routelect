import { Link } from 'react-router-dom'
import { MapPin, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div style={{
            minHeight: 'calc(100vh - 56px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
            padding: 24, textAlign: 'center',
        }}>
            <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <MapPin style={{ width: 32, height: 32, color: 'var(--accent)' }} />
            </div>

            <div>
                <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                    4<span style={{ color: 'var(--accent)' }}>0</span>4
                </h1>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                    Route not found
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 360 }}>
                    Looks like you took a wrong turn. This page doesn't exist.
                </p>
            </div>

            <Link to="/" className="btn-primary" style={{ padding: '12px 24px' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Back to Home
            </Link>
        </div>
    )
}

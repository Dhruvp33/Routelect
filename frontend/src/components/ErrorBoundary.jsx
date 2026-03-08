import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        background: 'var(--bg, #070B14)', color: 'var(--text-1, #F0F2FF)',
        padding: 24, textAlign: 'center',
        fontFamily: 'Outfit, system-ui, sans-serif',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle style={{ width: 28, height: 28, color: '#FF4D6D' }} />
        </div>

        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2, #8892A4)', maxWidth: 400, lineHeight: 1.6 }}>
            Routelect ran into an unexpected error. Try refreshing the page.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: 'var(--accent, #00D4AA)', color: '#000',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
          }}
        >
          Refresh Page
        </button>

        {this.state.error && (
          <pre style={{
            marginTop: 16, padding: 14, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, color: 'var(--text-3, #3D4A5C)',
            maxWidth: 500, overflow: 'auto', textAlign: 'left',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    )
  }
}

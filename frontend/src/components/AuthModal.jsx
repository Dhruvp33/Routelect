import { useState } from 'react'
import { X, Zap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field"
        style={{ paddingRight: 40 }}
        autoComplete="current-password"
      />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 2 }}
      >
        {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
      </button>
    </div>
  )
}

export default function AuthModal({ onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const [tab,      setTab]      = useState('login')  // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const handleGoogle = async () => {
    setLoading(true); reset()
    await signInWithGoogle()
    setLoading(false)
    onClose()
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); reset()

    try {
      if (tab === 'login') {
        const err = await signInWithEmail(email, password)
        if (err) { setError(err); setLoading(false); return }
        onClose()
      } else {
        const err = await signUpWithEmail(email, password, name)
        if (err) { setError(err); setLoading(false); return }
        setSuccess('Account created! Check your email to verify, then log in.')
        setTab('login')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', marginBottom: 10 }

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems: 'flex-end' }}
    >
      <div
        className="modal-panel"
        style={{ maxWidth: 420, width: '100%', borderRadius: '20px 20px 0 0' }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 14, height: 14, color: '#000' }} fill="currentColor" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
              Route<span style={{ color: 'var(--accent)' }}>lect</span>
            </span>
          </div>
          <button className="btn-ghost" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, marginBottom: 20, border: '1px solid var(--border)' }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); reset() }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 13, fontWeight: 700,
                  transition: 'all 0.18s',
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {t === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error / Success banners */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 9, marginBottom: 14, fontSize: 13, color: '#FF4D6D' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 9, marginBottom: 14, fontSize: 13, color: 'var(--accent)' }}>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column' }}>
            {tab === 'signup' && (
              <div style={inputStyle}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                  autoComplete="name"
                />
              </div>
            )}
            <div style={inputStyle}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px', borderRadius: 11,
                background: 'var(--accent)', color: '#000',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
                marginBottom: 14,
              }}
            >
              {loading
                ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} />Please wait…</>
                : tab === 'login' ? 'Log In' : 'Create Account'
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 11,
              background: '#fff', color: '#1a1a1a',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.15s',
              marginBottom: 16,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        {/* Footer note */}
        <div style={{ padding: '0 22px 22px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
            {tab === 'login'
              ? <>No account? <button onClick={() => { setTab('signup'); reset() }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, fontFamily: 'Outfit', fontWeight: 600 }}>Create one free →</button></>
              : <>Already have an account? <button onClick={() => { setTab('login'); reset() }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, fontFamily: 'Outfit', fontWeight: 600 }}>Log in →</button></>
            }
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>No spam · No ads · Free forever</p>
        </div>
      </div>
    </div>
  )
}
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [busy,         setBusy]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setError(d.error ?? 'Identifiants incorrects')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width:           '100%',
    padding:         '11px 14px 11px 40px',
    background:      'rgba(255,255,255,0.05)',
    border:          '1px solid rgba(255,255,255,0.1)',
    borderRadius:    11,
    fontSize:        14,
    color:           '#fff',
    outline:         'none',
    boxSizing:       'border-box',
    transition:      'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#0a0f2e',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '24px 16px',
      position:        'relative',
      overflow:        'hidden',
    }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position:   'absolute', top: -100, left: -80,
          width:      350, height: 350, borderRadius: '50%',
          background: 'rgba(0,48,144,0.4)', filter: 'blur(80px)',
        }} />
        <div style={{
          position:   'absolute', bottom: -80, right: -60,
          width:      300, height: 300, borderRadius: '50%',
          background: 'rgba(253,190,17,0.08)', filter: 'blur(60px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>

        {/* Card */}
        <div style={{
          background:   'rgba(255,255,255,0.04)',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding:      '32px 28px',
        }}>

          {/* Header inside card */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image
              src="/images/logo-white.png"
              alt="Al Hazm"
              width={56} height={56}
              style={{ objectFit: 'contain', margin: '0 auto 14px', display: 'block' }}
            />
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Espace Administration
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
              Al Hazm Rusicada Tour 2026
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Identifiant */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Identifiant
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-user" style={{
                  position:    'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize:    16, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
                }} aria-hidden="true" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Votre identifiant"
                  required
                  style={inputStyle}
                  onFocus={e  => (e.target.style.borderColor = 'rgba(253,190,17,0.4)')}
                  onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-lock" style={{
                  position:    'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize:    16, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
                }} aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e  => (e.target.style.borderColor = 'rgba(253,190,17,0.4)')}
                  onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position:   'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color:      'rgba(255,255,255,0.3)', padding: 4,
                  }}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 16 }} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                background:   'rgba(239,68,68,0.1)',
                border:       '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                padding:      '10px 14px',
                color:        '#ef4444',
                fontSize:     13,
              }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              style={{
                width:          '100%',
                padding:        '13px',
                background:     busy ? 'rgba(253,190,17,0.5)' : '#fdbe11',
                color:          '#003090',
                border:         'none',
                borderRadius:   12,
                fontSize:       14,
                fontWeight:     900,
                cursor:         busy ? 'not-allowed' : 'pointer',
                marginTop:      4,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                transition:     'opacity 0.2s',
              }}
            >
              {busy
                ? <i className="ti ti-loader-2" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                : null
              }
              {busy ? 'Connexion…' : 'Se connecter →'}
            </button>

          </form>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}

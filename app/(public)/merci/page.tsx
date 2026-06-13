'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ── Content (uses useSearchParams → needs Suspense boundary) ──────────────────

function MerciContent() {
  const searchParams = useSearchParams()
  const ref  = searchParams.get('ref')  ?? ''
  const nom  = searchParams.get('nom')  ?? ''
  const [copied, setCopied] = useState(false)

  const lienGroupe   = process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP ?? ''
  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'

  function handleCopy() {
    navigator.clipboard.writeText(ref).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f2e', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(0,48,144,0.4)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', filter: 'blur(70px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>{nomEvenement}</span>
      </header>

      <main style={{ flex: 1, position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeInUp 0.4s ease' }}>

          {/* Success icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', animation: 'popIn 0.5s ease' }}>
              <i className="ti ti-circle-check" style={{ color: '#4ade80', fontSize: 38 }} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
              {nom ? `Merci ${nom} !` : 'Réservation reçue !'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
              Votre demande a bien été transmise.
            </p>
          </div>

          {/* Reference */}
          {ref && (
            <div style={{ background: 'rgba(0,48,144,0.2)', border: '1px solid rgba(0,80,204,0.35)', borderRadius: 16, padding: '14px 20px', textAlign: 'center', marginBottom: 14 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Référence de réservation</p>
              <p style={{ color: '#fdbe11', fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.12em', margin: '0 0 10px' }}>{ref}</p>
              <button type="button" onClick={handleCopy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius: 8, color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 13 }} aria-hidden="true" />
                {copied ? 'Copié !' : 'Copier la référence'}
              </button>
            </div>
          )}

          {/* Next steps */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
            <p style={{ color: '#fdbe11', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Prochaines étapes</p>
            {[
              { icon: 'ti-clock',        text: 'Votre réservation est en attente de validation' },
              { icon: 'ti-phone',        text: 'Notre équipe vous contactera par téléphone'      },
              { icon: 'ti-check-circle', text: 'Vous recevrez une confirmation finale'           },
            ].map(s => (
              <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <i className={`ti ${s.icon}`} style={{ color: '#fdbe11', fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp group CTA */}
          {lienGroupe && (
            <a href={lienGroupe} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', background: '#25D366', color: '#fff', borderRadius: 13, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 10, boxSizing: 'border-box' }}>
              <i className="ti ti-brand-whatsapp" style={{ fontSize: 18 }} aria-hidden="true" />
              Rejoindre le groupe WhatsApp
            </a>
          )}

          {/* Book another */}
          <Link href="/formules"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', background: 'rgba(253,190,17,0.12)', border: '1px solid rgba(253,190,17,0.35)', color: '#fdbe11', borderRadius: 13, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 10, boxSizing: 'border-box' }}>
            <i className="ti ti-plus" aria-hidden="true" />
            Réserver une autre place
          </Link>

          {/* Back home */}
          <Link href="/"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 13, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}>
            <i className="ti ti-home" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
      </div>
    }>
      <MerciContent />
    </Suspense>
  )
}

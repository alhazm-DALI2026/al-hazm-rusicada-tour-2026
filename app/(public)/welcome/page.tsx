'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ── Data ──────────────────────────────────────────────────────────────────────

const BG_PHOTOS = ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg']

const SOCIALS = [
  {
    key:         'site',
    href:        'https://alhazm.vercel.app/',
    icon:        'ti-world',
    label:       'alhazm.vercel.app',
    hoverBg:     'rgba(253,190,17,0.14)',
    hoverBorder: 'rgba(253,190,17,0.55)',
    hoverColor:  '#fdbe11',
  },
  {
    key:         'instagram',
    href:        'https://www.instagram.com/alhazm_dz',
    icon:        'ti-brand-instagram',
    label:       '@alhazm_dz',
    hoverBg:     'rgba(225,48,108,0.14)',
    hoverBorder: 'rgba(225,48,108,0.55)',
    hoverColor:  '#e1306c',
  },
  {
    key:         'facebook',
    href:        'https://www.facebook.com/alhazmfootballacademy',
    icon:        'ti-brand-facebook',
    label:       'Al Hazm Football Academy',
    hoverBg:     'rgba(24,119,242,0.14)',
    hoverBorder: 'rgba(24,119,242,0.55)',
    hoverColor:  '#1877f2',
  },
  {
    key:         'tiktok',
    href:        'https://www.tiktok.com/@alhazm.academy',
    icon:        'ti-brand-tiktok',
    label:       '@alhazm.academy',
    hoverBg:     'rgba(255,255,255,0.1)',
    hoverBorder: 'rgba(255,255,255,0.5)',
    hoverColor:  '#ffffff',
  },
  {
    key:         'whatsapp',
    href:        'https://wa.me/213781608480',
    icon:        'ti-brand-whatsapp',
    label:       '+213 781 608 480',
    hoverBg:     'rgba(37,211,102,0.14)',
    hoverBorder: 'rgba(37,211,102,0.55)',
    hoverColor:  '#25d366',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router                = useRouter()
  const [phase, setPhase]     = useState(0)
  const [bgIdx, setBgIdx]     = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  // Séquence d'animation + skip si déjà vu
  useEffect(() => {
    const seen = localStorage.getItem('splash_seen')
    if (seen) { router.replace('/'); return }

    const t0 = setTimeout(() => setPhase(1), 50)    // logo entre
    const t1 = setTimeout(() => setPhase(2), 1200)  // fond photos
    const t2 = setTimeout(() => setPhase(3), 2600)  // logo remonte
    const t3 = setTimeout(() => setPhase(4), 3800)  // texte bienvenue
    const t4 = setTimeout(() => setPhase(5), 5000)  // CTA + réseaux
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [router])

  // Carrousel fond
  useEffect(() => {
    const iv = setInterval(() => setBgIdx(i => (i + 1) % 3), 2500)
    return () => clearInterval(iv)
  }, [])

  function handleEnter() {
    localStorage.setItem('splash_seen', 'true')
    router.push('/')
  }

  const logoTransform =
    phase < 1 ? 'scale(0) translateY(120px)' :
    phase < 3 ? 'scale(1) translateY(120px)' :
                'scale(0.5) translateY(0px)'

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0a0f2e', overflow: 'hidden', zIndex: 9999 }}>

      <style>{`
        @keyframes kenBurns {
          0%, 100% { transform: scale(1.12) translate(0, 0); }
          50%       { transform: scale(1.18) translate(-3%, -2%); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1);    opacity: 0.3; }
          50%       { transform: scale(1.06); opacity: 0.65; }
        }

        .sp-skip {
          position: absolute; top: 18px; right: 18px; z-index: 20;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; padding: 7px 14px;
          color: rgba(255,255,255,0.35); font-size: 11px; font-weight: 500;
          cursor: pointer; font-family: inherit;
          transition: border-color .2s, color .2s;
        }
        .sp-skip:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }

        .sp-cta {
          background: #fdbe11; color: #003090;
          padding: 14px 44px; font-size: 14px; font-weight: 900;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; border-radius: 12px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 10px;
          white-space: nowrap;
          box-shadow: 0 4px 24px rgba(253,190,17,0.3);
          font-family: inherit;
          transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .sp-cta:hover {
          transform: scale(1.05);
          background: #ffd34d;
          box-shadow: 0 8px 40px rgba(253,190,17,0.45);
        }

        .sp-social {
          display: flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 14px;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.12);
          text-decoration: none; flex-shrink: 0;
          transition: transform .25s ease, background .25s ease, border-color .25s ease;
          backdrop-filter: blur(8px);
        }
        .sp-social:hover { transform: translateY(-5px) scale(1.08); }
        @media (max-width: 768px) {
          .sp-logo-wrap  { width: 100px !important; height: 100px !important; }
          .sp-logo-img   { width: 78px !important; height: 78px !important; }
          .sp-title      { font-size: clamp(26px, 9vw, 42px) !important; white-space: normal !important; }
          .sp-cta        { padding: 12px 32px !important; font-size: 13px !important; }
          .sp-socials    { gap: 10px !important; }
          .sp-social     { width: 40px !important; height: 40px !important; border-radius: 12px !important; }
        }
      `}</style>

      {/* ── Bouton Passer ─────────────────────────────────────── */}
      <button type="button" className="sp-skip" onClick={handleEnter}>
        Passer ›
      </button>

      {/* ── Fond photos ───────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        {BG_PHOTOS.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url('${src}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            animation: 'kenBurns 8s ease-in-out infinite',
            opacity: bgIdx === i ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }} />
        ))}
        {/* Overlay sombre */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,46,0.72)', zIndex: 2 }} />
        {/* Spotlight */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'radial-gradient(circle at 50% 35%, rgba(253,190,17,0.1), transparent 55%)',
        }} />
      </div>

      {/* ── Zone logo ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 80,
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          transformOrigin: 'top center',
          transform: logoTransform,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'transform 1.4s cubic-bezier(0.6,0,0.2,1), opacity 0.8s ease',
        }}>
          {/* Anneau pulsant + logo */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              border: '2px solid rgba(253,190,17,0.5)',
              animation: 'pulseRing 2.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <div className="sp-logo-wrap" style={{
              width: 130, height: 130, borderRadius: '50%',
              background: '#fdbe11',
              border: '4px solid rgba(255,255,255,0.18)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Image
                src="/images/logo-color.png"
                width={100} height={100}
                alt="Al Hazm Academy"
                className="sp-logo-img"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>

          {/* Labels */}
          <div style={{ marginTop: 14 }}>
            <div style={{ color: '#fff', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700 }}>
              Al Hazm Academy
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 3 }}>
              FOOTBALL ACADEMY
            </div>
          </div>
        </div>
      </div>

      {/* ── Texte bienvenue ───────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', zIndex: 10,
        width: '90%', maxWidth: 520,
        opacity: phase >= 4 ? 1 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: phase >= 4 ? 'auto' : 'none',
      }}>
        <div style={{
          color: 'rgba(255,255,255,0.5)', fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          Bienvenue dans l&apos;expérience
        </div>
        <div className="sp-title" style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#fdbe11' }}>Rusicada</span>
          <span style={{ color: '#fff' }}> Tour 2026</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', marginTop: 14 }}>
          by Al Hazm Football Academy
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 140,
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        opacity: phase >= 5 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: phase >= 5 ? 'auto' : 'none',
      }}>
        <button type="button" className="sp-cta" onClick={handleEnter}>
          Vis l&apos;aventure
          <i className="ti ti-arrow-right" style={{ fontSize: 18 }} aria-hidden="true" />
        </button>
      </div>

      {/* ── Réseaux sociaux ───────────────────────────────────── */}
      <div className="sp-socials" style={{
        position: 'absolute', bottom: 32,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 14, alignItems: 'center',
        zIndex: 10,
        opacity: phase >= 5 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
        pointerEvents: phase >= 5 ? 'auto' : 'none',
      }}>
        {SOCIALS.map(s => (
          <div key={s.key} style={{ position: 'relative' }}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-social"
              style={{
                background:   hovered === s.key ? s.hoverBg     : 'rgba(255,255,255,0.07)',
                borderColor:  hovered === s.key ? s.hoverBorder : 'rgba(255,255,255,0.12)',
              }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <i
                className={`ti ${s.icon}`}
                style={{
                  fontSize: 21,
                  color: hovered === s.key ? s.hoverColor : 'rgba(255,255,255,0.6)',
                  transition: 'color .25s ease',
                }}
                aria-hidden="true"
              />
            </a>

            {/* Tooltip */}
            {hovered === s.key && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)',
                left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                color: '#fff', fontSize: 10, fontWeight: 600,
                padding: '4px 10px', borderRadius: 6,
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
              }}>
                {s.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

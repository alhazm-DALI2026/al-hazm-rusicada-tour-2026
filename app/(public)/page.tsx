'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { Parametres } from '@/types'

function dateFR(iso: string) {
  const months = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

const slides = [
  '/images/slide1.jpg',
  '/images/slide2.jpg',
  '/images/slide3.jpg',
]

export default function HomePage() {
  const router = useRouter()
  const [current, setCurrent]   = useState(0)
  const [showSticky, setShowSticky] = useState(false)
  const [params, setParams]     = useState<Parametres | null>(null)
  const inscriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetch('/api/parametres').then(r => r.json()).then((p: Parametres) => setParams(p)).catch(() => {})
  }, [])

  useEffect(() => {
    const el = inscriptionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dateDepart = new Date((params?.date_depart ?? '2026-06-23') + 'T12:00:00')
  const dateRetour = new Date((params?.date_retour  ?? '2026-06-28') + 'T12:00:00')
  const joursAvant = Math.ceil((dateDepart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const nombreNuits = Math.round((dateRetour.getTime() - dateDepart.getTime()) / (1000 * 60 * 60 * 24))
  const nombreJours = nombreNuits + 1
  const datePill = params?.date_depart && params?.date_retour
    ? `Du ${dateFR(params.date_depart)} au ${dateFR(params.date_retour)} 2026 · RUSICA PARK · Skikda`
    : 'Du 23 au 28 Juin 2026 · RUSICA PARK · Skikda'
  const whatsappHref = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '+213781608480').replace(/[^0-9]/g, '')}`

  const countdownText =
    joursAvant <= 0 ? null
    : joursAvant <= 30 ? `Plus que ${joursAvant} jours avant le camp !`
    : `Le camp commence dans ${joursAvant} jours`

  return (
    <div style={{ backgroundColor: '#0a0f2e', minHeight: '100vh', position: 'relative' }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(253,190,17,0); }
          50%       { box-shadow: 0 0 0 10px rgba(253,190,17,.5); }
        }
        @keyframes countPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.02); }
        }
        .c { max-width: 1080px; margin: 0 auto; width: 100%; }
        @media (min-width: 900px) {
          .inclus-grid  { grid-template-columns: repeat(4, 1fr) !important; }
          .gallery-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
          .insc-grid    { max-width: 700px; margin: 0 auto; }
        }
        .incl { cursor: pointer; transition: transform 0.3s ease; height: 200px; }
        @media (min-width: 900px) { .incl { height: 320px; } }
        .incl:hover { transform: scale(1.02); }
        .incl:hover .incl-ov { background: linear-gradient(180deg, transparent 40%, rgba(6,10,30,0.7) 100%) !important; }
        .gal { cursor: pointer; transition: transform 0.3s ease; height: 180px; }
        @media (min-width: 640px) { .gal { height: 220px; } }
        .gal:hover { transform: scale(1.02); }
        .gal:hover .gal-ov { background: linear-gradient(180deg, transparent 50%, rgba(6,10,30,0.7) 100%) !important; }
      `}</style>

      {/* ── 1. BACKGROUND GLOWS ────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: -120, left: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(0,48,144,0.45)', filter: 'blur(90px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(253,190,17,0.1)', filter: 'blur(70px)',
        }} />
      </div>

      {/* ── 2. HERO ────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: 560, overflow: 'hidden' }}>

        {slides.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url('${src}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'opacity 1.2s ease-in-out',
            opacity: current === i ? 1 : 0,
          }} />
        ))}

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,15,46,0.2) 0%, rgba(10,15,46,0.7) 60%, rgba(10,15,46,1) 100%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          padding: '48px 20px 36px',
        }}>
          <Image
            src="/images/logo-white.png"
            width={120}
            height={120}
            alt="Al Hazm Football Academy"
            style={{
              objectFit: 'contain', margin: '0 auto 18px', display: 'block',
              animation: 'fadeInUp .6s ease',
            }}
          />

          <h1 style={{
            color: '#ffffff', fontSize: 'clamp(32px, 4vw, 58px)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05,
            margin: '0 0 10px', animation: 'fadeInUp .7s ease',
          }}>
            <span style={{ color: '#fdbe11' }}>Rusicada</span> Tour 2026
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(12px, 1.2vw, 16px)',
            margin: '0 0 20px', animation: 'fadeInUp .8s ease',
          }}>
            L&apos;été du football, l&apos;été de ta vie
          </p>

          {countdownText && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#001a5e',
              border: '1.5px solid rgba(253,190,17,0.5)',
              borderRadius: 13, padding: '10px 20px',
              marginBottom: 13,
              animation: 'fadeInUp .9s ease, countPulse 3s infinite',
            }}>
              <i className="ti ti-clock" style={{ color: '#fdbe11', fontSize: 15 }} aria-hidden="true" />
              <span style={{ color: '#fdbe11', fontSize: 13, fontWeight: 900 }}>
                {countdownText}
              </span>
            </div>
          )}

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: '5px 14px',
            animation: 'fadeInUp 1s ease',
          }}>
            <i className="ti ti-map-pin" style={{ color: '#fdbe11', fontSize: 11 }} aria-hidden="true" />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              {datePill}
            </span>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 14, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 5, zIndex: 3,
        }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: current === i ? 18 : 6,
              height: 6, borderRadius: 3,
              background: current === i ? '#fdbe11' : 'rgba(255,255,255,0.25)',
              transition: 'all .3s',
            }} />
          ))}
        </div>
      </section>

      {/* ── 3. STATS BAR ───────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 5,
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {([
          { icon: 'ti-moon-stars', val: String(nombreNuits), label: 'Nuits',      circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
          { icon: 'ti-sun',        val: String(nombreJours), label: 'Jours',      circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)',  ic: '#fdbe11' },
          { icon: 'ti-ticket',     val: '50+',               label: 'Places',     circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
          { icon: 'ti-award',      val: '6',                 label: 'Encadrants', circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)',  ic: '#fdbe11' },
        ]).map((s, idx) => (
          <div key={s.label} style={{
            padding: '20px 8px', textAlign: 'center',
            borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.07)' : undefined,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 15,
              background: s.circBg, border: `1px solid ${s.circBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`ti ${s.icon}`} style={{ color: s.ic, fontSize: 24 }} aria-hidden="true" />
            </div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── 4. TOUT EST INCLUS ─────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, padding: '40px 20px' }}>
        <div className="c">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>
            Tout est inclus
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0, textAlign: 'center' }}>
            Dans chaque pack Al Hazm
          </p>
        </div>
        <div className="inclus-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {([
            { src: '/images/inclus-football.jpg',    icon: 'ti-ball-football',   label: 'Football & Formation', sub: 'Entraînements quotidiens' },
            { src: '/images/inclus-hebergement.jpg', icon: 'ti-bed',             label: 'Hébergement hôtel',    sub: 'Chambre confortable'      },
            { src: '/images/inclus-repas.jpg',       icon: 'ti-tools-kitchen-2', label: 'Pension complète',     sub: '3 repas par jour'         },
            { src: '/images/inclus-aquapark.jpg',    icon: 'ti-ripple',          label: 'Aqua Park Rusicada',   sub: 'Journée aquatique'        },
          ] as const).map(item => (
            <InclusPhotoCard key={item.label} {...item} />
          ))}
        </div>
        </div>
      </section>

      {/* ── 5. GALERIE ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, padding: '20px 20px 40px' }}>
        <div className="c">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 2px', textAlign: 'center' }}>
            Ils l&apos;ont vécu.
          </h2>
          <p style={{ color: '#fdbe11', fontSize: 14, fontWeight: 600, margin: 0, textAlign: 'center' }}>
            Votre enfant aussi.
          </p>
        </div>
        <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {([
            { src: '/images/slide1.jpg', caption: 'Formation & technique' },
            { src: '/images/slide2.jpg', caption: 'Amitié & complicité'   },
            { src: '/images/slide3.jpg', caption: 'Confort & repas'       },
          ] as const).map(photo => (
            <GalleryItem key={photo.src} src={photo.src} caption={photo.caption} />
          ))}
        </div>
        </div>
      </section>

      {/* ── 6. INSCRIPTION ─────────────────────────────────────── */}
      <section ref={inscriptionRef} style={{ position: 'relative', zIndex: 5, padding: '40px 20px' }}>
        <div className="c">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>
            Votre inscription
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0, textAlign: 'center' }}>
            Choisissez la formule qui vous{' '}
            <span style={{ color: '#fdbe11' }}>correspond</span>
          </p>
        </div>
        <div className="insc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <InscriptionCard
            bg="rgba(0,48,144,0.25)"
            border="rgba(0,80,204,0.35)"
            circBg="rgba(0,48,144,0.5)"
            circBorder="rgba(0,80,204,0.35)"
            icon="ti-ticket"
            iconColor="#7eb8ff"
            title="Offres standard"
            desc="Tarif fixe enfant ou adulte."
            btnBg="#003090"
            btnColor="#fff"
            btnLabel="→ Voir les offres"
            onClick={() => router.push('/formules')}
          />

          <InscriptionCard
            bg="rgba(253,190,17,0.08)"
            border="rgba(253,190,17,0.3)"
            circBg="rgba(253,190,17,0.15)"
            circBorder="rgba(253,190,17,0.3)"
            icon="ti-users"
            iconColor="#fdbe11"
            title="Pack Famille"
            desc="Sur mesure selon votre famille."
            btnBg="#fdbe11"
            btnColor="#003090"
            btnLabel="→ Configurer"
            onClick={() => router.push('/famille')}
          />
        </div>
        </div>
      </section>

      {/* ── 7. SOCIAL BAR ──────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 5,
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 16px 90px',
      }}>
        <div className="c">
        <div style={{
          textAlign: 'center', marginBottom: 16,
          paddingBottom: 14,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alhazm-rusicada.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ti ti-world" style={{ color: '#fdbe11', fontSize: 16 }} aria-hidden="true" />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              {(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alhazm-rusicada.vercel.app').replace('https://', '')}
            </span>
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
          <SocialIcon
            icon="ti-brand-whatsapp"
            label="WhatsApp"
            href={whatsappHref}
            hBorder="rgba(37,211,102,0.4)"
            hBg="rgba(37,211,102,0.1)"
            hIcon="#25d366"
          />
          <SocialIcon
            icon="ti-brand-instagram"
            label="IG"
            href="https://www.instagram.com/alhazm.academy"
            hBorder="rgba(225,48,108,0.4)"
            hBg="rgba(225,48,108,0.1)"
            hIcon="#e1306c"
          />
          <SocialIcon
            icon="ti-brand-facebook"
            label="FB"
            href="https://www.facebook.com/alhazm.academy"
            hBorder="rgba(24,119,242,0.4)"
            hBg="rgba(24,119,242,0.1)"
            hIcon="#1877f2"
          />
          <SocialIcon
            icon="ti-brand-tiktok"
            label="TK"
            href="https://www.tiktok.com/@alhazm.academy"
            hBorder="rgba(255,255,255,0.3)"
            hBg="rgba(255,255,255,0.08)"
            hIcon="#fff"
          />
        </div>
        </div>
      </section>

      {/* ── 8. STICKY BAR ──────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(6,10,30,0.98)',
        backdropFilter: 'blur(24px)',
        borderTop: '1.5px solid rgba(253,190,17,0.4)',
        padding: '12px 16px', zIndex: 200,
        transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)',
        transform: showSticky ? 'translateY(0)' : 'translateY(100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/formules')}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(253,190,17,0.12)',
              border: '1px solid #fdbe11',
              borderRadius: 20, padding: '8px 12px',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: '#22c55e',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#fdbe11', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' }}>
              Inscriptions ouvertes{joursAvant > 0 ? ` · Plus que ${joursAvant} jours !` : ''}
            </span>
          </button>
          <StickyButton onClick={() => router.push('/formules')} />
        </div>
      </div>

      {/* Bouton admin discret */}
      <button
        type="button"
        onClick={() => router.push('/login')}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: 0.3,
          transition: 'opacity .2s',
          zIndex: 150,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.3' }}
        aria-label="Administration"
      >
        <i className="ti ti-lock" style={{ color: '#fff', fontSize: '16px' }} aria-hidden="true" />
      </button>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InclusPhotoCard({ src, icon, label, sub }: {
  src: string; icon: string; label: string; sub: string
}) {
  return (
    <div
      className="incl"
      style={{ borderRadius: 18, overflow: 'hidden', position: 'relative' }}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
      <div className="incl-ov" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 40%, rgba(6,10,30,0.85) 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: 18, color: '#fff' }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>{label}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{sub}</div>
        </div>
      </div>
    </div>
  )
}

function GalleryItem({ src, caption }: { src: string; caption: string }) {
  return (
    <div
      className="gal"
      style={{ borderRadius: 14, overflow: 'hidden', position: 'relative' }}
    >
      <Image
        src={src}
        alt={caption}
        fill
        sizes="33vw"
        style={{ objectFit: 'cover' }}
      />
      <div className="gal-ov" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(180deg, transparent 50%, rgba(6,10,30,0.9) 100%)',
        color: '#fff', fontSize: 14, fontWeight: 700,
        padding: '20px 10px 16px', textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
      }}>
        {caption}
      </div>
    </div>
  )
}

function InscriptionCard({
  bg, border, circBg, circBorder, icon, iconColor,
  title, desc, btnBg, btnColor, btnLabel, onClick,
}: {
  bg: string; border: string; circBg: string; circBorder: string
  icon: string; iconColor: string; title: string; desc: string
  btnBg: string; btnColor: string; btnLabel: string; onClick: () => void
}) {
  return (
    <div
      style={{
        background: bg, border: `1.5px solid ${border}`,
        borderRadius: 18, padding: 20, transition: 'all .25s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: circBg, border: `1px solid ${circBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <i className={`ti ${icon}`} style={{ color: iconColor, fontSize: 18 }} aria-hidden="true" />
      </div>
      <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 14 }}>{desc}</div>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%', background: btnBg, color: btnColor,
          border: 'none', borderRadius: 10, padding: 9,
          fontSize: 11, fontWeight: 800, cursor: 'pointer',
        }}
      >
        {btnLabel}
      </button>
    </div>
  )
}

function SocialIcon({ icon, label, href, hBorder, hBg, hIcon }: {
  icon: string; label: string; href: string
  hBorder: string; hBg: string; hIcon: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: 'none', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, opacity: 0.6, transition: 'all .2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        const box = el.querySelector('.sbox') as HTMLDivElement
        const ic  = el.querySelector('.sbox i') as HTMLElement
        el.style.opacity = '1'
        el.style.transform = 'translateY(-4px)'
        box.style.borderColor = hBorder
        box.style.background  = hBg
        ic.style.color        = hIcon
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        const box = el.querySelector('.sbox') as HTMLDivElement
        const ic  = el.querySelector('.sbox i') as HTMLElement
        el.style.opacity = '0.6'
        el.style.transform = 'translateY(0)'
        box.style.borderColor = 'rgba(255,255,255,0.08)'
        box.style.background  = 'rgba(255,255,255,0.06)'
        ic.style.color        = 'rgba(255,255,255,0.7)'
      }}
    >
      <div className="sbox" style={{
        width: 44, height: 44, borderRadius: 14,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)', transition: 'color .2s' }} aria-hidden="true" />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</span>
    </a>
  )
}

function StickyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0, background: '#fdbe11', color: '#003090',
        border: 'none', borderRadius: 12, padding: '11px 18px',
        fontSize: 12, fontWeight: 900, cursor: 'pointer',
        transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = '#ffe04d'
        el.style.transform = 'scale(1.03)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = '#fdbe11'
        el.style.transform = 'scale(1)'
      }}
    >
      <i className="ti ti-ticket" style={{ fontSize: 14 }} aria-hidden="true" />
      S&apos;inscrire
    </button>
  )
}

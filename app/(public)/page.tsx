'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const jours = Math.ceil(
  (new Date('2026-06-23').getTime() - new Date().getTime())
  / (1000 * 60 * 60 * 24)
)

const slides = [
  '/images/slide1.jpg',
  '/images/slide2.jpg',
  '/images/slide3.jpg',
]

export default function HomePage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [showSticky, setShowSticky] = useState(false)
  const inscriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 3000)
    return () => clearInterval(timer)
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

  const countdownText =
    jours <= 0 ? null
    : jours <= 30 ? `Plus que ${jours} jours avant le camp !`
    : `Le camp commence dans ${jours} jours`

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
      <section style={{ position: 'relative', minHeight: 480, overflow: 'hidden' }}>

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
            width={90}
            height={90}
            alt="Al Hazm Football Academy"
            style={{
              objectFit: 'contain', margin: '0 auto 14px', display: 'block',
              animation: 'fadeInUp .6s ease',
            }}
          />

          <h1 style={{
            color: '#ffffff', fontSize: 32, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05,
            margin: '0 0 8px', animation: 'fadeInUp .7s ease',
          }}>
            <span style={{ color: '#fdbe11' }}>Rusicada</span> Tour 2026
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 12,
            margin: '0 0 16px', animation: 'fadeInUp .8s ease',
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
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>
              Du 23 au 28 Juin 2026 · RUSICA PARK · Skikda
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
          { icon: 'ti-moon-stars', val: '5',   label: 'NUITS',      circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
          { icon: 'ti-sun',        val: '6',   label: 'JOURS',      circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)',  ic: '#fdbe11' },
          { icon: 'ti-ticket',     val: '50+', label: 'PLACES',     circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
          { icon: 'ti-whistle',    val: '6',   label: 'ENCADRANTS', circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)',  ic: '#fdbe11' },
        ] as const).map((s, idx) => (
          <div key={s.label} style={{
            padding: '16px 8px', textAlign: 'center',
            borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.07)' : undefined,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: s.circBg, border: `1px solid ${s.circBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`ti ${s.icon}`} style={{ color: s.ic, fontSize: 20 }} aria-hidden="true" />
            </div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{s.val}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── 4. TOUT EST INCLUS ─────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>
            Tout est inclus
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, textAlign: 'center' }}>
            Dans chaque pack Al Hazm
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { icon: 'ti-ball-football',   label: 'Football & Formation', sub: 'Entraînements quotidiens', circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
            { icon: 'ti-bed',             label: 'Hébergement hôtel',    sub: 'Chambre confortable',      circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)', ic: '#fdbe11' },
            { icon: 'ti-tools-kitchen-2', label: 'Pension complète',     sub: 'Repas inclus',             circBg: 'rgba(0,48,144,0.4)',    circBorder: 'rgba(0,80,204,0.25)',    ic: '#7eb8ff' },
            { icon: 'ti-ripple',          label: 'Aqua Park Rusicada',   sub: 'Journée aquatique',        circBg: 'rgba(253,190,17,0.15)', circBorder: 'rgba(253,190,17,0.25)', ic: '#fdbe11' },
          ] as const).map(item => (
            <InclusCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {/* ── 5. GALERIE ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 2px', textAlign: 'center' }}>
            Ils l&apos;ont vécu.
          </h2>
          <p style={{ color: '#fdbe11', fontSize: 13, fontWeight: 600, margin: 0, textAlign: 'center' }}>
            Votre enfant aussi.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {([
            { src: '/images/slide1.jpg', caption: 'Formation & technique' },
            { src: '/images/slide2.jpg', caption: 'Amitié & complicité'   },
            { src: '/images/slide3.jpg', caption: 'Confort & repas'       },
          ] as const).map(photo => (
            <GalleryItem key={photo.src} src={photo.src} caption={photo.caption} />
          ))}
        </div>
      </section>

      {/* ── 6. INSCRIPTION ─────────────────────────────────────── */}
      <section ref={inscriptionRef} style={{ position: 'relative', zIndex: 5, padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}>
            Votre inscription
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, textAlign: 'center' }}>
            Choisissez la formule qui vous{' '}
            <span style={{ color: '#fdbe11' }}>correspond</span>
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

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
      </section>

      {/* ── 7. SOCIAL BAR ──────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 5,
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 16px 90px',
      }}>
        <div style={{
          textAlign: 'center', marginBottom: 16,
          paddingBottom: 14,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <a
            href="https://alhazmfootballacademy.dz"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ti ti-world" style={{ color: '#fdbe11', fontSize: 14 }} aria-hidden="true" />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              www.alhazmfootballacademy.dz
            </span>
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
          {([
            { icon: 'ti-brand-whatsapp',  label: 'WA', href: 'https://wa.me/213781608480', hBorder: 'rgba(37,211,102,0.4)',  hBg: 'rgba(37,211,102,0.1)',  hIcon: '#25d366' },
            { icon: 'ti-brand-instagram', label: 'IG', href: '#',                           hBorder: 'rgba(225,48,108,0.4)',  hBg: 'rgba(225,48,108,0.1)',  hIcon: '#e1306c' },
            { icon: 'ti-brand-facebook',  label: 'FB', href: '#',                           hBorder: 'rgba(24,119,242,0.4)', hBg: 'rgba(24,119,242,0.1)', hIcon: '#1877f2' },
            { icon: 'ti-brand-tiktok',    label: 'TK', href: '#',                           hBorder: 'rgba(255,255,255,0.3)', hBg: 'rgba(255,255,255,0.08)', hIcon: '#fff'  },
          ] as const).map(s => (
            <SocialIcon key={s.label} {...s} />
          ))}
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
          <div style={{ flex: 1, display: 'flex', gap: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(253,190,17,0.12)',
              border: '1px solid rgba(253,190,17,0.35)',
              borderRadius: 20, padding: '4px 10px', flexShrink: 0,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#fdbe11',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ color: '#fdbe11', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>
                Inscriptions ouvertes
              </span>
            </div>
            {jours > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#001a5e',
                border: '1px solid rgba(253,190,17,0.4)',
                borderRadius: 10, padding: '6px 12px', flex: 1,
              }}>
                <i className="ti ti-clock" style={{ color: '#fdbe11', fontSize: 13 }} aria-hidden="true" />
                <span style={{ color: '#fdbe11', fontSize: 11, fontWeight: 800 }}>
                  Plus que {jours} jours !
                </span>
              </div>
            )}
          </div>
          <StickyButton onClick={() => router.push('/formules')} />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InclusCard({ icon, label, sub, circBg, circBorder, ic }: {
  icon: string; label: string; sub: string
  circBg: string; circBorder: string; ic: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 16,
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all .25s', cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(253,190,17,0.3)'
        el.style.background = 'rgba(253,190,17,0.05)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.07)'
        el.style.background = 'rgba(255,255,255,0.04)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: circBg, border: `1px solid ${circBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`ti ${icon}`} style={{ color: ic, fontSize: 20 }} aria-hidden="true" />
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{sub}</div>
      </div>
    </div>
  )
}

function GalleryItem({ src, caption }: { src: string; caption: string }) {
  return (
    <div
      style={{
        height: 120, borderRadius: 14, overflow: 'hidden',
        position: 'relative', transition: 'transform .25s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
    >
      <Image
        src={src}
        alt={caption}
        fill
        sizes="33vw"
        style={{ objectFit: 'cover', filter: 'brightness(.8)' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
        color: '#fff', fontSize: 8, fontWeight: 700,
        padding: '16px 6px 6px', textAlign: 'center',
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
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginBottom: 14 }}>{desc}</div>
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
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</span>
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

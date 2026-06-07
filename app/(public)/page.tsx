'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Offre, Parametres, TypePublic } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_PUBLIC_CFG: Record<TypePublic, { label: string; badge: string }> = {
  enfant:  { label: 'Enfant',  badge: 'bg-green-100  text-green-700  border-green-200'  },
  adulte:  { label: 'Adulte',  badge: 'bg-blue-100   text-blue-700   border-blue-200'   },
  famille: { label: 'Famille', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
}

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function getJours(): number {
  const dateDepart = new Date('2026-06-23')
  const now        = new Date()
  const diffMs     = dateDepart.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// ── Countdown badge ───────────────────────────────────────────────────────────

function CountdownBadge({ jours }: { jours: number }) {
  if (jours < 0) return null

  if (jours === 0) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#22c55e',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 800,
        padding: '10px 22px',
        borderRadius: 14,
        marginBottom: 14,
      }}>
        <i className="ti ti-clock" style={{ fontSize: 18, color: '#ffffff' }} aria-hidden="true" />
        C'est aujourd'hui ! Le camp commence !
      </div>
    )
  }

  const label = jours > 30
    ? `Le camp commence dans ${jours} jours`
    : `Plus que ${jours} jour${jours > 1 ? 's' : ''} avant le camp !`

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#fdbe11',
      color: '#003090',
      fontSize: 14,
      fontWeight: 800,
      padding: '10px 22px',
      borderRadius: 14,
      marginBottom: 14,
    }}>
      <i className="ti ti-clock" style={{ fontSize: 18, color: '#003090' }} aria-hidden="true" />
      {jours <= 30
        ? <span className="animate-pulse">{label}</span>
        : label
      }
    </div>
  )
}

// ── OfferCard ─────────────────────────────────────────────────────────────────

function OfferCard({ offre }: { offre: Offre }) {
  const cfg     = TYPE_PUBLIC_CFG[offre.type_public]
  const pct     = offre.places_total > 0 ? Math.round((offre.places_restantes / offre.places_total) * 100) : 0
  const complet = offre.places_restantes === 0

  return (
    <div
      className={`bg-white rounded-2xl shadow-md overflow-hidden flex flex-col ${complet ? 'opacity-60' : ''}`}
      style={{ width: '100%', maxWidth: 320 }}
    >
      <div className="h-1.5 bg-[#003090]" />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge} mb-2`}>
              {cfg.label}
            </span>
            <h3 className="font-bold text-[#1c1c1e] text-base">{offre.nom}</h3>
            {offre.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offre.description}</p>}
          </div>
          <span className="shrink-0 text-xs bg-[#f0f2f8] text-[#003090] px-2 py-1 rounded-lg font-medium">{offre.type_chambre}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <i className="ti ti-moon text-[#003090]" aria-hidden="true" />
            {offre.nombre_nuits}N / {offre.nombre_jours}J
          </span>
          <span className="flex items-center gap-1">
            <i className={`ti ti-bus ${offre.transport_inclus ? 'text-green-600' : offre.transport_optionnel ? 'text-[#003090]' : 'text-gray-400'}`} aria-hidden="true" />
            {offre.transport_inclus ? 'Transport inclus' : offre.transport_optionnel ? 'Optionnel' : 'Sans transport'}
          </span>
          <span className="flex items-center gap-1">
            <i className="ti ti-soup text-[#003090]" aria-hidden="true" />
            {offre.repas_type === 'complet' ? 'Pension complète' : offre.repas_type === 'demi' ? 'Demi-pension' : 'Sans repas'}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{complet ? 'Complet' : `${offre.places_restantes} place${offre.places_restantes > 1 ? 's' : ''}`}</span>
            <span>{offre.places_total} total</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct < 20 ? 'bg-red-400' : pct < 60 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Prix</p>
            <p className="text-xl font-bold text-[#003090] font-mono">{fmt(offre.prix_vente)}</p>
          </div>
          {complet ? (
            <span className="px-4 py-2 bg-gray-200 text-gray-500 rounded-xl text-sm cursor-not-allowed">Complet</span>
          ) : (
            <Link
              href={`/offre/${offre.id}`}
              className="px-4 py-2 bg-[#003090] text-white rounded-xl text-sm font-semibold hover:bg-[#002070] transition-colors"
            >
              Réserver
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [offres, setOffres]         = useState<Offre[]>([])
  const [parametres, setParametres] = useState<Parametres | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [loginErr, setLoginErr]     = useState('')
  const [loginBusy, setLoginBusy]   = useState(false)
  const usernameRef                 = useRef<HTMLInputElement>(null)
  const router                      = useRouter()

  const jours = getJours()

  useEffect(() => {
    Promise.all([
      fetch('/api/offres').then(r => r.json()),
      fetch('/api/parametres').then(r => r.ok ? r.json() : null),
    ]).then(([offresData, paramsData]: [Offre[], Parametres | null]) => {
      setOffres((offresData ?? []).filter((o: Offre) => o.actif))
      setParametres(paramsData)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (showModal) {
      setLoginErr('')
      setTimeout(() => usernameRef.current?.focus(), 50)
    } else {
      setUsername('')
      setPassword('')
    }
  }, [showModal])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginBusy(true)
    setLoginErr('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setLoginErr(d.error ?? 'Identifiants incorrects')
      }
    } catch {
      setLoginErr('Erreur réseau')
    } finally {
      setLoginBusy(false)
    }
  }

  const offresAdulte  = offres.filter(o => o.type_public === 'adulte')
  const offresEnfant  = offres.filter(o => o.type_public === 'enfant')
  const offresFamille = offres.filter(o => o.type_public === 'famille')

  const rawTel = parametres?.whatsapp_numero
  const waHref = parametres?.lien_groupe_whatsapp
    || (rawTel ? `https://wa.me/${rawTel.replace(/\D/g, '')}` : '')
    || process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP
    || ''

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: 420, overflow: 'hidden' }}>
        <Image
          src="/images/aquapark.jpg"
          alt="Rusicada Park"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#003090', opacity: 0.65 }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: 'clamp(40px, 7vw, 80px) clamp(20px, 5vw, 40px)',
          maxWidth: 680,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>

          {/* Badge animé */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 18px',
            borderRadius: 999,
            border: '1px solid rgba(253,190,17,0.45)',
            backgroundColor: 'rgba(253,190,17,0.18)',
            color: '#fdbe11',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
              <span className="animate-ping" style={{
                position: 'absolute',
                borderRadius: '50%',
                width: 10,
                height: 10,
                backgroundColor: '#fdbe11',
                opacity: 0.75,
              }} />
              <span style={{ position: 'relative', borderRadius: '50%', width: 8, height: 8, backgroundColor: '#fdbe11', display: 'inline-block' }} />
            </span>
            Inscriptions ouvertes
          </div>

          {/* Logo officiel blanc */}
          <Image
            src="/images/logo-white.png"
            alt="Al Hazm Football Academy"
            width={110}
            height={110}
            style={{ objectFit: 'contain', margin: '0 auto' }}
          />

          {/* Sous-titre académie */}
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, fontWeight: 500 }}>
            Al Hazm Football Academy · أكاديمية الحزم
          </p>

          {/* Titre événement */}
          <h1 style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 'clamp(30px, 5.5vw, 48px)',
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: '-0.5px',
          }}>
            <span style={{ color: '#fdbe11' }}>Rusicada</span> Tour 2026
          </h1>

          {/* Slogan */}
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: 0, fontStyle: 'italic' }}>
            L'été du football, l'été de ta vie
          </p>

          {/* Compte à rebours */}
          <CountdownBadge jours={jours} />

          {/* Date */}
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.25)',
            backgroundColor: 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}>
            23 — 28 Juin 2026 · Rusicada Park · Skikda
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' }}>
            <Link
              href="#offres"
              style={{
                flex: '1 1 150px',
                maxWidth: 210,
                padding: '13px 28px',
                backgroundColor: '#fdbe11',
                color: '#003090',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 15,
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Voir les offres →
            </Link>
            <Link
              href="/famille"
              style={{
                flex: '1 1 150px',
                maxWidth: 210,
                padding: '13px 28px',
                backgroundColor: '#fdbe11',
                color: '#003090',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 15,
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Pack Famille →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. STATS BAR
      ══════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#ffffff', borderBottom: '3px solid #fdbe11' }}>
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 8,
          textAlign: 'center',
        }}>
          {[
            { icon: 'ti-moon-stars', val: '5',   label: 'Nuits'       },
            { icon: 'ti-sun',        val: '6',   label: 'Jours'       },
            { icon: 'ti-users',      val: '50+', label: 'Places'      },
            { icon: 'ti-whistle',    val: '6',   label: 'Encadrants'  },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 4px' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 24, color: '#003090', display: 'block', marginBottom: 6 }} aria-hidden="true" />
              <div style={{ color: '#003090', fontWeight: 800, fontSize: 22, fontFamily: 'monospace', lineHeight: 1.1 }}>{s.val}</div>
              <div style={{ color: '#666666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. GALERIE PHOTOS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#003090', padding: 'clamp(40px, 6vw, 64px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Image
              src="/images/icon-white.png"
              alt=""
              width={56}
              height={56}
              style={{ objectFit: 'contain', margin: '0 auto 14px', display: 'block' }}
            />
            <h2 style={{ color: '#ffffff', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '0 0 8px' }}>
              Ils l'ont vécu.
            </h2>
            <p style={{ color: '#fdbe11', fontSize: 16, fontWeight: 600, margin: 0 }}>
              Votre enfant aussi.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { src: '/images/enfants-marche.jpg',  caption: 'Amitié & complicité'   },
              { src: '/images/football-action.jpg', caption: 'Formation & technique' },
              { src: '/images/repas-hotel.jpg',     caption: 'Confort & hébergement' },
            ].map(photo => (
              <div key={photo.src} style={{ position: 'relative', height: 280, borderRadius: 14, overflow: 'hidden', width: '100%' }}>
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {photo.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. INCLUS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#ffffff', padding: 'clamp(40px, 6vw, 60px) 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#1c1c1e', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, margin: '0 0 32px' }}>
            Tout est inclus dans votre pack
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {[
              { icon: 'ti-ball-football',   label: 'Football & Formation'   },
              { icon: 'ti-building',        label: 'Hébergement hôtel'      },
              { icon: 'ti-tools-kitchen-2', label: 'Repas pension complète' },
              { icon: 'ti-pool',            label: 'Aqua Park Rusicada'     },
            ].map(item => (
              <div key={item.label} style={{
                backgroundColor: '#f5f5f7',
                borderRadius: 14,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#003090',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  flexShrink: 0,
                }}>
                  <i className={`ti ${item.icon}`} style={{ color: '#ffffff', fontSize: 24 }} aria-hidden="true" />
                </div>
                <span style={{ color: '#3c3c43', fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. CHOIX INSCRIPTION
      ══════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#f5f5f7', padding: 'clamp(40px, 6vw, 60px) 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ color: '#1c1c1e', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
            Comment vous inscrire ?
          </h2>
          <p style={{ color: '#666666', textAlign: 'center', fontSize: 15, margin: '0 0 32px' }}>
            Choisissez la formule qui correspond à votre situation
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

            {/* Card Offres Standard */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderTop: '5px solid #003090',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  backgroundColor: '#003090',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="ti ti-shirt-sport" style={{ color: '#fdbe11', fontSize: 22 }} aria-hidden="true" />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                    backgroundColor: '#e8f4fd', color: '#003090', fontSize: 11, fontWeight: 700, marginBottom: 4,
                  }}>
                    Le plus choisi
                  </span>
                  <h3 style={{ color: '#1c1c1e', fontWeight: 800, fontSize: 18, margin: 0, lineHeight: 1.2 }}>Offres Standard</h3>
                </div>
              </div>
              <p style={{ color: '#666666', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Tarif fixe selon votre profil. Simple, rapide, sans surprise.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Pack Enfant Triple — 78 000 DA', 'Pack Adulte Double — 88 000 DA', 'Transport optionnel'].map(item => (
                  <li key={item} style={{ color: '#3c3c43', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#003090', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="#offres" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                backgroundColor: '#003090', color: '#ffffff',
                borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', marginTop: 'auto',
              }}>
                Voir les offres
              </Link>
            </div>

            {/* Card Pack Famille */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderTop: '5px solid #fdbe11',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  backgroundColor: '#fdbe11',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="ti ti-users" style={{ color: '#003090', fontSize: 22 }} aria-hidden="true" />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                    backgroundColor: '#fff8e6', color: '#7a5c00', fontSize: 11, fontWeight: 700, marginBottom: 4,
                  }}>
                    Sur mesure
                  </span>
                  <h3 style={{ color: '#1c1c1e', fontWeight: 800, fontSize: 18, margin: 0, lineHeight: 1.2 }}>Pack Famille</h3>
                </div>
              </div>
              <p style={{ color: '#666666', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Calculez votre pack sur mesure. Adultes, enfants, bébés — prix en temps réel.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Chambres attribuées automatiquement', 'Transport et repas au choix', 'Prix calculé instantanément'].map(item => (
                  <li key={item} style={{ color: '#3c3c43', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fdbe11', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/famille" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                backgroundColor: '#fdbe11', color: '#003090',
                borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', marginTop: 'auto',
              }}>
                Configurer mon pack
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. OFFRES (dynamiques)
      ══════════════════════════════════════════════════════════ */}
      <section id="offres" style={{ backgroundColor: '#f0f2f8', padding: 'clamp(40px, 6vw, 64px) 24px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ color: '#1c1c1e', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
            Choisissez votre formule
          </h2>
          <p style={{ color: '#666666', textAlign: 'center', fontSize: 15, margin: '0 0 32px' }}>
            Réservez votre place dès maintenant
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#003090' }}>
              <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36 }} aria-hidden="true" />
            </div>
          ) : offres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999999' }}>
              <i className="ti ti-ticket-off" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <p style={{ fontWeight: 600 }}>Aucune formule disponible pour le moment.</p>
              <p style={{ fontSize: 13 }}>Revenez bientôt !</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 16,
              maxWidth: 900,
              margin: '0 auto',
            }}>
              {offresEnfant.map(o  => <OfferCard key={o.id} offre={o} />)}
              {offresAdulte.map(o  => <OfferCard key={o.id} offre={o} />)}
              {offresFamille.map(o => <OfferCard key={o.id} offre={o} />)}
            </div>
          )}
        </div>
      </section>

      {/* Barre famille sticky */}
      {!loading && offresAdulte.length > 0 && offresEnfant.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 40,
          backgroundColor: '#003090',
          borderTop: '3px solid #fdbe11',
          padding: '14px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 15, margin: 0 }}>Pack Famille personnalisé</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>
              Composez votre pack · prix en temps réel
            </p>
          </div>
          <Link
            href="/famille"
            style={{
              padding: '11px 24px',
              backgroundColor: '#fdbe11',
              color: '#003090',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Créer mon pack →
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#003090',
        borderTop: '4px solid #fdbe11',
        padding: 'clamp(40px, 6vw, 56px) 24px',
        textAlign: 'center',
      }}>
        <Image
          src="/images/logo-white.png"
          alt="Al Hazm Football Academy"
          width={100}
          height={100}
          style={{ objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
        />
        <p style={{ color: '#fdbe11', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>
          Rusicada Tour 2026
        </p>
        <p style={{ color: '#ffffff', fontSize: 15, margin: '0 0 4px' }}>
          Al Hazm Football Academy
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 24px' }}>
          23 — 28 Juin 2026 · Rusicada Park · Skikda
        </p>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              backgroundColor: '#25d366',
              color: '#ffffff',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              marginBottom: 24,
            }}
          >
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 18 }} aria-hidden="true" />
            Rejoindre le groupe WhatsApp
          </a>
        )}

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          © 2026 Al Hazm Football Academy
        </p>
      </footer>

      {/* ══ BOUTON ADMIN DISCRET ══════════════════════════════════ */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: 72,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.35)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3,
          cursor: 'pointer',
          zIndex: 50,
          transition: 'opacity 0.2s',
          padding: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.3' }}
        aria-label="Administration"
      >
        <i className="ti ti-lock" style={{ color: '#ffffff', fontSize: 16 }} aria-hidden="true" />
      </button>

      {/* ══ MODAL CONNEXION ═══════════════════════════════════════ */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: 360,
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Image
                src="/images/logo-color.png"
                alt="Al Hazm"
                width={48}
                height={48}
                style={{ objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontWeight: 700, color: '#003090', fontSize: 16, margin: 0 }}>Administration</p>
                <p style={{ color: '#999999', fontSize: 12, margin: 0 }}>Al Hazm Football Academy</p>
              </div>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                ref={usernameRef}
                type="text"
                placeholder="Identifiant"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              {loginErr && (
                <p style={{
                  color: '#ef4444', fontSize: 13, backgroundColor: '#fef2f2',
                  padding: '8px 12px', borderRadius: 8, margin: 0,
                }}>
                  {loginErr}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: '1px solid #e0e0e0', fontSize: 14,
                    color: '#666666', backgroundColor: '#ffffff', cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loginBusy}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    fontSize: 14, fontWeight: 700, backgroundColor: '#003090', color: '#ffffff',
                    cursor: loginBusy ? 'not-allowed' : 'pointer', opacity: loginBusy ? 0.6 : 1,
                  }}
                >
                  {loginBusy ? '…' : 'Connexion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

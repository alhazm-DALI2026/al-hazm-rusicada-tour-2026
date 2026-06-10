'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Offre } from '@/types'

function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }

const ACCENT: Record<string, string> = {
  enfant:  'linear-gradient(90deg,#003090,#0050cc)',
  adulte:  'linear-gradient(90deg,#fdbe11,#ffd94d)',
  famille: 'linear-gradient(90deg,#22c55e,#4ade80)',
}
const TAG: Record<string, React.CSSProperties> = {
  enfant:  { background: 'rgba(0,80,204,0.25)',   color: '#7eb8ff' },
  adulte:  { background: 'rgba(253,190,17,0.18)', color: '#fdbe11' },
  famille: { background: 'rgba(34,197,94,0.18)',  color: '#4ade80' },
}

const RESPONSIVE_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Mobile */
  .offres-grid {
    padding: 0 16px 110px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    animation: fadeInUp 0.4s ease;
  }

  .offer-card-inner { padding: 16px; }
  .card-name        { color: #fff; font-size: 15px; font-weight: 800; margin-bottom: 4px; }
  .card-price       { color: #fdbe11; font-size: 18px; font-weight: 800; }

  .tabs-wrapper {
    position: relative; z-index: 5;
    display: grid; grid-template-columns: 1fr 1fr;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 4px; gap: 4px;
    margin: 14px 16px;
  }

  /* Tablette */
  @media (min-width: 640px) {
    .offres-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .offres-grid {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px 110px;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .offer-card-inner { padding: 24px; }
    .card-name        { font-size: 17px; }
    .card-price       { font-size: 22px; }
    .tabs-wrapper     { max-width: 640px; margin: 16px auto; }
    .page-header-inner { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
  }

  /* Grand écran */
  @media (min-width: 1440px) {
    .offres-grid { max-width: 1280px; padding: 0 48px 110px; gap: 28px; }
    .page-header-inner { max-width: 1280px; }
  }
`

function OfferCard({ offre, isFirst }: { offre: Offre; isFirst: boolean }) {
  const router = useRouter()
  const complet = offre.places_restantes === 0
  const pct     = offre.places_total > 0 ? (offre.places_restantes / offre.places_total) * 100 : 0

  return (
    <div
      style={{
        background: isFirst ? 'rgba(253,190,17,0.06)' : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: isFirst ? '1.5px solid rgba(253,190,17,0.5)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, overflow: 'hidden',
        opacity: complet ? 0.6 : 1,
        transition: 'transform .25s, box-shadow .25s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{ height: 4, background: ACCENT[offre.type_public] ?? ACCENT.enfant }} />
      <div className="offer-card-inner">

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ ...TAG[offre.type_public], fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
            {offre.type_public.charAt(0).toUpperCase() + offre.type_public.slice(1)}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
            {offre.type_chambre}
          </span>
        </div>

        <div className="card-name">{offre.nom}</div>
        {offre.description && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>{offre.description}</div>
        )}

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {offre.type_public === 'famille' && offre.options_custom && (() => {
            const oc = offre.options_custom as { nb_adultes?: number; nb_enfants?: number }
            const ad = oc.nb_adultes ?? 2
            const en = oc.nb_enfants ?? 0
            return (
              <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 9, borderRadius: 5, padding: '3px 7px' }}>
                {`${ad} adulte${ad > 1 ? 's' : ''}${en > 0 ? ` + ${en} enfant${en > 1 ? 's' : ''}` : ''}`}
              </span>
            )
          })()}
          {[
            `${offre.nombre_nuits}N / ${offre.nombre_nuits + 1}J`,
            offre.repas_type === 'complet' ? 'Pension complète' : offre.repas_type === 'demi' ? 'Demi-pension' : 'Sans repas',
            offre.transport_inclus ? 'Transport inclus' : offre.transport_optionnel ? 'Transport optionnel' : 'Sans transport',
          ].map(p => (
            <span key={p} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, borderRadius: 5, padding: '3px 7px' }}>
              {p}
            </span>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 5 }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#22c55e,#4ade80)', width: `${pct}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            {complet ? 'Complet' : `${offre.places_restantes} places restantes`}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-price">{fmt(offre.prix_vente)}</div>
          {complet ? (
            <span style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '9px 16px', fontSize: 11, fontWeight: 700 }}>Complet</span>
          ) : (
            <button type="button" onClick={() => router.push(`/offre/${offre.id}`)}
              style={{ background: offre.type_public === 'famille' ? '#22c55e' : isFirst ? '#fdbe11' : '#003090', color: offre.type_public === 'famille' ? '#fff' : isFirst ? '#003090' : '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              Réserver →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FormulesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'std' | 'fam'>('std')
  const [offres, setOffres]       = useState<Offre[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/offres')
      .then(r => r.json())
      .then((data: Offre[]) => setOffres((data ?? []).filter(o => o.actif)))
      .finally(() => setLoading(false))
  }, [])

  const allOffres = [
    ...offres.filter(o => o.type_public === 'enfant'),
    ...offres.filter(o => o.type_public === 'adulte'),
    ...offres.filter(o => o.type_public === 'famille'),
  ]

  return (
    <div style={{ backgroundColor: '#0a0f2e', minHeight: '100vh' }}>
      <style>{RESPONSIVE_CSS}</style>

      {/* Glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(0,48,144,0.4)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(253,190,17,0.07)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => router.push('/')}
          style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} aria-hidden="true" />
        </button>
        <Image src="/images/icon-white.png" width={36} height={36} alt="Al Hazm" style={{ objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Nos formules</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Du 23 au 28 Juin 2026 · RUSICA PARK</div>
        </div>
      </header>

      {/* Onglets */}
      <div className="tabs-wrapper">
        <button type="button" onClick={() => setActiveTab('std')}
          style={{ background: activeTab === 'std' ? '#003090' : 'transparent', color: activeTab === 'std' ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: activeTab === 'std' ? '0 4px 16px rgba(0,48,144,0.5)' : 'none', borderRadius: 10, padding: 11, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
          <i className="ti ti-ticket" style={{ fontSize: 14 }} aria-hidden="true" />
          Offres standard
        </button>
        <button type="button" onClick={() => setActiveTab('fam')}
          style={{ background: activeTab === 'fam' ? '#fdbe11' : 'transparent', color: activeTab === 'fam' ? '#003090' : 'rgba(255,255,255,0.4)', boxShadow: activeTab === 'fam' ? '0 4px 16px rgba(253,190,17,0.4)' : 'none', borderRadius: 10, padding: 11, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
          <i className="ti ti-users" style={{ fontSize: 14 }} aria-hidden="true" />
          Réservation famille
        </button>
      </div>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 5 }}>

        {/* ── Vue offres standard ── */}
        {activeTab === 'std' && (
          <div className="offres-grid">
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', width: '100%' }}>
                <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)', display: 'block' }} aria-hidden="true" />
              </div>
            ) : allOffres.length === 0 ? (
              <div style={{ padding: '60px 0', color: 'rgba(255,255,255,0.4)', textAlign: 'center', width: '100%' }}>
                <i className="ti ti-ticket-off" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontWeight: 600 }}>Aucune formule disponible pour le moment.</p>
              </div>
            ) : allOffres.map((o, i) => (
              <OfferCard key={o.id} offre={o} isFirst={i === 0} />
            ))}
          </div>
        )}

        {/* ── Vue famille ── */}
        {activeTab === 'fam' && (
          <div style={{ padding: '0 16px 110px', animation: 'fadeInUp 0.4s ease' }}>

            {/* Card hero */}
            <div style={{ background: 'rgba(253,190,17,0.07)', border: '1.5px solid rgba(253,190,17,0.25)', borderRadius: 20, padding: 22, textAlign: 'center', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'rgba(253,190,17,0.12)', borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
              <div style={{ width: 56, height: 56, margin: '0 auto 14px', background: 'rgba(253,190,17,0.15)', border: '1.5px solid rgba(253,190,17,0.3)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-users" style={{ fontSize: 26, color: '#fdbe11' }} aria-hidden="true" />
              </div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Pack Famille sur mesure</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginBottom: 18, lineHeight: 1.6 }}>
                Adultes, enfants et bébés — chambres optimisées automatiquement.<br />
                Prix calculé en temps réel.
              </div>
              <button type="button" onClick={() => router.push('/famille')}
                style={{ width: '100%', background: '#fdbe11', color: '#003090', border: 'none', borderRadius: 13, padding: 13, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="ti ti-calculator" style={{ fontSize: 16 }} aria-hidden="true" />
                Configurer mon pack famille →
              </button>
            </div>

            {/* Card avantages */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16, marginBottom: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>CE QUI EST INCLUS</div>
              {([
                { icon: 'ti-bed',             label: 'Hébergement optimisé', sub: 'Chambres selon votre famille',      c: 'bleu' },
                { icon: 'ti-tools-kitchen-2', label: 'Repas au choix',       sub: 'Pension complète ou demi',          c: 'or'   },
                { icon: 'ti-bus',             label: 'Transport optionnel',   sub: 'Forfait aller-retour',              c: 'bleu' },
                { icon: 'ti-calculator',      label: 'Prix en temps réel',    sub: 'Calculé selon votre sélection',    c: 'or'   },
              ] as const).map((item, idx, arr) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: idx === 0 ? 0 : 9, paddingBottom: idx === arr.length - 1 ? 0 : 9, borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: item.c === 'bleu' ? 'rgba(0,48,144,0.35)' : 'rgba(253,190,17,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${item.icon}`} style={{ color: item.c === 'bleu' ? '#7eb8ff' : '#fdbe11', fontSize: 16 }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Sticky bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(6,10,30,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', zIndex: 100, display: 'flex', gap: 10 }}>
        <button type="button" onClick={() => setActiveTab('std')}
          style={{ flex: 1, background: activeTab === 'std' ? '#fdbe11' : 'rgba(255,255,255,0.07)', color: activeTab === 'std' ? '#003090' : 'rgba(255,255,255,0.6)', border: activeTab === 'std' ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: 13, padding: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
          <i className="ti ti-ticket" style={{ fontSize: 14 }} aria-hidden="true" />
          Offres standard
        </button>
        <button type="button" onClick={() => router.push('/famille')}
          style={{ flex: 1, background: activeTab === 'fam' ? '#fdbe11' : 'rgba(255,255,255,0.07)', color: activeTab === 'fam' ? '#003090' : '#fdbe11', border: activeTab === 'fam' ? 'none' : '1.5px solid rgba(253,190,17,0.35)', borderRadius: 13, padding: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
          <i className="ti ti-users" style={{ fontSize: 14 }} aria-hidden="true" />
          Réservation famille
        </button>
      </div>
    </div>
  )
}

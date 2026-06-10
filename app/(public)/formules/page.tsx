'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Offre } from '@/types'

function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }


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

  .famille-grid {
    padding: 0 16px 110px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    animation: fadeInUp 0.4s ease;
  }

  .offer-card-inner { padding: 16px; }
  .card-name        { color: #fff; font-size: 15px; font-weight: 800; margin-bottom: 4px; }
  .card-price       { color: #fdbe11; font-size: 18px; font-weight: 800; }

  /* Tablette */
  @media (min-width: 640px) {
    .offres-grid   { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .famille-grid  { grid-template-columns: repeat(2, 1fr); gap: 18px; }
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
    .famille-grid {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 40px 110px;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    .offer-card-inner { padding: 24px; }
    .card-name        { font-size: 17px; }
    .card-price       { font-size: 22px; }
    .page-header-inner { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
  }

  /* Grand écran */
  @media (min-width: 1440px) {
    .offres-grid  { max-width: 1280px; padding: 0 48px 110px; gap: 28px; }
    .famille-grid { max-width: 960px;  padding: 0 48px 110px; gap: 28px; }
    .page-header-inner { max-width: 1280px; }
  }
`

function getOffreImage(offre: Offre): string {
  if (offre.image_url) return offre.image_url
  if (offre.type_public === 'enfant')  return '/images/slide1.jpg'
  if (offre.type_public === 'adulte')  return '/images/slide2.jpg'
  if (offre.type_public === 'famille') return '/images/aquapark.jpg'
  return '/images/slide1.jpg'
}

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

// ── OfferCard (onglet Offres) ─────────────────────────────────────────────────

function OfferCard({ offre, isFirst }: { offre: Offre; isFirst: boolean }) {
  const router  = useRouter()
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
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160, background: '#060a1e', flexShrink: 0 }}>
        <img
          src={getOffreImage(offre)}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(10,15,46,0.8))' }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{ ...TAG[offre.type_public], fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(6px)' }}>
            {offre.type_public.charAt(0).toUpperCase() + offre.type_public.slice(1)}
          </span>
        </div>
      </div>

      <div className="offer-card-inner">

        {/* Tag chambre */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
            {offre.type_chambre}
          </span>
        </div>

        <div className="card-name">{offre.nom}</div>
        {offre.description && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>{offre.description}</div>
        )}

        {/* Pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
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

        {/* Places */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 5 }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#22c55e,#4ade80)', width: `${pct}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            {complet ? 'Complet' : `${offre.places_restantes} places restantes`}
          </div>
        </div>

        {/* Prix + bouton */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="card-price">{fmt(offre.prix_vente)}</div>
          </div>
          {complet ? (
            <span style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '9px 16px', fontSize: 11, fontWeight: 700 }}>Complet</span>
          ) : (
            <button type="button" onClick={() => router.push(`/offre/${offre.id}`)}
              style={{ background: isFirst ? '#fdbe11' : '#003090', color: isFirst ? '#003090' : '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              Réserver →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── FamilleCard (onglet Famille) ──────────────────────────────────────────────

function FamilleCard({ offre }: { offre: Offre }) {
  const router  = useRouter()
  const complet = offre.places_restantes === 0
  const oc      = (offre.options_custom ?? {}) as { nb_adultes?: number; nb_enfants?: number; nb_bebes?: number }
  const ad      = oc.nb_adultes ?? 2
  const en      = oc.nb_enfants ?? 0

  return (
    <div
      style={{
        background: '#003090',
        border: '2px solid #fdbe11',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform .25s, box-shadow .25s',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 50px rgba(0,48,144,0.6)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160, background: '#060a1e', flexShrink: 0 }}>
        <img
          src={getOffreImage(offre)}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,48,144,0.85))' }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(6px)' }}>
            🟢 Offre Famille
          </span>
        </div>
      </div>

      <div style={{ padding: 20, position: 'relative', zIndex: 1 }}>
        {/* Glow déco */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(253,190,17,0.08)', borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />

        {/* Titre */}
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{offre.nom}</div>

        {/* Description */}
        {offre.description && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>{offre.description}</div>
        )}

        {/* Détails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>👨‍👩‍👧</span>
            <span>{ad} adulte{ad > 1 ? 's' : ''}{en > 0 ? ` + ${en} enfant${en > 1 ? 's' : ''}` : ''}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🛏️</span>
            <span>Chambre {offre.type_chambre}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🌙</span>
            <span>{offre.nombre_nuits}N / {offre.nombre_jours}J</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🍽️</span>
            <span>Pension complète</span>
          </div>
        </div>

        {/* Prix */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#fdbe11', fontSize: 24, fontWeight: 900 }}>{fmt(offre.prix_vente)}</div>
        </div>

        {/* Bouton */}
        {complet ? (
          <div style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', borderRadius: 13, padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
            Complet
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/famille?offre=${offre.id}`)}
            style={{ width: '100%', background: '#fdbe11', color: '#003090', border: 'none', borderRadius: 13, padding: 13, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Réserver cette offre →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function FormulesPage() {
  const router                    = useRouter()
  const [activeTab, setActiveTab] = useState<'offres' | 'famille'>('offres')
  const [offres, setOffres]   = useState<Offre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offres')
      .then(r => r.json())
      .then((data: Offre[]) => setOffres((data ?? []).filter(o => o.actif)))
      .finally(() => setLoading(false))
  }, [])

  const offreStd    = offres.filter(o => o.type_public !== 'famille')
  const offreFamille = offres.filter(o => o.type_public === 'famille')

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

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 5, paddingTop: 16 }}>

        {/* ── Onglet Offres ── */}
        {activeTab === 'offres' && (
          <div className="offres-grid">
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', width: '100%' }}>
                <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)', display: 'block' }} aria-hidden="true" />
              </div>
            ) : offreStd.length === 0 ? (
              <div style={{ padding: '60px 0', color: 'rgba(255,255,255,0.4)', textAlign: 'center', width: '100%' }}>
                <i className="ti ti-ticket-off" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontWeight: 600 }}>Aucune formule disponible pour le moment.</p>
              </div>
            ) : offreStd.map((o, i) => (
              <OfferCard key={o.id} offre={o} isFirst={i === 0} />
            ))}
          </div>
        )}

        {/* ── Onglet Famille ── */}
        {activeTab === 'famille' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div className="famille-grid">
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                  <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)', display: 'block' }} aria-hidden="true" />
                </div>
              ) : offreFamille.map(o => (
                <FamilleCard key={o.id} offre={o} />
              ))}
            </div>

            {/* Séparateur + CTA configurateur */}
            <div style={{ padding: '0 16px 110px' }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 24px' }} />
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                  Votre famille ne rentre pas dans ces offres ?
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  Configurez votre séjour sur mesure
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/famille')}
                style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 auto', background: 'rgba(253,190,17,0.12)', border: '1.5px solid rgba(253,190,17,0.4)', color: '#fdbe11', borderRadius: 13, padding: 14, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
              >
                🎯 Configurer mon séjour →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bar (UNIQUEMENT en bas) ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(6,10,30,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', zIndex: 100, display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={() => setActiveTab('offres')}
          style={{ flex: 1, background: activeTab === 'offres' ? '#fdbe11' : 'rgba(255,255,255,0.07)', color: activeTab === 'offres' ? '#003090' : 'rgba(255,255,255,0.6)', border: activeTab === 'offres' ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: 13, padding: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}
        >
          🏆 Offres
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('famille')}
          style={{ flex: 1, background: activeTab === 'famille' ? '#fdbe11' : 'rgba(255,255,255,0.07)', color: activeTab === 'famille' ? '#003090' : '#fdbe11', border: activeTab === 'famille' ? 'none' : '1.5px solid rgba(253,190,17,0.35)', borderRadius: 13, padding: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}
        >
          👨‍👩‍👧 Famille
        </button>
      </div>
    </div>
  )
}

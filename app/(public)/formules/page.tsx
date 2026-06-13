'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Offre } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function getOffreImage(offre: Offre): string {
  if (offre.image_url) return offre.image_url
  if (offre.type_public === 'enfant')  return '/images/slide1.jpg'
  if (offre.type_public === 'adulte')  return '/images/slide2.jpg'
  if (offre.type_public === 'famille') return '/images/aquapark.jpg'
  return '/images/slide1.jpg'
}

type CoutInclus = { id: string; libelle: string; montant: number; type: string; categorie: string }

const CAT_ICON: Record<string, string> = {
  hebergement: 'ti-bed',
  repas:       'ti-tools-kitchen-2',
  transport:   'ti-bus',
  assurance:   'ti-shield-check',
  medical:     'ti-first-aid-kit',
  media:       'ti-camera',
  autre:       'ti-star',
}

const CAT_LABEL: Record<string, string> = {
  hebergement: 'Hébergement',
  repas:       'Repas',
  transport:   'Transport',
  assurance:   'Assurance',
  medical:     'Médical',
  media:       'Média',
  autre:       'Inclus',
}

const ACCENT: Record<string, string> = {
  enfant:  'linear-gradient(90deg,#003090,#0050cc)',
  adulte:  'linear-gradient(90deg,#fdbe11,#ffd94d)',
  famille: 'linear-gradient(90deg,#22c55e,#4ade80)',
}
const TAG: Record<string, React.CSSProperties> = {
  enfant:  { background: 'rgba(0,80,204,0.22)',   color: '#7eb8ff',  border: '1px solid rgba(0,80,204,0.3)' },
  adulte:  { background: 'rgba(253,190,17,0.15)', color: '#fdbe11',  border: '1px solid rgba(253,190,17,0.3)' },
  famille: { background: 'rgba(34,197,94,0.15)',  color: '#4ade80',  border: '1px solid rgba(34,197,94,0.3)' },
}
const TAG_LABEL: Record<string, string> = {
  enfant: 'Enfant', adulte: 'Adulte', famille: 'Famille',
}

// ── OfferCard ─────────────────────────────────────────────────────────────────

function OfferCard({ offre, isFirst, transportAmt }: {
  offre: Offre
  isFirst: boolean
  transportAmt: number
}) {
  const router  = useRouter()
  const complet = offre.places_restantes === 0
  const pct     = offre.places_total > 0
    ? Math.max(4, (offre.places_restantes / offre.places_total) * 100)
    : 0

  const couts = (offre.couts_inclus as unknown as CoutInclus[]).filter(c => typeof c !== 'string')
  const cats  = [...new Set(couts.map(c => c.categorie))]

  const repasLabel = offre.repas_type === 'complet' ? 'Pension complète'
    : offre.repas_type === 'demi' ? 'Demi-pension' : 'Sans repas'

  const transLabel = offre.transport_inclus ? 'Transport inclus'
    : offre.transport_optionnel ? `Transport +${fmt(transportAmt)}` : 'Sans transport'

  const borderColor = isFirst ? 'rgba(253,190,17,0.55)' : 'rgba(255,255,255,0.1)'
  const bgCard      = isFirst ? 'rgba(253,190,17,0.05)' : 'rgba(255,255,255,0.05)'

  return (
    <div
      style={{
        background: bgCard,
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 20, overflow: 'hidden',
        opacity: complet ? 0.55 : 1,
        display: 'flex', flexDirection: 'column',
        transition: 'transform .22s, box-shadow .22s',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 18px 44px rgba(0,0,0,0.32)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: ACCENT[offre.type_public] }} />

      {/* Image */}
      <div style={{ position: 'relative', height: 155, background: '#060a1e', flexShrink: 0 }}>
        <img src={getOffreImage(offre)} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(10,15,46,0.85))' }} />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{ ...TAG[offre.type_public], fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
            {TAG_LABEL[offre.type_public]}
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{offre.nom}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

        {/* Description */}
        {offre.description && (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>
            {offre.description}
          </p>
        )}

        {/* Pills infos */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            `${offre.nombre_nuits}N / ${offre.nombre_jours}J`,
            repasLabel,
            transLabel,
          ].map(p => (
            <span key={p} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 10.5, borderRadius: 5, padding: '3px 7px', whiteSpace: 'nowrap' }}>
              {p}
            </span>
          ))}
        </div>

        {/* Ce qui est inclus */}
        {cats.length > 0 && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Inclus</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cats.map(cat => (
                <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, padding: '3px 8px' }}>
                  <i className={`ti ${CAT_ICON[cat] ?? 'ti-star'}`} style={{ color: '#fdbe11', fontSize: 11 }} aria-hidden="true" />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 600 }}>{CAT_LABEL[cat] ?? cat}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Places */}
        <div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: complet ? '#ef4444' : 'linear-gradient(90deg,#22c55e,#4ade80)', width: `${pct}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10.5 }}>
            {complet ? '⚫ Complet' : `${offre.places_restantes} place${offre.places_restantes > 1 ? 's' : ''} restante${offre.places_restantes > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Prix + CTA */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 11, gap: 8 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 1 }}>Prix de vente</div>
            <div style={{ color: '#fdbe11', fontSize: 19, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
              {fmt(Number(offre.prix_vente))}
            </div>
          </div>
          {complet ? (
            <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '9px 14px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Complet</span>
          ) : (
            <button type="button" onClick={() => router.push(`/offre/${offre.id}`)}
              style={{ background: isFirst ? '#fdbe11' : '#003090', color: isFirst ? '#003090' : '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity .15s' }}>
              Réserver <i className="ti ti-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── FamilleCard ───────────────────────────────────────────────────────────────

function FamilleCard({ offre }: { offre: Offre }) {
  const router  = useRouter()
  const complet = offre.places_restantes === 0
  const oc      = (offre.options_custom ?? {}) as {
    nb_adultes?: number; nb_enfants?: number; nb_bebes?: number
    detail_cdr?: { nom: string; cdr: number; pv: number }[]
  }
  const ad = oc.nb_adultes ?? 2
  const en = oc.nb_enfants ?? 0
  const nb = oc.nb_bebes   ?? 0

  const pvPerPers = (ad + en) > 0
    ? Math.round(Number(offre.prix_vente) / (ad + en))
    : null

  return (
    <div
      style={{
        background: 'rgba(0,48,144,0.18)',
        border: '1.5px solid rgba(0,80,204,0.45)',
        borderRadius: 20, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .22s, box-shadow .22s',
        opacity: complet ? 0.55 : 1,
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 20px 50px rgba(0,48,144,0.5)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg,#003090,#0050cc)' }} />

      {/* Image */}
      <div style={{ position: 'relative', height: 140, background: '#060a1e', flexShrink: 0 }}>
        <img src={getOffreImage(offre)} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,20,90,0.88))' }} />
        <div style={{ position: 'absolute', top: 9, left: 10 }}>
          <span style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
            Pack Famille
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{offre.nom}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

        {/* Description */}
        {offre.description && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>
            {offre.description}
          </p>
        )}

        {/* Composition + détails */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
          {[
            { icon: 'ti-users', text: `${ad} adulte${ad > 1 ? 's' : ''}${en > 0 ? ` + ${en} enfant${en > 1 ? 's' : ''}` : ''}${nb > 0 ? ` + ${nb} bébé${nb > 1 ? 's' : ''}` : ''}` },
            { icon: 'ti-bed',   text: `Chambre ${offre.type_chambre}` },
            { icon: 'ti-moon',  text: `${offre.nombre_nuits}N / ${offre.nombre_jours}J` },
            { icon: 'ti-tools-kitchen-2', text: 'Pension complète' },
          ].map(r => (
            <div key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className={`ti ${r.icon}`} style={{ color: '#7eb8ff', fontSize: 12, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5 }}>{r.text}</span>
            </div>
          ))}
        </div>

        {/* Détail CDR si disponible */}
        {oc.detail_cdr && Array.isArray(oc.detail_cdr) && oc.detail_cdr.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 10px' }}>
            {(oc.detail_cdr as { nom: string; cdr: number; pv: number }[]).map(d => (
              <div key={d.nom} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5 }}>{d.nom}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontFamily: 'monospace' }}>{fmt(d.pv)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Places */}
        <div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: complet ? '#ef4444' : 'linear-gradient(90deg,#22c55e,#4ade80)', width: `${offre.places_total > 0 ? Math.max(4,(offre.places_restantes/offre.places_total)*100) : 0}%` }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10.5 }}>
            {complet ? '⚫ Complet' : `${offre.places_restantes} place${offre.places_restantes > 1 ? 's' : ''} disponible${offre.places_restantes > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Prix + CTA */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 11 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 1 }}>Prix total</div>
              <div style={{ color: '#fdbe11', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
                {fmt(Number(offre.prix_vente))}
              </div>
              {pvPerPers && (
                <div style={{ color: 'rgba(253,190,17,0.5)', fontSize: 10, marginTop: 2 }}>
                  ≈ {fmt(pvPerPers)} / personne
                </div>
              )}
            </div>
            {complet ? (
              <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Complet</span>
            ) : (
              <button type="button" onClick={() => router.push(`/famille?offre=${offre.id}`)}
                style={{ background: '#fdbe11', color: '#003090', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity .15s' }}>
                Réserver <i className="ti ti-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CSS responsive ────────────────────────────────────────────────────────────

const CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .offres-grid, .famille-grid {
    padding: 0 14px 120px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    animation: fadeInUp 0.35s ease;
  }
  @media (min-width: 600px) {
    .offres-grid  { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .famille-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  }
  @media (min-width: 1024px) {
    .offres-grid {
      max-width: 1140px; margin: 0 auto;
      padding: 0 32px 120px;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
    }
    .famille-grid {
      max-width: 860px; margin: 0 auto;
      padding: 0 32px 120px;
      grid-template-columns: repeat(2, 1fr);
      gap: 22px;
    }
  }
  @media (min-width: 1400px) {
    .offres-grid  { max-width: 1260px; gap: 26px; }
    .famille-grid { max-width: 920px;  gap: 26px; }
  }
`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FormulesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'offres' | 'famille'>('offres')
  const [offres, setOffres]       = useState<Offre[]>([])
  const [loading, setLoading]     = useState(true)
  const [dateStr, setDateStr]     = useState('Rusicada Park 2026')
  const [transportAmt, setTransportAmt] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/offres').then(r => r.json()),
      fetch('/api/parametres').then(r => r.json()).catch(() => null),
      fetch('/api/moteur').then(r => r.json()).catch(() => []),
    ]).then(([offresData, params, moteur]) => {
      setOffres((offresData ?? []).filter((o: Offre) => o.actif))
      if (params?.date_depart && params?.date_retour) {
        const d = fmtDate(params.date_depart)
        const r = fmtDate(params.date_retour)
        setDateStr(`Du ${d} au ${r} · RUSICA PARK`)
      }
      if (Array.isArray(moteur)) {
        const t = (moteur as { categorie: string; actif: boolean; montant: number }[])
          .find(c => c.categorie === 'transport' && c.actif)
        if (t) setTransportAmt(t.montant)
      }
    }).finally(() => setLoading(false))
  }, [])

  const offreStd    = offres.filter(o => o.type_public !== 'famille')
  const offreFamille = offres.filter(o => o.type_public === 'famille')

  return (
    <div style={{ backgroundColor: '#0a0f2e', minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* Glows déco */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -120, left: -90, width: 380, height: 380, borderRadius: '50%', background: 'rgba(0,48,144,0.38)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(253,190,17,0.06)', filter: 'blur(65px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,15,46,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <button type="button" onClick={() => router.push('/')} aria-label="Retour à l'accueil"
          style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} aria-hidden="true" />
        </button>
        <Image src="/images/icon-white.png" width={34} height={34} alt="Al Hazm" style={{ objectFit: 'contain' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Nos formules</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateStr}</div>
        </div>
      </header>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 5, paddingTop: 18 }}>

        {/* ── Onglet Offres standard ── */}
        {activeTab === 'offres' && (
          <div className="offres-grid">
            {loading ? (
              <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
                <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.4)', display: 'block' }} aria-hidden="true" />
              </div>
            ) : offreStd.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '64px 0', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                <i className="ti ti-ticket-off" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontWeight: 600, margin: 0 }}>Aucune formule disponible pour le moment.</p>
              </div>
            ) : offreStd.map((o, i) => (
              <OfferCard key={o.id} offre={o} isFirst={i === 0} transportAmt={transportAmt} />
            ))}
          </div>
        )}

        {/* ── Onglet Famille ── */}
        {activeTab === 'famille' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>

            {/* Cards famille */}
            <div className="famille-grid">
              {loading ? (
                <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
                  <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.4)', display: 'block' }} aria-hidden="true" />
                </div>
              ) : offreFamille.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '32px 0', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                  <p style={{ fontSize: 14 }}>Aucun pack famille configuré.</p>
                </div>
              ) : offreFamille.map(o => (
                <FamilleCard key={o.id} offre={o} />
              ))}
            </div>

            {/* CTA configurateur sur-mesure */}
            <div style={{ padding: '0 14px 120px', maxWidth: 860, margin: '0 auto' }}>
              <div style={{ background: 'rgba(253,190,17,0.06)', border: '1.5px dashed rgba(253,190,17,0.35)', borderRadius: 18, padding: '20px 20px', textAlign: 'center' }}>
                <div style={{ color: '#fdbe11', fontSize: 18, marginBottom: 6 }}>👨‍👩‍👧</div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, marginBottom: 5 }}>
                  Votre famille ne correspond pas à ces forfaits ?
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>
                  Configurez un séjour sur mesure — tarification en temps réel
                </div>
                <button type="button" onClick={() => router.push('/famille')}
                  style={{ background: 'rgba(253,190,17,0.15)', border: '1.5px solid rgba(253,190,17,0.5)', color: '#fdbe11', borderRadius: 12, padding: '11px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <i className="ti ti-adjustments-horizontal" style={{ fontSize: 14 }} aria-hidden="true" />
                  Configurer mon séjour sur mesure →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(6,10,30,0.97)', backdropFilter: 'blur(22px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 14px 14px', zIndex: 100, display: 'flex', gap: 10 }}>
        <button type="button" onClick={() => setActiveTab('offres')}
          style={{ flex: 1, background: activeTab === 'offres' ? '#fdbe11' : 'rgba(255,255,255,0.07)', color: activeTab === 'offres' ? '#003090' : 'rgba(255,255,255,0.55)', border: activeTab === 'offres' ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '12px 8px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
          <i className="ti ti-trophy" style={{ fontSize: 15 }} aria-hidden="true" />
          Offres
          {offreStd.length > 0 && (
            <span style={{ background: activeTab === 'offres' ? 'rgba(0,48,144,0.25)' : 'rgba(253,190,17,0.15)', color: activeTab === 'offres' ? '#003090' : '#fdbe11', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
              {offreStd.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('famille')}
          style={{ flex: 1, background: activeTab === 'famille' ? '#fdbe11' : 'rgba(253,190,17,0.06)', color: activeTab === 'famille' ? '#003090' : '#fdbe11', border: activeTab === 'famille' ? 'none' : '1.5px solid rgba(253,190,17,0.3)', borderRadius: 13, padding: '12px 8px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
          <i className="ti ti-users" style={{ fontSize: 15 }} aria-hidden="true" />
          Famille
          {offreFamille.length > 0 && (
            <span style={{ background: activeTab === 'famille' ? 'rgba(0,48,144,0.25)' : 'rgba(253,190,17,0.15)', color: activeTab === 'famille' ? '#003090' : '#fdbe11', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
              {offreFamille.length}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

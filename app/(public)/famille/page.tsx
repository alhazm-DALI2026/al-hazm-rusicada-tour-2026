'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculerFamille } from '@/lib/calc'
import type { Parametres, RepasType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FamilleForm {
  nb_adultes:   number
  nb_enfants:   number
  nb_bebes:     number
  nombre_nuits: number
  transport:    boolean
  repas:        RepasType
  nom:          string
  prenom:       string
  telephone:    string
  email:        string
}

const EMPTY: FamilleForm = {
  nb_adultes: 2, nb_enfants: 0, nb_bebes: 0, nombre_nuits: 5,
  transport: false, repas: 'complet',
  nom: '', prenom: '', telephone: '', email: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }

function formatChambres(chambres: { type: string }[]) {
  const counts = new Map<string, number>()
  for (const c of chambres) counts.set(c.type, (counts.get(c.type) ?? 0) + 1)
  return Array.from(counts.entries()).map(([type, n]) => `${n}×${type}`).join(' + ')
}

// ── Counter ───────────────────────────────────────────────────────────────────

function Counter({ label, sub, value, min, max, onChange }: {
  label: string; sub: string; value: number; min: number; max: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          −
        </button>
        <span style={{ color: '#fdbe11', fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#003090', border: '1px solid rgba(0,80,204,0.5)', color: '#fff', fontSize: 18, cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          +
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FamillePage() {
  const router = useRouter()
  const [params, setParams]         = useState<Parametres | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [form, setForm]             = useState<FamilleForm>(EMPTY)
  const [etape, setEtape]           = useState<1 | 2 | 3>(1)

  const adminNumero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  useEffect(() => {
    fetch('/api/parametres')
      .then(r => r.json())
      .then((p: Parametres) => setParams(p))
      .finally(() => setLoading(false))
  }, [])

  const result = useMemo(() => {
    if (!params) return null
    return calculerFamille(params, {
      nbAdultes:   form.nb_adultes,
      nbEnfants:   form.nb_enfants,
      nbBebes:     form.nb_bebes,
      nombreNuits: form.nombre_nuits,
      transport:   form.transport,
      repas:       form.repas,
    })
  }, [params, form])

  // Prix affiché = hébergement + repas uniquement (transport non compris)
  const pvAffiche  = result ? result.detail.hebergement_pv  + result.detail.repas_pv  : 0
  const cdrAffiche = result ? result.detail.hebergement_cdr + result.detail.repas_cdr : 0

  function setField<K extends keyof FamilleForm>(key: K, val: FamilleForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const canSubmit = !!form.nom && !!form.prenom && !!form.telephone && form.nb_adultes >= 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      offre_id:       null,
      nom:            form.nom.trim(),
      prenom:         form.prenom.trim(),
      telephone:      form.telephone.trim(),
      email:          form.email.trim() || null,
      type:           'famille',
      source:         'client',
      statut:         'en_attente',
      nb_adultes:     form.nb_adultes,
      nb_enfants:     form.nb_enfants,
      nombre_nuits:   form.nombre_nuits,
      transport:      form.transport,
      repas_type:     form.repas,
      cout_revient:   cdrAffiche,
      prix_vente:     pvAffiche,
      options_custom: {
        chambres:   result?.chambres ?? [],
        nb_bebes:   form.nb_bebes,
        detail_cdr: result?.detail ?? null,
      },
    }

    const r = await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string }
      setError(err.error ?? 'Erreur lors de la réservation. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    const reservation = await r.json()

    if (adminNumero) {
      await fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: adminNumero,
          message: `👨‍👩‍👧 Pack Famille ${reservation.reference}\n${form.prenom} ${form.nom} · ${form.nb_adultes}A + ${form.nb_enfants}E${form.nb_bebes > 0 ? ` + ${form.nb_bebes}B` : ''}\nTél: ${form.telephone}`,
        }),
      }).catch(() => {})
    }

    router.push(`/merci?ref=${reservation.reference}&nom=${encodeURIComponent(form.prenom)}`)
  }

  const ETAPES = ['Composition', 'Options', 'Coordonnées'] as const

  const inputSt: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, fontSize: 13, color: '#fff',
    outline: 'none', boxSizing: 'border-box', transition: 'all .2s',
  }

  function onFocusIn(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'rgba(253,190,17,0.5)'
    e.target.style.background  = 'rgba(253,190,17,0.05)'
  }
  function onFocusOut(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
    e.target.style.background  = 'rgba(255,255,255,0.05)'
  }

  return (
    <div style={{ backgroundColor: '#0a0f2e', minHeight: '100vh', paddingBottom: 120 }}>
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:rgba(255,255,255,0.2)}
      `}</style>

      {/* Glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(0,48,144,0.4)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(253,190,17,0.07)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => router.push('/formules')}
          style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} aria-hidden="true" />
        </button>
        <Image src="/images/icon-white.png" width={36} height={36} alt="Al Hazm" style={{ objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Réservation famille</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Du 23 au 28 Juin 2026</div>
        </div>
      </header>

      {/* Étapes */}
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'flex-start', padding: '16px 20px' }}>
        {ETAPES.map((label, idx) => {
          const num      = (idx + 1) as 1 | 2 | 3
          const isActive = etape === num
          const isDone   = etape > num
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: idx < ETAPES.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive || isDone ? '#fdbe11' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isActive || isDone ? '#003090' : 'rgba(255,255,255,0.3)', transition: 'all .3s' }}>
                  {isDone ? <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" /> : num}
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? '#fdbe11' : 'rgba(255,255,255,0.3)', transition: 'color .3s', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {idx < ETAPES.length - 1 && (
                <div style={{ flex: 1, height: 1, background: isDone ? 'rgba(253,190,17,0.4)' : 'rgba(255,255,255,0.1)', margin: '0 8px 16px', transition: 'background .3s' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Chargement */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 5 }}>
          <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
        </div>
      ) : !params ? (
        <div style={{ padding: 20, position: 'relative', zIndex: 5 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' }}>
            Pack Famille non disponible pour le moment.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 5 }}>

          {/* ── ÉTAPE 1 ── */}
          {etape === 1 && (
            <div style={{ padding: '0 16px', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Votre famille</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Indiquez la composition de votre groupe</div>
              </div>

              <Counter label="Adultes"         sub="min. 2 personnes"       value={form.nb_adultes}   min={1} max={20} onChange={v => setField('nb_adultes',   v)} />
              <Counter label="Enfants"          sub="3 à 17 ans"             value={form.nb_enfants}   min={0} max={20} onChange={v => setField('nb_enfants',   v)} />
              <Counter label="Bébés"            sub="0 à 2 ans · gratuit"    value={form.nb_bebes}     min={0} max={10} onChange={v => setField('nb_bebes',     v)} />
              <Counter label="Nombre de nuits"  sub="5 nuits recommandées"   value={form.nombre_nuits} min={1} max={7}  onChange={v => setField('nombre_nuits', v)} />

              {/* Chambres calculées */}
              {result && result.chambres.length > 0 && (
                <div style={{ background: 'rgba(0,48,144,0.2)', border: '1px solid rgba(0,80,204,0.3)', borderRadius: 14, padding: 14, margin: '12px 0' }}>
                  <div style={{ color: '#7eb8ff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    🛏️ Chambres attribuées
                  </div>
                  {result.chambres.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, marginBottom: i < result.chambres.length - 1 ? 6 : 0 }}>
                      <i className="ti ti-bed" style={{ color: '#7eb8ff', fontSize: 14 }} aria-hidden="true" />
                      Chambre {c.type} — {c.occupants}
                    </div>
                  ))}
                  {form.nb_bebes > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, marginTop: 6 }}>
                      <i className="ti ti-baby" style={{ color: '#fdbe11', fontSize: 14 }} aria-hidden="true" />
                      {form.nb_bebes} bébé{form.nb_bebes > 1 ? 's' : ''} — lit bébé (gratuit)
                    </div>
                  )}
                </div>
              )}

              <button type="button" onClick={() => setEtape(2)}
                style={{ width: '100%', background: '#003090', color: '#fff', border: 'none', borderRadius: 13, padding: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continuer — Options
                <i className="ti ti-arrow-right" style={{ fontSize: 14 }} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {etape === 2 && (
            <div style={{ padding: '0 16px', animation: 'fadeInUp 0.3s ease' }}>

              {/* Transport toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,48,144,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-bus" style={{ color: '#7eb8ff', fontSize: 18 }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Transport aller-retour</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>Forfait par personne</div>
                  </div>
                </div>
                <div onClick={() => setField('transport', !form.transport)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: form.transport ? '#003090' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.transport ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </div>
              </div>

              {/* Repas */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Type de repas</div>
                {([
                  { value: 'sans',    label: 'Sans repas',       sub: 'Repas non inclus'        },
                  { value: 'demi',    label: 'Demi-pension',     sub: 'Petit-déjeuner + dîner'  },
                  { value: 'complet', label: 'Pension complète', sub: '3 repas par jour inclus' },
                ] as const).map(opt => (
                  <div key={opt.value} onClick={() => setField('repas', opt.value)}
                    style={{ background: form.repas === opt.value ? 'rgba(253,190,17,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.repas === opt.value ? 'rgba(253,190,17,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{opt.sub}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${form.repas === opt.value ? '#fdbe11' : 'rgba(255,255,255,0.2)'}`, background: form.repas === opt.value ? '#fdbe11' : 'transparent', flexShrink: 0 }} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setEtape(1)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ← Retour
                </button>
                <button type="button" onClick={() => setEtape(3)}
                  style={{ flex: 2, background: '#003090', color: '#fff', border: 'none', borderRadius: 13, padding: 13, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Continuer — Coordonnées
                  <i className="ti ti-arrow-right" style={{ fontSize: 14 }} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {etape === 3 && (
            <div style={{ padding: '0 16px', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Vos coordonnées</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Pour confirmer votre réservation</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Prénom <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required value={form.prenom} onChange={e => setField('prenom', e.target.value)} placeholder="Votre prénom" style={inputSt} onFocus={onFocusIn} onBlur={onFocusOut} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required value={form.nom} onChange={e => setField('nom', e.target.value)} placeholder="Votre nom" style={inputSt} onFocus={onFocusIn} onBlur={onFocusOut} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Téléphone <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="tel" required value={form.telephone} onChange={e => setField('telephone', e.target.value)} placeholder="+213 XXX XXX XXX" style={inputSt} onFocus={onFocusIn} onBlur={onFocusOut} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span></label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="votre@email.com" style={inputSt} onFocus={onFocusIn} onBlur={onFocusOut} />
              </div>

              {/* Récapitulatif */}
              <div style={{ background: 'rgba(0,48,144,0.2)', border: '1px solid rgba(0,80,204,0.3)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                {([
                  { label: 'Composition', value: `${form.nb_adultes} adulte${form.nb_adultes > 1 ? 's' : ''}${form.nb_enfants > 0 ? ` + ${form.nb_enfants} enfant${form.nb_enfants > 1 ? 's' : ''}` : ''}${form.nb_bebes > 0 ? ` + ${form.nb_bebes} bébé${form.nb_bebes > 1 ? 's' : ''}` : ''}` },
                  { label: 'Chambres',    value: result ? formatChambres(result.chambres) : '—' },
                  { label: 'Transport',   value: form.transport ? 'Inclus' : 'Non' },
                  { label: 'Repas',       value: form.repas === 'complet' ? 'Pension complète' : form.repas === 'demi' ? 'Demi-pension' : 'Sans repas' },
                  { label: 'Durée',       value: `${form.nombre_nuits} nuits / ${form.nombre_nuits + 1} jours` },
                ]).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{row.label}</span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>TOTAL</span>
                  <span style={{ color: '#fdbe11', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                    {pvAffiche > 0 ? fmt(pvAffiche) : '—'}
                  </span>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.6, marginBottom: 14 }}>
                ⚠️ Le lien WhatsApp groupe sera partagé uniquement après confirmation de votre inscription par notre équipe.
              </p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setEtape(2)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ← Retour
                </button>
                <button type="submit" disabled={submitting || !canSubmit}
                  style={{ flex: 2, background: canSubmit && !submitting ? '#fdbe11' : 'rgba(253,190,17,0.4)', color: '#003090', border: 'none', borderRadius: 13, padding: 14, fontSize: 13, fontWeight: 900, cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting
                    ? <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} aria-hidden="true" />
                    : <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
                  }
                  {submitting ? 'Envoi en cours…' : 'Envoyer ma demande →'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Sticky bar */}
      {params && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(6,10,30,0.98)', backdropFilter: 'blur(24px)', borderTop: '2px solid rgba(253,190,17,0.4)', padding: '12px 16px', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Étapes 1 & 2 : chambres seulement, pas de prix */}
            {etape < 3 && (
              <>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CHAMBRES</div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {result && result.chambres.length > 0 ? formatChambres(result.chambres) : '—'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{form.nombre_nuits} nuit{form.nombre_nuits > 1 ? 's' : ''}</div>
                </div>
                <button type="button"
                  onClick={() => { if (etape === 1) setEtape(2); else setEtape(3) }}
                  style={{ background: '#fdbe11', color: '#003090', border: 'none', borderRadius: 13, padding: '12px 20px', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  Continuer →
                  <i className="ti ti-arrow-right" style={{ fontSize: 14 }} aria-hidden="true" />
                </button>
              </>
            )}

            {/* Étape 3 : prix hébergement + repas uniquement */}
            {etape === 3 && (
              <div>
                <div style={{ color: '#fdbe11', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>TOTAL HÉBERGEMENT + REPAS</div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.2 }}>
                  {pvAffiche > 0 ? fmt(pvAffiche) : '—'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                  {result && result.chambres.length > 0 ? formatChambres(result.chambres) : '—'} · {form.nombre_nuits} nuit{form.nombre_nuits > 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

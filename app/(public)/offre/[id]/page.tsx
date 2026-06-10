'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MoteurCout, Offre, RepasType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingForm {
  nom:       string
  prenom:    string
  telephone: string
  email:     string
  transport: boolean
  repas_type: RepasType
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <i className={`ti ${icon}`} style={{ color: '#7eb8ff', fontSize: 17, width: 20, flexShrink: 0 }} aria-hidden="true" />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OffrePage() {
  const params   = useParams<{ id: string }>()
  const router   = useRouter()
  const id       = params.id

  const [offre, setOffre]             = useState<Offre | null>(null)
  const [moteurCouts, setMoteurCouts] = useState<MoteurCout[]>([])
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const [form, setForm] = useState<BookingForm>({
    nom: '', prenom: '', telephone: '', email: '',
    transport: false, repas_type: 'complet',
  })

  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'
  const adminNumero  = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  useEffect(() => {
    Promise.all([
      fetch('/api/offres').then(r => r.json()),
      fetch('/api/moteur').then(r => r.json()),
    ]).then(([offresData, coutsData]: [Offre[], MoteurCout[]]) => {
      setMoteurCouts(coutsData)
      const found = offresData.find(o => o.id === id && o.actif)
      if (!found) { setNotFound(true); return }
      setOffre(found)
      setForm(f => ({
        ...f,
        transport:  found.transport_inclus,
        repas_type: found.repas_type,
      }))
    }).finally(() => setLoading(false))
  }, [id])

  function setField<K extends keyof BookingForm>(key: K, val: BookingForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!offre) return
    setSubmitting(true)
    setError(null)

    const isOptional       = offre.transport_optionnel && !offre.transport_inclus
    const avecTransport    = form.transport && isOptional
    const montantTransport = moteurCouts.find(c => c.categorie === 'transport' && c.actif)?.montant ?? 0
    const prixFinal        = Number(offre.prix_vente) + (avecTransport ? montantTransport : 0)

    const payload = {
      offre_id:     offre.id,
      nom:          form.nom.trim(),
      prenom:       form.prenom.trim(),
      telephone:    form.telephone.trim(),
      email:        form.email.trim() || null,
      type:         'standard',
      source:       'client',
      statut:       'en_attente',
      nb_adultes:   offre.type_public === 'enfant' ? 0 : 1,
      nb_enfants:   offre.type_public === 'enfant' ? 1 : 0,
      nombre_nuits: offre.nombre_nuits,
      transport:    form.transport,
      repas_type:   form.repas_type,
      cout_revient: Number(offre.cout_revient) + (avecTransport ? montantTransport : 0),
      prix_vente:   prixFinal,
    }

    const r = await fetch('/api/reservations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: adminNumero,
          message:   `📋 Nouvelle réservation ${reservation.reference}\n${form.prenom} ${form.nom} · ${offre.nom}\nTél: ${form.telephone}`,
        }),
      }).catch(() => {})
    }

    router.push(`/merci?ref=${reservation.reference}&nom=${encodeURIComponent(form.prenom)}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
      </div>
    )
  }

  if (notFound || !offre) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
        <i className="ti ti-ticket-off" style={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} aria-hidden="true" />
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Formule non disponible</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>Cette formule n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/" style={{ padding: '10px 20px', background: '#003090', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  const complet          = offre.places_restantes === 0
  const isOptional       = offre.transport_optionnel && !offre.transport_inclus
  const montantTransport = moteurCouts.find(c => c.categorie === 'transport' && c.actif)?.montant ?? 0
  const prixFinal        = Number(offre.prix_vente) + (isOptional && form.transport ? montantTransport : 0)

  const TYPE_TAG: Record<string, { bg: string; color: string; label: string }> = {
    enfant:  { bg: 'rgba(0,80,204,0.25)',   color: '#7eb8ff', label: 'Enfant'  },
    adulte:  { bg: 'rgba(253,190,17,0.18)', color: '#fdbe11', label: 'Adulte'  },
    famille: { bg: 'rgba(34,197,94,0.18)',  color: '#4ade80', label: 'Famille' },
  }
  const tag = TYPE_TAG[offre.type_public] ?? TYPE_TAG.adulte

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f2e', position: 'relative' }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .offre-input {
          width: 100%; padding: 12px 14px; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; font-size: 13px; color: #fff;
          outline: none; transition: border-color .2s, background .2s;
        }
        .offre-input::placeholder { color: rgba(255,255,255,0.2); }
        .offre-input:focus {
          border-color: rgba(253,190,17,0.5);
          background: rgba(253,190,17,0.04);
        }
      `}</style>

      {/* Glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(0,48,144,0.4)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(253,190,17,0.07)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/formules" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <i className="ti ti-arrow-left" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} aria-hidden="true" />
        </Link>
        <div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{offre.nom}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{nomEvenement}</div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 5, maxWidth: 860, margin: '0 auto', padding: '20px 16px 120px', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

        {/* ── Détails de l'offre ─────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', animation: 'fadeInUp 0.35s ease' }}>
          <div style={{ height: 4, background: offre.type_public === 'enfant' ? 'linear-gradient(90deg,#003090,#0050cc)' : offre.type_public === 'famille' ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#fdbe11,#ffd94d)' }} />
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ background: tag.bg, color: tag.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{tag.label}</span>
              <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>{offre.type_chambre}</span>
              {complet && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>Complet</span>}
            </div>
            <h1 style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>{offre.nom}</h1>
            {offre.description && (
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: '0 0 14px' }}>{offre.description}</p>
            )}
            <DetailRow icon="ti-bed"   label="Chambre"   value={offre.type_chambre} />
            <DetailRow icon="ti-moon"  label="Durée"     value={`${offre.nombre_nuits} nuits · ${offre.nombre_jours} jours`} />
            <DetailRow icon="ti-bus"   label="Transport"
              value={offre.transport_inclus ? 'Inclus' : offre.transport_optionnel ? `Optionnel (+ ${montantTransport > 0 ? fmt(montantTransport) : 'supplément'})` : 'Non inclus'}
            />
            <DetailRow icon="ti-soup"  label="Repas"
              value={offre.repas_type === 'complet' ? 'Pension complète' : offre.repas_type === 'demi' ? 'Demi-pension' : 'Sans repas'}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10 }}>
              <i className="ti ti-users" style={{ color: '#7eb8ff', fontSize: 17, width: 20, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, width: 120, flexShrink: 0 }}>Places</span>
              <div style={{ flex: 1 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 4 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: complet ? '#ef4444' : 'linear-gradient(90deg,#22c55e,#4ade80)', width: `${offre.places_total > 0 ? (offre.places_restantes / offre.places_total) * 100 : 0}%`, transition: 'width .3s' }} />
                </div>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                  {complet ? 'Complet' : `${offre.places_restantes} / ${offre.places_total} disponibles`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Formulaire de réservation ──────────────────────── */}
        <div style={{ animation: 'fadeInUp 0.45s ease' }}>
          {complet ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
              <i className="ti ti-ticket-off" style={{ fontSize: 40, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>Cette formule est complète</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 20px' }}>Il n&apos;y a plus de places disponibles.</p>
              <Link href="/formules" style={{ padding: '10px 24px', background: '#003090', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                Voir les autres formules
              </Link>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 18px' }}>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 18px' }}>Votre réservation</h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Prénom <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" required className="offre-input" value={form.prenom}
                      onChange={e => setField('prenom', e.target.value)} placeholder="Votre prénom" />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Nom <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" required className="offre-input" value={form.nom}
                      onChange={e => setField('nom', e.target.value)} placeholder="Votre nom" />
                  </div>
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Téléphone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="tel" required className="offre-input" value={form.telephone}
                    onChange={e => setField('telephone', e.target.value)} placeholder="+213 XXX XXX XXX" />
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Email <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span>
                  </label>
                  <input type="email" className="offre-input" value={form.email}
                    onChange={e => setField('email', e.target.value)} placeholder="votre@email.com" />
                </div>

                {/* Transport optionnel */}
                {offre.transport_optionnel && !offre.transport_inclus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => setField('transport', !form.transport)}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,48,144,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-bus" style={{ color: '#7eb8ff', fontSize: 17 }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Transport aller-retour</div>
                      {montantTransport > 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>+ {fmt(montantTransport)} par personne</div>
                      )}
                    </div>
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: form.transport ? '#003090' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: form.transport ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                  </div>
                )}

                {/* Repas choice if not fixed */}
                {offre.repas_type !== 'complet' && (
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Type de repas</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['complet', 'demi', 'sans'] as RepasType[]).map(r => (
                        <button key={r} type="button" onClick={() => setField('repas_type', r)}
                          style={{ flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: 700, borderRadius: 10, border: `1px solid ${form.repas_type === r ? 'rgba(253,190,17,0.5)' : 'rgba(255,255,255,0.1)'}`, background: form.repas_type === r ? 'rgba(253,190,17,0.1)' : 'rgba(255,255,255,0.04)', color: form.repas_type === r ? '#fdbe11' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all .2s' }}>
                          {r === 'complet' ? 'Complet' : r === 'demi' ? 'Demi' : 'Sans'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 14px', color: '#fca5a5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-alert-circle" aria-hidden="true" />
                    {error}
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: 'rgba(0,48,144,0.2)', border: '1px solid rgba(0,80,204,0.3)', borderRadius: 14, padding: '14px 16px' }}>
                  {isOptional && montantTransport > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Prix base</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'monospace' }}>{fmt(Number(offre.prix_vente))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Transport</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'monospace' }}>
                          {form.transport ? `+ ${fmt(montantTransport)}` : '—'}
                        </span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>Total à payer</span>
                    <span style={{ color: '#fdbe11', fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>{fmt(prixFinal)}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  style={{ width: '100%', padding: 14, background: submitting ? 'rgba(253,190,17,0.5)' : '#fdbe11', color: '#003090', border: 'none', borderRadius: 13, fontSize: 13, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
                  <i className={`ti ${submitting ? 'ti-loader-2 animate-spin' : 'ti-check'}`} aria-hidden="true" />
                  {submitting ? 'Envoi en cours…' : 'Confirmer ma réservation'}
                </button>

                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', margin: 0 }}>
                  Votre réservation sera confirmée par notre équipe dans les plus brefs délais.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

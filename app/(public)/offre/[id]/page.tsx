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
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <i className={`ti ${icon} text-[#003090] text-lg w-5 shrink-0`} aria-hidden="true" />
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OffrePage() {
  const params   = useParams<{ id: string }>()
  const router   = useRouter()
  const id       = params.id

  const [offre, setOffre]           = useState<Offre | null>(null)
  const [moteurCouts, setMoteurCouts] = useState<MoteurCout[]>([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

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

    // Notify admin via WhatsApp (best-effort)
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

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003090] focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-4xl text-[#003090]" aria-hidden="true" />
      </div>
    )
  }

  if (notFound || !offre) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <i className="ti ti-ticket-off text-5xl text-gray-400" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-700">Formule non disponible</h1>
        <p className="text-sm text-gray-500">Cette formule n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/" className="px-5 py-2.5 bg-[#003090] text-white rounded-xl text-sm font-semibold hover:bg-[#002070] transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  const complet          = offre.places_restantes === 0
  const isOptional       = offre.transport_optionnel && !offre.transport_inclus
  const montantTransport = moteurCouts.find(c => c.categorie === 'transport' && c.actif)?.montant ?? 0
  const prixFinal        = Number(offre.prix_vente) + (isOptional && form.transport ? montantTransport : 0)

  return (
    <div className="min-h-screen bg-[#f0f2f8]">

      {/* ── Simple header ──────────────────────────────────────── */}
      <header className="bg-white border-b-[3px] border-[#fdbe11]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#003090] transition-colors text-sm">
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Retour
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">{nomEvenement}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Offer details (left / top) ──────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-3 ${
              offre.type_public === 'enfant' ? 'bg-green-100 text-green-700 border-green-200'
              : offre.type_public === 'famille' ? 'bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              {offre.type_public === 'enfant' ? 'Enfant'
                : offre.type_public === 'famille' ? 'Famille' : 'Adulte'}
            </span>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{offre.nom}</h1>
            {offre.description && (
              <p className="text-sm text-gray-500 mb-3">{offre.description}</p>
            )}

            <DetailRow icon="ti-bed"    label="Chambre"    value={offre.type_chambre} />
            <DetailRow icon="ti-moon"   label="Durée"      value={`${offre.nombre_nuits} nuits · ${offre.nombre_jours} jours`} />
            <DetailRow icon="ti-bus"    label="Transport"
              value={offre.transport_inclus ? 'Inclus' : offre.transport_optionnel ? 'Optionnel (+supplément)' : 'Non inclus'}
            />
            <DetailRow icon="ti-soup"   label="Repas"
              value={offre.repas_type === 'complet' ? 'Pension complète'
                : offre.repas_type === 'demi' ? 'Demi-pension' : 'Sans repas'}
            />
            <DetailRow icon="ti-users"  label="Places"
              value={`${offre.places_restantes} / ${offre.places_total} disponibles`}
            />
          </div>

        </div>

        {/* ── Booking form (right / bottom) ───────────────────── */}
        <div className="lg:col-span-3">
          {complet ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <i className="ti ti-ticket-off text-4xl text-gray-400 mb-3 block" aria-hidden="true" />
              <p className="font-bold text-gray-700 mb-1">Cette formule est complète</p>
              <p className="text-sm text-gray-500 mb-4">Il n&apos;y a plus de places disponibles.</p>
              <Link href="/" className="px-5 py-2.5 bg-[#003090] text-white rounded-xl text-sm font-semibold hover:bg-[#002070] transition-colors">
                Voir les autres formules
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#003090] mb-5">Votre réservation</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Prénom <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.prenom}
                      onChange={e => setField('prenom', e.target.value)}
                      placeholder="Votre prénom" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.nom}
                      onChange={e => setField('nom', e.target.value)}
                      placeholder="Votre nom" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Téléphone <span className="text-red-500">*</span></label>
                  <input type="tel" required value={form.telephone}
                    onChange={e => setField('telephone', e.target.value)}
                    placeholder="+213 XXX XXX XXX" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="optionnel" className={inputCls} />
                </div>

                {/* Transport optionnel */}
                {offre.transport_optionnel && !offre.transport_inclus && (
                  <div className="flex items-center gap-3 p-3 bg-[#f0f2f8] rounded-xl">
                    <input
                      type="checkbox" id="transport"
                      checked={form.transport}
                      onChange={e => setField('transport', e.target.checked)}
                      className="w-4 h-4 accent-[#003090]"
                    />
                    <label htmlFor="transport" className="text-sm font-medium text-gray-700 cursor-pointer">
                      <i className="ti ti-bus mr-1.5 text-[#003090]" aria-hidden="true" />
                      Ajouter le transport
                    </label>
                  </div>
                )}

                {/* Repas choice if not fixed */}
                {offre.repas_type !== 'complet' && (
                  <div>
                    <label className={labelCls}>Type de repas</label>
                    <div className="flex gap-2">
                      {(['complet', 'demi', 'sans'] as RepasType[]).map(r => (
                        <button
                          key={r} type="button"
                          onClick={() => setField('repas_type', r)}
                          className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                            form.repas_type === r
                              ? 'bg-[#003090] text-white border-[#003090]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#003090]'
                          }`}
                        >
                          {r === 'complet' ? 'Complet' : r === 'demi' ? 'Demi-pension' : 'Sans'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                    <i className="ti ti-alert-circle" aria-hidden="true" />
                    {error}
                  </div>
                )}

                {/* Summary */}
                <div className="bg-[#f0f2f8] rounded-xl p-4 space-y-1.5">
                  {isOptional && montantTransport > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Prix base</span>
                        <span className="font-mono">{fmt(Number(offre.prix_vente))}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Transport</span>
                        <span className="font-mono">{form.transport ? `+ ${fmt(montantTransport)}` : '—'}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total à payer</span>
                    <span className="text-xl font-bold text-[#003090] font-mono">{fmt(prixFinal)}</span>
                  </div>
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full py-3 bg-[#003090] text-white rounded-xl font-semibold hover:bg-[#002070] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  <i className={`ti ${submitting ? 'ti-loader-2 animate-spin' : 'ti-check'}`} aria-hidden="true" />
                  {submitting ? 'Envoi en cours…' : 'Confirmer ma réservation'}
                </button>

                <p className="text-xs text-gray-400 text-center">
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

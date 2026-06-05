'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculerCoutFamille } from '@/lib/calc'
import type { MoteurCout, Offre, RepasType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FamilleForm {
  offre_adulte_id: string
  offre_enfant_id: string
  nb_adultes:      string
  nb_enfants:      string
  transport:       boolean
  repas_type:      RepasType
  nom:             string
  prenom:          string
  telephone:       string
  email:           string
}

const EMPTY: FamilleForm = {
  offre_adulte_id: '', offre_enfant_id: '',
  nb_adultes: '1', nb_enfants: '1',
  transport: false, repas_type: 'complet',
  nom: '', prenom: '', telephone: '', email: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FamillePage() {
  const router = useRouter()

  const [offres, setOffres]     = useState<Offre[]>([])
  const [couts, setCouts]       = useState<MoteurCout[]>([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [form, setForm]         = useState<FamilleForm>(EMPTY)

  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'
  const adminNumero  = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  useEffect(() => {
    Promise.all([
      fetch('/api/offres').then(r => r.json()),
      fetch('/api/moteur').then(r => r.json()),
    ]).then(([o, m]: [Offre[], MoteurCout[]]) => {
      setOffres(o.filter(x => x.actif))
      setCouts(m)
    }).finally(() => setLoading(false))
  }, [])

  const offresAdulte = offres.filter(o => o.type_public === 'adulte')
  const offresEnfant = offres.filter(o => o.type_public === 'enfant')

  // Resolve selected offre objects
  const offreAdulte = useMemo(
    () => offres.find(o => o.id === form.offre_adulte_id) ?? null,
    [offres, form.offre_adulte_id],
  )
  const offreEnfant = useMemo(
    () => offres.find(o => o.id === form.offre_enfant_id) ?? null,
    [offres, form.offre_enfant_id],
  )

  // CDR calculation
  const cdr = useMemo(() => {
    if (!offreAdulte || !offreEnfant) return 0
    return calculerCoutFamille(
      offreAdulte, offreEnfant, couts,
      parseInt(form.nb_adultes) || 1,
      parseInt(form.nb_enfants) || 1,
      form.transport, form.repas_type,
      30, // taux demi-pension default
    )
  }, [offreAdulte, offreEnfant, couts, form.nb_adultes, form.nb_enfants, form.transport, form.repas_type])

  // Prix total estimate
  const prixTotal = useMemo(() => {
    if (!offreAdulte || !offreEnfant) return 0
    return offreAdulte.prix_vente * (parseInt(form.nb_adultes) || 1)
         + offreEnfant.prix_vente  * (parseInt(form.nb_enfants) || 1)
  }, [offreAdulte, offreEnfant, form.nb_adultes, form.nb_enfants])

  function setField<K extends keyof FamilleForm>(key: K, val: FamilleForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const canSubmit = form.offre_adulte_id && form.offre_enfant_id
    && form.nom && form.prenom && form.telephone

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!offreAdulte || !offreEnfant) return
    setSubmitting(true)
    setError(null)

    const nbAdultes = parseInt(form.nb_adultes) || 1
    const nbEnfants = parseInt(form.nb_enfants) || 1

    const payload = {
      offre_id:     null,
      nom:          form.nom.trim(),
      prenom:       form.prenom.trim(),
      telephone:    form.telephone.trim(),
      email:        form.email.trim() || null,
      type:         'famille',
      source:       'client',
      statut:       'en_attente',
      nb_adultes:   nbAdultes,
      nb_enfants:   nbEnfants,
      nombre_nuits: offreAdulte.nombre_nuits,
      transport:    form.transport,
      repas_type:   form.repas_type,
      cout_revient: cdr,
      prix_vente:   prixTotal,
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
          message:   `👨‍👩‍👧 Pack Famille ${reservation.reference}\n${form.prenom} ${form.nom} · ${nbAdultes}A + ${nbEnfants}E\nTél: ${form.telephone}`,
        }),
      }).catch(() => {})
    }

    router.push(`/merci?ref=${reservation.reference}&nom=${encodeURIComponent(form.prenom)}`)
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003090] focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <div className="min-h-screen bg-[#f0f2f8]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b-[3px] border-[#fdbe11]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#003090] transition-colors text-sm">
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Retour
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-[#003090]">{nomEvenement} — Pack Famille</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex justify-center py-16 text-[#003090]">
            <i className="ti ti-loader-2 animate-spin text-4xl" aria-hidden="true" />
          </div>
        ) : offresAdulte.length === 0 || offresEnfant.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
            <i className="ti ti-users-off text-4xl mb-3 block" aria-hidden="true" />
            <p className="font-medium mb-1">Pack Famille non disponible</p>
            <p className="text-sm mb-4">Il faut des formules adulte et enfant actives.</p>
            <Link href="/" className="px-5 py-2.5 bg-[#003090] text-white rounded-xl text-sm font-semibold hover:bg-[#002070] transition-colors">
              Voir les formules disponibles
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <h1 className="text-2xl font-bold text-[#003090]">Pack Famille personnalisé</h1>

            {/* ── Step 1 : Composition ──────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#003090] text-white rounded-full flex items-center justify-center text-xs">1</span>
                Composition du pack
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Formule adulte <span className="text-red-500">*</span></label>
                  <select
                    required value={form.offre_adulte_id}
                    onChange={e => setField('offre_adulte_id', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Choisir…</option>
                    {offresAdulte.map(o => (
                      <option key={o.id} value={o.id} disabled={o.places_restantes === 0}>
                        {o.nom} — {fmt(o.prix_vente)}{o.places_restantes === 0 ? ' (complet)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Formule enfant <span className="text-red-500">*</span></label>
                  <select
                    required value={form.offre_enfant_id}
                    onChange={e => setField('offre_enfant_id', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Choisir…</option>
                    {offresEnfant.map(o => (
                      <option key={o.id} value={o.id} disabled={o.places_restantes === 0}>
                        {o.nom} — {fmt(o.prix_vente)}{o.places_restantes === 0 ? ' (complet)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre d&apos;adultes</label>
                  <input type="number" min="1" max="10"
                    value={form.nb_adultes}
                    onChange={e => setField('nb_adultes', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nombre d&apos;enfants</label>
                  <input type="number" min="1" max="10"
                    value={form.nb_enfants}
                    onChange={e => setField('nb_enfants', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-[#f0f2f8] rounded-xl">
                  <input type="checkbox" id="transport-fam"
                    checked={form.transport}
                    onChange={e => setField('transport', e.target.checked)}
                    className="w-4 h-4 accent-[#003090]"
                  />
                  <label htmlFor="transport-fam" className="text-sm font-medium text-gray-700 cursor-pointer">
                    <i className="ti ti-bus mr-1.5 text-[#003090]" aria-hidden="true" />
                    Avec transport
                  </label>
                </div>
                <div>
                  <select
                    value={form.repas_type}
                    onChange={e => setField('repas_type', e.target.value as RepasType)}
                    className={`${selectCls} h-full`}
                  >
                    <option value="complet">Pension complète</option>
                    <option value="demi">Demi-pension</option>
                    <option value="sans">Sans repas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── CDR / Price preview ────────────────────────────── */}
            {offreAdulte && offreEnfant && (
              <div className="bg-[#003090] text-white rounded-2xl p-5">
                <p className="text-[#fdbe11] text-xs font-semibold uppercase tracking-wide mb-3">Estimation du pack</p>
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">{parseInt(form.nb_adultes) || 1} adulte{(parseInt(form.nb_adultes) || 1) > 1 ? 's' : ''}</span>
                    <span className="font-mono">{fmt(offreAdulte.prix_vente * (parseInt(form.nb_adultes) || 1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">{parseInt(form.nb_enfants) || 1} enfant{(parseInt(form.nb_enfants) || 1) > 1 ? 's' : ''}</span>
                    <span className="font-mono">{fmt(offreEnfant.prix_vente * (parseInt(form.nb_enfants) || 1))}</span>
                  </div>
                </div>
                <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                  <span className="font-bold">Total estimé</span>
                  <span className="text-2xl font-bold font-mono">{fmt(prixTotal)}</span>
                </div>
              </div>
            )}

            {/* ── Step 2 : Vos coordonnées ──────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#003090] text-white rounded-full flex items-center justify-center text-xs">2</span>
                Vos coordonnées
              </h2>

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
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={submitting || !canSubmit}
              className="w-full py-3.5 bg-[#003090] text-white rounded-xl font-semibold hover:bg-[#002070] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <i className={`ti ${submitting ? 'ti-loader-2 animate-spin' : 'ti-check'}`} aria-hidden="true" />
              {submitting ? 'Envoi en cours…' : 'Envoyer ma demande de réservation'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Votre réservation sera confirmée par notre équipe dans les plus brefs délais.
            </p>
          </form>
        )}
      </main>
    </div>
  )
}

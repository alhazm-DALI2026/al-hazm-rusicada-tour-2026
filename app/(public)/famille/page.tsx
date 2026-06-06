'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculerFamille } from '@/lib/calc'
import type { Parametres, RepasType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FamilleForm {
  nb_adultes:   string
  nb_enfants:   string
  nb_bebes:     string
  nombre_nuits: string
  transport:    boolean
  repas:        RepasType
  nom:          string
  prenom:       string
  telephone:    string
  email:        string
}

const EMPTY: FamilleForm = {
  nb_adultes: '2', nb_enfants: '0', nb_bebes: '0', nombre_nuits: '5',
  transport: false, repas: 'complet',
  nom: '', prenom: '', telephone: '', email: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function formatChambres(chambres: { type: string; occupants: string }[]) {
  const counts = new Map<string, number>()
  for (const c of chambres) counts.set(c.type, (counts.get(c.type) ?? 0) + 1)
  return Array.from(counts.entries()).map(([type, n]) => `${n}×${type}`).join(' + ')
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FamillePage() {
  const router = useRouter()

  const [params, setParams]         = useState<Parametres | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [form, setForm]             = useState<FamilleForm>(EMPTY)

  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'
  const adminNumero  = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  useEffect(() => {
    fetch('/api/parametres')
      .then(r => r.json())
      .then((p: Parametres) => setParams(p))
      .finally(() => setLoading(false))
  }, [])

  const result = useMemo(() => {
    if (!params) return null
    return calculerFamille(params, {
      nbAdultes:   parseInt(form.nb_adultes)   || 0,
      nbEnfants:   parseInt(form.nb_enfants)   || 0,
      nbBebes:     parseInt(form.nb_bebes)     || 0,
      nombreNuits: parseInt(form.nombre_nuits) || 0,
      transport:   form.transport,
      repas:       form.repas,
    })
  }, [params, form])

  function setField<K extends keyof FamilleForm>(key: K, val: FamilleForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const canSubmit = form.nom && form.prenom && form.telephone && (parseInt(form.nb_adultes) || 0) >= 1

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
      nb_adultes:     parseInt(form.nb_adultes)   || 0,
      nb_enfants:     parseInt(form.nb_enfants)   || 0,
      nombre_nuits:   parseInt(form.nombre_nuits) || 0,
      transport:      form.transport,
      repas_type:     form.repas,
      cout_revient:   result?.cdrTotal ?? 0,
      prix_vente:     result?.pvTotal  ?? 0,
      options_custom: {
        chambres:   result?.chambres ?? [],
        nb_bebes:   parseInt(form.nb_bebes) || 0,
        detail_cdr: result?.detail ?? null,
      },
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
      const nbA = parseInt(form.nb_adultes) || 0
      const nbE = parseInt(form.nb_enfants) || 0
      const nbB = parseInt(form.nb_bebes)   || 0
      await fetch('/api/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: adminNumero,
          message:   `👨‍👩‍👧 Pack Famille ${reservation.reference}\n${form.prenom} ${form.nom} · ${nbA}A + ${nbE}E${nbB > 0 ? ` + ${nbB}B` : ''}\nTél: ${form.telephone}`,
        }),
      }).catch(() => {})
    }

    router.push(`/merci?ref=${reservation.reference}&nom=${encodeURIComponent(form.prenom)}`)
  }

  const inputCls  = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003090] focus:border-transparent'
  const labelCls  = 'block text-sm font-medium text-gray-700 mb-1'
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
        ) : !params ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
            <i className="ti ti-users-off text-4xl mb-3 block" aria-hidden="true" />
            <p className="font-medium mb-1">Pack Famille non disponible</p>
            <p className="text-sm mb-4">Les paramètres tarifaires ne sont pas encore configurés.</p>
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

              {/* Nb personnes */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Adultes <span className="text-red-500">*</span></label>
                  <input type="number" min="1" max="20" required
                    value={form.nb_adultes}
                    onChange={e => setField('nb_adultes', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Enfants</label>
                  <input type="number" min="0" max="20"
                    value={form.nb_enfants}
                    onChange={e => setField('nb_enfants', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bébés (0-2 ans)</label>
                  <input type="number" min="0" max="10"
                    value={form.nb_bebes}
                    onChange={e => setField('nb_bebes', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Nuits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre de nuits</label>
                  <input type="number" min="1" max="30"
                    value={form.nombre_nuits}
                    onChange={e => setField('nombre_nuits', e.target.value)}
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
                    value={form.repas}
                    onChange={e => setField('repas', e.target.value as RepasType)}
                    className={`${selectCls} h-full`}
                  >
                    <option value="complet">Pension complète</option>
                    <option value="demi">Demi-pension</option>
                    <option value="sans">Sans repas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Prix ──────────────────────────────────────────── */}
            {result && result.chambres.length > 0 && (
              <div className="bg-[#003090] text-white rounded-2xl p-5 space-y-3">
                <p className="text-[#fdbe11] text-xs font-semibold uppercase tracking-wide">Prix du pack</p>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <i className="ti ti-bed" aria-hidden="true" />
                  <span>{formatChambres(result.chambres)}</span>
                </div>
                <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold font-mono">{fmt(result.pvTotal)}</span>
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

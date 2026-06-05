'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Offre, TypePublic } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_PUBLIC_CFG: Record<TypePublic, { label: string; badge: string }> = {
  enfant:  { label: 'Enfant',  badge: 'bg-green-100  text-green-700  border-green-200'  },
  adulte:  { label: 'Adulte',  badge: 'bg-blue-100   text-blue-700   border-blue-200'   },
  famille: { label: 'Famille', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
}

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

// ── Shield SVG ────────────────────────────────────────────────────────────────

function Shield() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" aria-hidden="true">
      <path
        d="M18 2L4 8v12c0 9 6.2 17.4 14 20 7.8-2.6 14-11 14-20V8L18 2z"
        fill="#003090"
        stroke="#fdbe11"
        strokeWidth="2"
      />
      <path
        d="M11 20l5 5 9-9"
        stroke="#fdbe11"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Offer card ────────────────────────────────────────────────────────────────

function OfferCard({ offre }: { offre: Offre }) {
  const cfg = TYPE_PUBLIC_CFG[offre.type_public]
  const pct = offre.places_total > 0
    ? Math.round((offre.places_restantes / offre.places_total) * 100)
    : 0
  const complet = offre.places_restantes === 0

  return (
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5 hover:shadow-lg ${complet ? 'opacity-60' : ''}`}>
      {/* Color top bar */}
      <div className="h-1.5 bg-[#003090]" />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge} mb-2`}>
              {cfg.label}
            </span>
            <h3 className="font-bold text-gray-900 text-base leading-snug">{offre.nom}</h3>
            {offre.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offre.description}</p>
            )}
          </div>
          <span className="shrink-0 text-xs font-medium bg-[#f0f2f8] text-[#003090] px-2 py-1 rounded-lg">
            {offre.type_chambre}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <i className="ti ti-moon text-[#003090]" aria-hidden="true" />
            {offre.nombre_nuits} nuit{offre.nombre_nuits > 1 ? 's' : ''} / {offre.nombre_jours} j
          </div>
          <div className="flex items-center gap-1.5">
            <i className={`ti ${offre.transport_inclus ? 'ti-bus text-green-600' : 'ti-bus text-gray-400'}`} aria-hidden="true" />
            {offre.transport_inclus ? 'Transport inclus' : offre.transport_optionnel ? 'Transport optionnel' : 'Sans transport'}
          </div>
          <div className="flex items-center gap-1.5">
            <i className="ti ti-soup text-[#003090]" aria-hidden="true" />
            {offre.repas_type === 'complet' ? 'Pension complète'
              : offre.repas_type === 'demi' ? 'Demi-pension'
              : 'Sans repas'}
          </div>
        </div>

        {/* Places */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{complet ? 'Complet' : `${offre.places_restantes} place${offre.places_restantes > 1 ? 's' : ''} disponible${offre.places_restantes > 1 ? 's' : ''}`}</span>
            <span>{offre.places_total} total</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct < 20 ? 'bg-red-400' : pct < 60 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Prix</p>
            <p className="text-xl font-bold text-[#003090] font-mono">{fmt(offre.prix_vente)}</p>
          </div>
          {complet ? (
            <span className="px-4 py-2 bg-gray-200 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed">
              Complet
            </span>
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
  const [offres, setOffres] = useState<Offre[]>([])
  const [loading, setLoading] = useState(true)

  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'
  const lienGroupe   = process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP ?? ''

  useEffect(() => {
    fetch('/api/offres')
      .then(r => r.json())
      .then((data: Offre[]) => setOffres(data.filter(o => o.actif)))
      .finally(() => setLoading(false))
  }, [])

  const offresAdulte  = offres.filter(o => o.type_public === 'adulte')
  const offresEnfant  = offres.filter(o => o.type_public === 'enfant')
  const offresFamille = offres.filter(o => o.type_public === 'famille')
  const hasFamille    = offresAdulte.length > 0 && offresEnfant.length > 0

  return (
    <div className="min-h-screen bg-[#f0f2f8]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b-[3px] border-[#fdbe11] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield />
            <div>
              <p className="font-bold text-[#003090] text-base leading-tight">Al Hazm Academy</p>
              <p className="text-xs text-gray-500 leading-tight" dir="rtl">أكاديمية الحزم</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#003090] text-sm">{nomEvenement}</p>
            {lienGroupe && (
              <a
                href={lienGroupe}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#25D366] hover:underline flex items-center justify-end gap-1 mt-0.5"
              >
                <i className="ti ti-brand-whatsapp" aria-hidden="true" />
                Rejoindre le groupe
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="bg-[#003090] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{nomEvenement}</h1>
          <p className="text-[#fdbe11] text-lg font-medium mb-2">Al Hazm Academy</p>
          <p className="text-white/80 text-sm max-w-xl mx-auto">
            Inscrivez votre enfant ou participez vous-même à une expérience sportive et éducative exceptionnelle.
            Choisissez votre formule et réservez votre place dès maintenant.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {loading && (
          <div className="flex justify-center py-16 text-[#003090]">
            <i className="ti ti-loader-2 animate-spin text-4xl" aria-hidden="true" />
          </div>
        )}

        {/* ── Offres adultes ────────────────────────────────────── */}
        {!loading && offresAdulte.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#003090] mb-4 flex items-center gap-2">
              <i className="ti ti-user" aria-hidden="true" />
              Formules Adultes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offresAdulte.map(o => <OfferCard key={o.id} offre={o} />)}
            </div>
          </section>
        )}

        {/* ── Offres enfants ────────────────────────────────────── */}
        {!loading && offresEnfant.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#003090] mb-4 flex items-center gap-2">
              <i className="ti ti-star" aria-hidden="true" />
              Formules Enfants
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offresEnfant.map(o => <OfferCard key={o.id} offre={o} />)}
            </div>
          </section>
        )}

        {/* ── Offres famille directes ───────────────────────────── */}
        {!loading && offresFamille.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#003090] mb-4 flex items-center gap-2">
              <i className="ti ti-users" aria-hidden="true" />
              Formules Famille
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offresFamille.map(o => <OfferCard key={o.id} offre={o} />)}
            </div>
          </section>
        )}

        {/* ── Pack Famille CTA ──────────────────────────────────── */}
        {!loading && hasFamille && (
          <section className="bg-[#003090] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <i className="ti ti-heart" aria-hidden="true" />
                Pack Famille personnalisé
              </h2>
              <p className="text-white/80 text-sm">
                Composez votre pack famille avec adultes et enfants. Tarification dédiée.
              </p>
            </div>
            <Link
              href="/famille"
              className="shrink-0 px-5 py-2.5 bg-[#fdbe11] text-[#003090] font-bold rounded-xl hover:bg-yellow-300 transition-colors whitespace-nowrap"
            >
              Créer mon pack famille
            </Link>
          </section>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {!loading && offres.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <i className="ti ti-ticket-off text-5xl mb-3 block" aria-hidden="true" />
            <p className="font-medium">Aucune formule disponible pour le moment.</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        )}

      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white mt-10 py-6 px-4 text-center text-xs text-gray-400">
        <p>© 2026 Al Hazm Academy · أكاديمية الحزم</p>
        {lienGroupe && (
          <a
            href={lienGroupe}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#25D366] hover:underline mt-1"
          >
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            Rejoindre le groupe WhatsApp
          </a>
        )}
      </footer>
    </div>
  )
}

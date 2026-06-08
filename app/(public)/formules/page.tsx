'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

export default function FormulesPage() {
  const router  = useRouter()
  const [offres, setOffres]   = useState<Offre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offres')
      .then(r => r.json())
      .then((data: Offre[]) => setOffres((data ?? []).filter(o => o.actif)))
      .finally(() => setLoading(false))
  }, [])

  const offresEnfant  = offres.filter(o => o.type_public === 'enfant')
  const offresAdulte  = offres.filter(o => o.type_public === 'adulte')
  const offresFamille = offres.filter(o => o.type_public === 'famille')

  return (
    <div className="min-h-screen bg-[#f0f2f8]" style={{ paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '3px solid #fdbe11' }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#666666',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Retour
          </Link>
          <span style={{ color: '#e0e0e0' }}>|</span>
          <Image
            src="/images/logo-color.png"
            alt="Al Hazm Football Academy"
            width={48}
            height={48}
            style={{ objectFit: 'contain' }}
          />
          <h1 style={{ color: '#003090', fontWeight: 800, fontSize: 18, margin: 0 }}>
            Nos offres
          </h1>
        </div>
      </header>

      {/* ── Offres ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 120px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#003090' }}>
            <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 40 }} aria-hidden="true" />
          </div>
        ) : offres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999999' }}>
            <i className="ti ti-ticket-off" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} aria-hidden="true" />
            <p style={{ fontWeight: 600 }}>Aucune formule disponible pour le moment.</p>
            <p style={{ fontSize: 13 }}>Revenez bientôt !</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
          }}>
            {offresEnfant.map(o  => <OfferCard key={o.id} offre={o} />)}
            {offresAdulte.map(o  => <OfferCard key={o.id} offre={o} />)}
            {offresFamille.map(o => <OfferCard key={o.id} offre={o} />)}
          </div>
        )}
      </div>

      {/* ── Barre sticky ───────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#003090',
        borderTop: '3px solid #fdbe11',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        zIndex: 100,
      }}>
        <button
          type="button"
          onClick={() => router.push('/formules')}
          style={{
            flex: 1,
            background: '#fdbe11',
            color: '#003090',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <i className="ti ti-ticket" aria-hidden="true" />
          Voir les offres
        </button>
        <button
          type="button"
          onClick={() => router.push('/famille')}
          style={{
            flex: 1,
            background: '#ffffff',
            color: '#fdbe11',
            border: '2px solid #fdbe11',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <i className="ti ti-users" aria-hidden="true" />
          Réservation famille
        </button>
      </div>
    </div>
  )
}

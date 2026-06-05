'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ── Content (uses useSearchParams → needs Suspense boundary) ──────────────────

function MerciContent() {
  const searchParams = useSearchParams()
  const ref  = searchParams.get('ref')  ?? ''
  const nom  = searchParams.get('nom')  ?? ''

  const lienGroupe   = process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP ?? ''
  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col">

      {/* ── Simple header ──────────────────────────────────────── */}
      <header className="bg-white border-b-[3px] border-[#fdbe11]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-center">
          <span className="text-sm font-medium text-[#003090]">{nomEvenement}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md max-w-md w-full p-8 text-center space-y-5">

          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ti ti-circle-check text-green-600 text-4xl" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {nom ? `Merci ${nom} !` : 'Réservation reçue !'}
            </h1>
            <p className="text-gray-500 text-sm">
              Votre demande de réservation a bien été transmise.
            </p>
          </div>

          {/* Reference */}
          {ref && (
            <div className="bg-[#f0f2f8] rounded-xl px-5 py-3">
              <p className="text-xs text-gray-400 mb-1">Référence de réservation</p>
              <p className="text-2xl font-bold text-[#003090] font-mono tracking-widest">{ref}</p>
              <p className="text-xs text-gray-400 mt-1">Conservez cette référence pour le suivi</p>
            </div>
          )}

          {/* Next steps */}
          <div className="bg-[#003090] rounded-xl p-4 text-left space-y-2">
            <p className="text-[#fdbe11] text-xs font-semibold uppercase tracking-wide mb-2">Prochaines étapes</p>
            {[
              { icon: 'ti-clock',        text: 'Votre réservation est en attente de validation' },
              { icon: 'ti-phone',        text: 'Notre équipe vous contactera par téléphone' },
              { icon: 'ti-check-circle', text: 'Vous recevrez une confirmation finale' },
            ].map(s => (
              <div key={s.icon} className="flex items-center gap-2.5 text-sm text-white/90">
                <i className={`ti ${s.icon} text-[#fdbe11] shrink-0`} aria-hidden="true" />
                {s.text}
              </div>
            ))}
          </div>

          {/* WhatsApp group CTA */}
          {lienGroupe && (
            <a
              href={lienGroupe}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#1fba58] transition-colors"
            >
              <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
              Rejoindre le groupe WhatsApp
            </a>
          )}

          {/* Back home */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <i className="ti ti-home" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-4xl text-[#003090]" aria-hidden="true" />
      </div>
    }>
      <MerciContent />
    </Suspense>
  )
}

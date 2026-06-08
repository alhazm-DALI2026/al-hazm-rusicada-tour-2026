'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  confirmes: {
    count:        number
    standard:     number
    famille:      number
    participants: number
    revenus:      number
    cdr:          number
    marge:        number
  }
  en_attente: {
    count:           number
    standard:        number
    famille:         number
    participants:    number
    revenus_estimes: number
  }
  staff: {
    count:      number
    cout_total: number
  }
  charges_fixes: {
    total:  number
    detail: { libelle: string; montant: number }[]
  }
  bilan: {
    revenus_confirmes: number
    cdr_total:         number
    marge_brute:       number
    charges_fixes:     number
    charges_staff:     number
    benefice_net:      number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function pct(part: number, total: number, decimals = 1) {
  if (!total) return '—'
  return (part / total * 100).toFixed(decimals) + ' %'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Bloc({
  icon, title, accent, children,
}: {
  icon: string; title: string; accent?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl shadow-sm p-5 ${accent ? 'bg-[#003090]' : 'bg-surface'}`}>
      <div className="flex items-center gap-2 mb-4">
        <i className={`ti ${icon} text-xl ${accent ? 'text-[#fdbe11]' : 'text-[#003090] dark:text-[#fdbe11]'}`} aria-hidden="true" />
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-[#fdbe11]' : 'text-gray-500'}`}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Row({
  label, value, sub, accent, highlight, sign, color,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  highlight?: boolean
  sign?: '+' | '-'
  color?: string
}) {
  const labelCls = accent
    ? 'text-white/70'
    : highlight
      ? 'font-bold text-gray-900 dark:text-white'
      : 'text-gray-600 dark:text-gray-400'

  const valueCls = color ?? (accent
    ? 'text-white font-mono'
    : highlight
      ? 'font-mono font-bold text-base'
      : 'font-mono font-medium text-gray-800 dark:text-gray-200')

  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? 'border-t-2 border-gray-200 dark:border-white/20 mt-1 pt-3' : 'border-b border-gray-100 dark:border-white/10'}`}>
      <span className={`text-sm ${labelCls}`}>{label}</span>
      <span className={`text-sm ${valueCls}`}>
        {sign === '-' ? '− ' : sign === '+' ? '+ ' : ''}{value}
        {sub && <span className="ml-1.5 text-xs opacity-60">{sub}</span>}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const nomEvenement = process.env.NEXT_PUBLIC_NOM_EVENEMENT ?? 'Rusicada Park 2026'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/dashboard')
      if (!r.ok) throw new Error('Erreur serveur')
      setData(await r.json())
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">{nomEvenement}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Mis à jour {lastRefresh.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <i className={`ti ti-refresh text-base ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          <i className="ti ti-alert-circle text-lg" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────── */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-surface rounded-xl p-5 shadow-sm animate-pulse h-40" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ── Ligne 1 : 3 blocs ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Bloc 1 — Confirmées */}
            <Bloc icon="ti-calendar-check" title="✅ Confirmées" accent>
              <p className="text-4xl font-bold font-mono text-white mb-3">
                {data.confirmes.count}
                <span className="text-base font-normal text-white/60 ml-2">réservations</span>
              </p>
              <div className="space-y-1 border-t border-white/20 pt-3">
                <Row label="Standard" value={String(data.confirmes.standard)} accent />
                <Row label="Famille"  value={String(data.confirmes.famille)}  accent />
                <Row label="Participants" value={`${data.confirmes.participants} pers.`} accent />
                <Row label="Revenus PV"   value={fmt(data.confirmes.revenus)} accent />
                <Row label="CDR"          value={fmt(data.confirmes.cdr)}     accent />
                <Row
                  label="Marge"
                  value={fmt(data.confirmes.marge)}
                  sub={`(${pct(data.confirmes.marge, data.confirmes.revenus)})`}
                  accent
                />
              </div>
            </Bloc>

            {/* Bloc 2 — En attente */}
            <Bloc icon="ti-clock" title="⏳ En attente">
              <p className="text-4xl font-bold font-mono text-[#003090] dark:text-white mb-3">
                {data.en_attente.count}
                <span className="text-base font-normal text-gray-400 ml-2">réservations</span>
              </p>
              <div className="space-y-1 border-t border-gray-100 dark:border-white/10 pt-3">
                <Row label="Standard"            value={String(data.en_attente.standard)} />
                <Row label="Famille"             value={String(data.en_attente.famille)} />
                <Row label="Participants estimés" value={`${data.en_attente.participants} pers.`} />
                <Row label="Revenus estimés"      value={fmt(data.en_attente.revenus_estimes)} />
                <Row
                  label="Taux confirmation"
                  value={pct(
                    data.confirmes.count,
                    data.confirmes.count + data.en_attente.count,
                  )}
                />
              </div>
            </Bloc>

            {/* Bloc 3 — Staff */}
            <Bloc icon="ti-users" title="👥 Staff">
              <p className="text-4xl font-bold font-mono text-[#003090] dark:text-white mb-3">
                {data.staff.count}
                <span className="text-base font-normal text-gray-400 ml-2">membres</span>
              </p>
              <div className="border-t border-gray-100 dark:border-white/10 pt-3">
                <Row label="Coût total" value={fmt(data.staff.cout_total)} />
              </div>

              {/* ── Capacité d'encadrement ── */}
              {(() => {
                const coutMoyenStaff = data.staff.count > 0
                  ? data.staff.cout_total / data.staff.count
                  : 0
                const margeDisponible =
                  data.bilan.marge_brute - data.bilan.charges_fixes
                const staffMaxSupportable = coutMoyenStaff > 0
                  ? Math.floor(margeDisponible / coutMoyenStaff)
                  : 0
                const staffSupplementaire = staffMaxSupportable - data.staff.count

                const placesValeur = staffSupplementaire > 0
                  ? `+ ${staffSupplementaire} membres`
                  : staffSupplementaire === 0
                    ? 'Capacité atteinte'
                    : `${staffSupplementaire} (dépassé !)`
                const placesCouleur = staffSupplementaire > 0
                  ? '#22c55e'
                  : staffSupplementaire === 0
                    ? '#fdbe11'
                    : '#ef4444'

                return (
                  <div style={{
                    background: 'rgba(253,190,17,0.08)',
                    border: '1px solid rgba(253,190,17,0.2)',
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 12,
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)', marginBottom: 10,
                      letterSpacing: '0.05em',
                    }}>
                      📊 Capacité d&apos;encadrement
                    </div>

                    {[
                      { label: 'Coût moyen / membre',   value: fmt(coutMoyenStaff),                         color: undefined                         },
                      { label: 'Staff max supportable',  value: `${staffMaxSupportable} membres`,             color: '#fdbe11'                         },
                      { label: 'Places disponibles',     value: placesValeur,                                 color: placesCouleur                     },
                    ].map(row => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingBottom: 6, marginBottom: 6,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                        <span style={{
                          fontSize: 12, fontWeight: row.color ? 700 : 500, fontFamily: 'monospace',
                          color: row.color ?? 'rgba(255,255,255,0.85)',
                        }}>
                          {row.value}
                        </span>
                      </div>
                    ))}

                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      Calculé sur : marge brute − charges fixes<br />
                      ÷ coût moyen par membre staff
                    </p>
                  </div>
                )
              })()}
            </Bloc>
          </div>

          {/* ── Ligne 2 : 2 blocs ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Bloc 4 — Charges fixes */}
            <Bloc icon="ti-building" title="🏢 Charges fixes">
              {data.charges_fixes.detail.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucune charge de type <code className="font-mono">fixe_global</code> dans le moteur.
                </p>
              ) : (
                <div className="space-y-1 mb-4">
                  {data.charges_fixes.detail.map((c, i) => (
                    <Row key={i} label={c.libelle} value={fmt(c.montant)} />
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-3">
                <Row label="Total charges fixes" value={fmt(data.charges_fixes.total)} />

                {/* Taux couverture */}
                {data.charges_fixes.total > 0 && (() => {
                  const taux = data.bilan.marge_brute / data.charges_fixes.total * 100
                  const green = taux >= 100
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Taux de couverture (marge / charges)</span>
                        <span className={`font-bold font-mono ${green ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {taux.toFixed(1)} %
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${green ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(taux, 100)}%` }}
                        />
                      </div>
                      {!green && (
                        <p className="text-xs text-red-500 mt-1">
                          Manque {fmt(data.charges_fixes.total - data.bilan.marge_brute)} de marge pour couvrir les charges.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            </Bloc>

            {/* Bloc 5 — Bilan académie */}
            <Bloc icon="ti-chart-bar" title="💰 Bilan académie">
              <div className="space-y-0">
                <Row label="Revenus confirmés"  value={fmt(data.bilan.revenus_confirmes)} sign="+" />
                <Row label="CDR inscrits"       value={fmt(data.bilan.cdr_total)}         sign="-" />
                <Row label="Charges staff"      value={fmt(data.bilan.charges_staff)}     sign="-" />
                <Row label="Charges fixes"      value={fmt(data.bilan.charges_fixes)}     sign="-" />
                <Row
                  label="Bénéfice net"
                  value={fmt(Math.abs(data.bilan.benefice_net))}
                  highlight
                  sign={data.bilan.benefice_net >= 0 ? '+' : '-'}
                  color={
                    data.bilan.benefice_net >= 0
                      ? 'font-mono font-bold text-base text-green-600 dark:text-green-400'
                      : 'font-mono font-bold text-base text-red-500'
                  }
                />
              </div>

              {/* Gauge répartition */}
              {data.bilan.revenus_confirmes > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Répartition des coûts</span>
                    <span>
                      {pct(
                        data.bilan.cdr_total + data.bilan.charges_staff + data.bilan.charges_fixes,
                        data.bilan.revenus_confirmes,
                      )} de coûts
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#003090] transition-all"
                      style={{ width: `${Math.min((data.bilan.cdr_total / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                      title={`CDR: ${fmt(data.bilan.cdr_total)}`}
                    />
                    <div
                      className="h-full bg-[#fdbe11] transition-all"
                      style={{ width: `${Math.min((data.bilan.charges_staff / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                      title={`Staff: ${fmt(data.bilan.charges_staff)}`}
                    />
                    <div
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${Math.min((data.bilan.charges_fixes / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                      title={`Fixes: ${fmt(data.bilan.charges_fixes)}`}
                    />
                    {data.bilan.benefice_net > 0 && (
                      <div
                        className="h-full bg-green-400 transition-all"
                        style={{ width: `${Math.min((data.bilan.benefice_net / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                        title={`Bénéfice: ${fmt(data.bilan.benefice_net)}`}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      { color: 'bg-[#003090]', label: 'CDR' },
                      { color: 'bg-[#fdbe11]', label: 'Staff' },
                      { color: 'bg-orange-400', label: 'Charges fixes' },
                      { color: 'bg-green-400',  label: 'Bénéfice' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Bloc>
          </div>

          {/* ── Quick links ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/reservations', icon: 'ti-calendar-event', label: 'Réservations',   badge: data.en_attente.count > 0 ? String(data.en_attente.count) : '' },
              { href: '/offres',       icon: 'ti-ticket',         label: 'Offres',         badge: '' },
              { href: '/moteur',       icon: 'ti-calculator',     label: 'Moteur coûts',   badge: '' },
              { href: '/staff',        icon: 'ti-users',          label: 'Staff',          badge: data.staff.count > 0 ? String(data.staff.count) : '' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow group"
              >
                <i className={`ti ${link.icon} text-xl text-[#003090] dark:text-[#fdbe11]`} aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#003090] dark:group-hover:text-white transition-colors">
                  {link.label}
                </span>
                {link.badge && (
                  <span className="ml-auto text-xs font-bold bg-[#fdbe11] text-[#003090] rounded-full w-5 h-5 flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

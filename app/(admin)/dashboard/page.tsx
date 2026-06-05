'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  confirmes: {
    count:        number
    participants: number
    revenus:      number
    cdr:          number
    marge:        number
  }
  en_attente: {
    count:           number
    participants:    number
    revenus_estimes: number
  }
  staff: {
    count:      number
    cout_total: number
  }
  bilan: {
    revenus_confirmes: number
    cdr_total:         number
    charges_staff:     number
    benefice_net:      number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function pct(part: number, total: number) {
  if (!total) return '—'
  return (part / total * 100).toFixed(1) + ' %'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent, color,
}: {
  icon: string; label: string; value: string | number
  sub?: { label: string; value: string }[]
  accent?: boolean; color?: string
}) {
  const bg = accent ? 'bg-[#003090]' : 'bg-surface'
  const textMain = accent ? 'text-white' : 'text-[#003090] dark:text-white'
  const textLabel = accent ? 'text-[#fdbe11]' : 'text-gray-500'
  const iconCls = color ?? (accent ? 'text-[#fdbe11]' : 'text-[#003090] dark:text-[#fdbe11]')

  return (
    <div className={`rounded-xl p-5 shadow-sm ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <i className={`ti ${icon} text-xl ${iconCls}`} aria-hidden="true" />
        <span className={`text-xs font-semibold uppercase tracking-wide ${textLabel}`}>{label}</span>
      </div>
      <p className={`text-3xl font-bold font-mono mb-3 ${textMain}`}>{value}</p>
      {sub && sub.length > 0 && (
        <div className="space-y-1.5 border-t border-white/20 pt-3">
          {sub.map(s => (
            <div key={s.label} className="flex justify-between text-xs">
              <span className={accent ? 'text-white/70' : 'text-gray-500'}>{s.label}</span>
              <span className={`font-mono font-medium ${accent ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BilanRow({
  label, value, sign, highlight,
}: {
  label: string; value: number; sign?: '+' | '-'; highlight?: boolean
}) {
  const isPos = value >= 0
  const color = highlight
    ? (isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500')
    : 'text-gray-800 dark:text-gray-200'

  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? 'border-t-2 border-gray-200 dark:border-white/20 mt-1' : 'border-b border-gray-100 dark:border-white/10'}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
      <span className={`font-mono font-bold text-base ${color}`}>
        {sign === '-' ? '−' : sign === '+' ? '+' : ''}{Math.abs(value).toLocaleString('fr-DZ')} DA
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

  const margeRatio = data
    ? pct(data.confirmes.marge, data.confirmes.revenus)
    : '—'

  const txRemplissage = data && (data.confirmes.count + data.en_attente.count) > 0
    ? pct(data.confirmes.count, data.confirmes.count + data.en_attente.count)
    : '—'

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
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl p-5 shadow-sm animate-pulse h-40" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ── KPI row ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon="ti-calendar-check"
              label="Réservations confirmées"
              value={data.confirmes.count}
              accent
              sub={[
                { label: 'Participants',  value: String(data.confirmes.participants) },
                { label: 'Revenus',       value: fmt(data.confirmes.revenus) },
                { label: 'Marge',         value: `${fmt(data.confirmes.marge)} (${margeRatio})` },
              ]}
            />
            <KpiCard
              icon="ti-clock"
              label="En attente"
              value={data.en_attente.count}
              sub={[
                { label: 'Participants',      value: String(data.en_attente.participants) },
                { label: 'Revenus estimés',   value: fmt(data.en_attente.revenus_estimes) },
                { label: 'Taux confirmation', value: txRemplissage },
              ]}
            />
            <KpiCard
              icon="ti-users"
              label="Staff"
              value={data.staff.count}
              sub={[
                { label: 'Charge totale', value: fmt(data.staff.cout_total) },
              ]}
            />
          </div>

          {/* ── Bilan financier ────────────────────────────────────── */}
          <div className="bg-surface rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <i className="ti ti-chart-bar text-xl text-[#003090] dark:text-[#fdbe11]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#003090] dark:text-white">Bilan financier</h2>
              <span className="text-xs text-gray-400 ml-2">(réservations confirmées uniquement)</span>
            </div>

            <div className="max-w-lg">
              <BilanRow label="Revenus confirmés"   value={data.bilan.revenus_confirmes} sign="+" />
              <BilanRow label="CDR réservations"    value={data.bilan.cdr_total}         sign="-" />
              <BilanRow label="Charges staff"       value={data.bilan.charges_staff}     sign="-" />
              <BilanRow
                label="Bénéfice net"
                value={data.bilan.benefice_net}
                highlight
              />
            </div>

            {/* Gauge */}
            {data.bilan.revenus_confirmes > 0 && (
              <div className="mt-5 max-w-lg">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Répartition des coûts</span>
                  <span>{pct(data.bilan.cdr_total + data.bilan.charges_staff, data.bilan.revenus_confirmes)} de coûts</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                  {/* CDR block */}
                  <div
                    className="h-full bg-[#003090] transition-all"
                    style={{ width: `${Math.min((data.bilan.cdr_total / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                    title={`CDR: ${fmt(data.bilan.cdr_total)}`}
                  />
                  {/* Staff block */}
                  <div
                    className="h-full bg-[#fdbe11] transition-all"
                    style={{ width: `${Math.min((data.bilan.charges_staff / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                    title={`Staff: ${fmt(data.bilan.charges_staff)}`}
                  />
                  {/* Bénéfice block */}
                  {data.bilan.benefice_net > 0 && (
                    <div
                      className="h-full bg-green-400 transition-all"
                      style={{ width: `${Math.min((data.bilan.benefice_net / data.bilan.revenus_confirmes) * 100, 100)}%` }}
                      title={`Bénéfice: ${fmt(data.bilan.benefice_net)}`}
                    />
                  )}
                </div>
                {/* Legend */}
                <div className="flex gap-4 mt-2">
                  {[
                    { color: 'bg-[#003090]', label: 'CDR réservations' },
                    { color: 'bg-[#fdbe11]', label: 'Charges staff' },
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

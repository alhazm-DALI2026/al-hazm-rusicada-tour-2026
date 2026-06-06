'use client'

import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/Toast'
import type { Parametres } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  nom_evenement:        string
  date_depart:          string
  date_retour:          string
  whatsapp_numero:      string
  callmebot_apikey:     string
  lien_groupe_whatsapp: string
  taux_demi_pension:    string
  taux_marge_famille:   string
  cdr_single:           string
  cdr_double:           string
  cdr_triple:           string
  cdr_quadruple:        string
  pv_single:            string
  pv_double:            string
  pv_triple:            string
  pv_quadruple:         string
  cdr_repas_complet:    string
  pv_repas_complet:     string
  cdr_transport_adulte: string
  cdr_transport_enfant: string
  cdr_transport_bebe:   string
  pv_transport_adulte:  string
  pv_transport_enfant:  string
  pv_transport_bebe:    string
}

function toForm(p: Parametres): FormState {
  return {
    nom_evenement:        p.nom_evenement        ?? '',
    date_depart:          p.date_depart          ?? '',
    date_retour:          p.date_retour          ?? '',
    whatsapp_numero:      p.whatsapp_numero      ?? '',
    callmebot_apikey:     p.callmebot_apikey     ?? '',
    lien_groupe_whatsapp: p.lien_groupe_whatsapp ?? '',
    taux_demi_pension:    String(p.taux_demi_pension   ?? 35),
    taux_marge_famille:   String(p.taux_marge_famille  ?? 23),
    cdr_single:           String(p.cdr_single           ?? 8000),
    cdr_double:           String(p.cdr_double           ?? 9000),
    cdr_triple:           String(p.cdr_triple           ?? 6000),
    cdr_quadruple:        String(p.cdr_quadruple        ?? 11000),
    pv_single:            String(p.pv_single            ?? 10000),
    pv_double:            String(p.pv_double            ?? 11500),
    pv_triple:            String(p.pv_triple            ?? 7500),
    pv_quadruple:         String(p.pv_quadruple         ?? 14000),
    cdr_repas_complet:    String(p.cdr_repas_complet    ?? 2700),
    pv_repas_complet:     String(p.pv_repas_complet     ?? 3500),
    cdr_transport_adulte: String(p.cdr_transport_adulte ?? 7000),
    cdr_transport_enfant: String(p.cdr_transport_enfant ?? 7000),
    cdr_transport_bebe:   String(p.cdr_transport_bebe   ?? 0),
    pv_transport_adulte:  String(p.pv_transport_adulte  ?? 8500),
    pv_transport_enfant:  String(p.pv_transport_enfant  ?? 8500),
    pv_transport_bebe:    String(p.pv_transport_bebe    ?? 0),
  }
}

const EMPTY: FormState = {
  nom_evenement: '', date_depart: '', date_retour: '',
  whatsapp_numero: '', callmebot_apikey: '', lien_groupe_whatsapp: '',
  taux_demi_pension: '35', taux_marge_famille: '23',
  cdr_single: '8000',  cdr_double: '9000',  cdr_triple: '6000',  cdr_quadruple: '11000',
  pv_single:  '10000', pv_double:  '11500', pv_triple:  '7500',  pv_quadruple:  '14000',
  cdr_repas_complet: '2700', pv_repas_complet: '3500',
  cdr_transport_adulte: '7000', cdr_transport_enfant: '7000', cdr_transport_bebe: '0',
  pv_transport_adulte:  '8500', pv_transport_enfant:  '8500', pv_transport_bebe:  '0',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(s: string) { return parseFloat(s) || 0 }

function MargeCell({ cdr, pv }: { cdr: string; pv: string }) {
  const m = n(pv) - n(cdr)
  return (
    <span className={m >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
      {m.toLocaleString('fr-DZ')} DA
    </span>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <i className={`ti ${icon} text-lg text-[#003090] dark:text-[#fdbe11]`} aria-hidden="true" />
        <h2 className="text-base font-bold text-[#003090] dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── TarifTable ────────────────────────────────────────────────────────────────

interface TarifRow {
  label:    string
  cdrKey:   keyof FormState | null
  pvKey:    keyof FormState | null
  cdrAuto?: string
  pvAuto?:  string
  info?:    string
}

function TarifTable({
  title, rows, form, onChange, note,
}: {
  title:    string
  rows:     TarifRow[]
  form:     FormState
  onChange: <K extends keyof FormState>(key: K, val: string) => void
  note?:    string
}) {
  const hasInfo  = rows.some(r => r.info)
  const inputCls = 'w-full px-2 py-1.5 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] text-right font-mono'

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#003090] dark:text-[#fdbe11] mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f0f2f8] dark:bg-white/5 text-left">
              <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-36">Type</th>
              <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-36">CDR (DA)</th>
              <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-36">PV (DA)</th>
              <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Marge</th>
              {hasInfo && <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Info</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {rows.map(row => {
              const cdrVal = row.cdrKey ? form[row.cdrKey] : (row.cdrAuto ?? '0')
              const pvVal  = row.pvKey  ? form[row.pvKey]  : (row.pvAuto  ?? '0')
              return (
                <tr key={row.label} className="hover:bg-[#f8f9fd] dark:hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                  <td className="px-3 py-2">
                    {row.cdrKey ? (
                      <input
                        type="number" min="0" step="100"
                        value={form[row.cdrKey]}
                        onChange={e => onChange(row.cdrKey!, e.target.value)}
                        className={inputCls}
                      />
                    ) : (
                      <span className="px-2 py-1.5 text-gray-400 font-mono text-sm">{row.cdrAuto ?? '0'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.pvKey ? (
                      <input
                        type="number" min="0" step="100"
                        value={form[row.pvKey]}
                        onChange={e => onChange(row.pvKey!, e.target.value)}
                        className={inputCls}
                      />
                    ) : (
                      <span className="px-2 py-1.5 text-gray-400 font-mono text-sm">{row.pvAuto ?? '0'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-sm">
                    <MargeCell cdr={cdrVal} pv={pvVal} />
                  </td>
                  {hasInfo && (
                    <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {row.info ?? ''}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{note}</p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParametresPage() {
  const [form, setForm]           = useState<FormState>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [testing, setTesting]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [showKey, setShowKey]     = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'famille'>('general')

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // ── Load ────────────────────────────────────────────────────
  const fetchParams = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/parametres')
      if (r.ok) {
        const p: Parametres = await r.json()
        setForm(toForm(p))
        setUpdatedAt(p.updated_at)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchParams() }, [fetchParams])

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      nom_evenement:        form.nom_evenement.trim(),
      date_depart:          form.date_depart   || null,
      date_retour:          form.date_retour   || null,
      whatsapp_numero:      form.whatsapp_numero.trim()      || null,
      callmebot_apikey:     form.callmebot_apikey.trim()     || null,
      lien_groupe_whatsapp: form.lien_groupe_whatsapp.trim() || null,
      taux_demi_pension:    n(form.taux_demi_pension)  || 35,
      taux_marge_famille:   n(form.taux_marge_famille) || 23,
      cdr_single:           n(form.cdr_single),
      cdr_double:           n(form.cdr_double),
      cdr_triple:           n(form.cdr_triple),
      cdr_quadruple:        n(form.cdr_quadruple),
      pv_single:            n(form.pv_single),
      pv_double:            n(form.pv_double),
      pv_triple:            n(form.pv_triple),
      pv_quadruple:         n(form.pv_quadruple),
      cdr_repas_complet:    n(form.cdr_repas_complet),
      pv_repas_complet:     n(form.pv_repas_complet),
      cdr_transport_adulte: n(form.cdr_transport_adulte),
      cdr_transport_enfant: n(form.cdr_transport_enfant),
      cdr_transport_bebe:   n(form.cdr_transport_bebe),
      pv_transport_adulte:  n(form.pv_transport_adulte),
      pv_transport_enfant:  n(form.pv_transport_enfant),
      pv_transport_bebe:    n(form.pv_transport_bebe),
    }
    const r = await fetch('/api/parametres', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (r.ok) {
      const p: Parametres = await r.json()
      setUpdatedAt(p.updated_at)
      notify('Paramètres sauvegardés.', 'success')
    } else {
      const err = await r.json().catch(() => ({})) as { error?: string }
      notify(err.error ?? 'Erreur lors de la sauvegarde.', 'error')
    }
    setSaving(false)
  }

  // ── Test WhatsApp ─────────────────────────────────────────────
  async function handleTestWhatsApp() {
    if (!form.whatsapp_numero || !form.callmebot_apikey) {
      notify('Renseigner le numéro WhatsApp et la clé CallMeBot.', 'error')
      return
    }
    setTesting(true)
    const r = await fetch('/api/notify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        numero:  form.whatsapp_numero,
        apikey:  form.callmebot_apikey,
        message: '✅ Test Al Hazm Academy — notification WhatsApp opérationnelle.',
      }),
    })
    if (r.ok) {
      notify('Message WhatsApp envoyé avec succès.', 'success')
    } else {
      notify('Échec de l\'envoi WhatsApp.', 'error')
    }
    setTesting(false)
  }

  // ── Copy link ─────────────────────────────────────────────────
  function copyLink() {
    if (!form.lien_groupe_whatsapp) return
    navigator.clipboard.writeText(form.lien_groupe_whatsapp)
    notify('Lien copié dans le presse-papiers.', 'success')
  }

  // ── Demi-pension auto values ──────────────────────────────────
  const tauxDP      = n(form.taux_demi_pension) / 100
  const cdrDemiAuto = (n(form.cdr_repas_complet) * (1 - tauxDP)).toFixed(0)
  const pvDemiAuto  = (n(form.pv_repas_complet)  * (1 - tauxDP)).toFixed(0)

  const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-xl p-6 shadow-sm animate-pulse h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Paramètres</h1>
          {updatedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Dernière modification : {new Date(updatedAt).toLocaleString('fr-DZ')}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#f0f2f8] dark:bg-white/5 rounded-xl p-1 w-fit">
        {([
          ['general',  'Paramètres généraux', 'ti-settings'],
          ['famille',  'Tarifs Famille',       'ti-users'],
        ] as const).map(([tab, label, icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-[#1a1d2e] text-[#003090] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <i className={`ti ${icon}`} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ══════════════════════════════════════════════════════
            ONGLET : PARAMÈTRES GÉNÉRAUX
            ══════════════════════════════════════════════════ */}
        {activeTab === 'general' && (
          <>
            {/* ── Informations événement ──────────────────────── */}
            <Section title="Événement" icon="ti-calendar-event">
              <div>
                <label className={labelCls}>
                  Nom de l&apos;événement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={form.nom_evenement}
                  onChange={e => setField('nom_evenement', e.target.value)}
                  placeholder="Ex: Rusica Park 2026"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date de départ</label>
                  <input
                    type="date"
                    value={form.date_depart}
                    onChange={e => setField('date_depart', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date de retour</label>
                  <input
                    type="date"
                    value={form.date_retour}
                    onChange={e => setField('date_retour', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </Section>

            {/* ── WhatsApp & CallMeBot ──────────────────────────── */}
            <Section title="Notifications WhatsApp" icon="ti-brand-whatsapp">
              <div>
                <label className={labelCls}>Numéro WhatsApp admin</label>
                <input
                  type="tel"
                  value={form.whatsapp_numero}
                  onChange={e => setField('whatsapp_numero', e.target.value)}
                  placeholder="+213XXXXXXXXX"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ce numéro doit avoir activé CallMeBot. Format international (+213…).
                </p>
              </div>

              <div>
                <label className={labelCls}>Clé API CallMeBot</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.callmebot_apikey}
                    onChange={e => setField('callmebot_apikey', e.target.value)}
                    placeholder="Votre clé CallMeBot"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
                  >
                    <i className={`ti ${showKey ? 'ti-eye-off' : 'ti-eye'} text-base`} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Obtenez votre clé sur{' '}
                  <span className="text-[#003090] dark:text-[#fdbe11]">callmebot.com</span>
                  {' '}en envoyant &quot;I allow callmebot to send me messages&quot; au +34 644 597 101.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testing || !form.whatsapp_numero || !form.callmebot_apikey}
                className="flex items-center gap-2 px-4 py-2 border border-[#003090] dark:border-[#fdbe11] text-[#003090] dark:text-[#fdbe11] rounded-lg text-sm font-medium hover:bg-[#e8ecf6] dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <i className={`ti ${testing ? 'ti-loader-2 animate-spin' : 'ti-send'}`} aria-hidden="true" />
                {testing ? 'Envoi en cours…' : 'Tester la notification'}
              </button>
            </Section>

            {/* ── Lien groupe WhatsApp ──────────────────────────── */}
            <Section title="Lien groupe WhatsApp" icon="ti-link">
              <div>
                <label className={labelCls}>Lien d&apos;invitation au groupe</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.lien_groupe_whatsapp}
                    onChange={e => setField('lien_groupe_whatsapp', e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    disabled={!form.lien_groupe_whatsapp}
                    className="px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
                    aria-label="Copier le lien"
                  >
                    <i className="ti ti-copy text-base" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Affiché sur la page de confirmation publique.
                </p>
              </div>
            </Section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            ONGLET : TARIFS FAMILLE
            ══════════════════════════════════════════════════ */}
        {activeTab === 'famille' && (
          <>
            {/* Bandeau info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              <i className="ti ti-info-circle text-lg shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Système réservation famille — indépendant des offres standard</p>
                <p className="mt-0.5">Ces tarifs sont utilisés UNIQUEMENT pour les réservations famille. Indépendants des offres standard.</p>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm p-6 space-y-6">

              {/* Chambres */}
              <TarifTable
                title="Chambres (par chambre / nuit)"
                form={form}
                onChange={setField}
                note={`Ex : si Double = ${Number(form.cdr_double).toLocaleString('fr-DZ')} DA/chambre → ${(Number(form.cdr_double) / 2).toLocaleString('fr-DZ')} DA/pers pour 2 personnes/nuit`}
                rows={[
                  { label: 'Single',    cdrKey: 'cdr_single',    pvKey: 'pv_single',    info: '1 pers. seule'   },
                  { label: 'Double',    cdrKey: 'cdr_double',    pvKey: 'pv_double',    info: '2 pers. / chambre' },
                  { label: 'Triple',    cdrKey: 'cdr_triple',    pvKey: 'pv_triple',    info: '3 pers. / chambre' },
                  { label: 'Quadruple', cdrKey: 'cdr_quadruple', pvKey: 'pv_quadruple', info: '4 pers. / chambre' },
                ]}
              />

              <div className="border-t border-gray-100 dark:border-white/10" />

              {/* Repas */}
              <TarifTable
                title="Repas (par personne / nuit)"
                form={form}
                onChange={setField}
                note={`Demi-pension = Pension complète × (1 − ${form.taux_demi_pension}%)`}
                rows={[
                  { label: 'Pension complète',                           cdrKey: 'cdr_repas_complet', pvKey: 'pv_repas_complet' },
                  { label: `Demi-pension (−${form.taux_demi_pension}%)`, cdrKey: null, pvKey: null, cdrAuto: cdrDemiAuto, pvAuto: pvDemiAuto },
                  { label: 'Sans repas',                                  cdrKey: null, pvKey: null, cdrAuto: '0',         pvAuto: '0'        },
                ]}
              />

              <div className="border-t border-gray-100 dark:border-white/10" />

              {/* Transport */}
              <TarifTable
                title="Transport (par personne — aller-retour)"
                form={form}
                onChange={setField}
                rows={[
                  { label: 'Adulte', cdrKey: 'cdr_transport_adulte', pvKey: 'pv_transport_adulte' },
                  { label: 'Enfant', cdrKey: 'cdr_transport_enfant', pvKey: 'pv_transport_enfant' },
                  { label: 'Bébé',   cdrKey: 'cdr_transport_bebe',   pvKey: 'pv_transport_bebe'   },
                ]}
              />

              <div className="border-t border-gray-100 dark:border-white/10" />

              {/* Taux */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#003090] dark:text-[#fdbe11] mb-3">Taux</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Taux demi-pension</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={form.taux_demi_pension}
                        onChange={e => setField('taux_demi_pension', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] font-mono text-right"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Demi = Complet × (1 − taux%)</p>
                  </div>
                  <div>
                    <label className={labelCls}>Taux marge famille</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={form.taux_marge_famille}
                        onChange={e => setField('taux_marge_famille', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] font-mono text-right"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── Save button (commun aux deux onglets) ──────────── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] disabled:opacity-60 transition-colors"
          >
            <i className={`ti ${saving ? 'ti-loader-2 animate-spin' : 'ti-device-floppy'}`} aria-hidden="true" />
            {saving ? 'Enregistrement…' : 'Sauvegarder les paramètres'}
          </button>
        </div>

      </form>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

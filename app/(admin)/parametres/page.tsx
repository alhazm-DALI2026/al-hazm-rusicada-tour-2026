'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Toast from '@/components/Toast'
import { calculerFamilleV2 } from '@/lib/calc'
import type { ChargeFamille } from '@/lib/calc'
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
}

function toForm(p: Parametres): FormState {
  return {
    nom_evenement:        p.nom_evenement        ?? '',
    date_depart:          p.date_depart          ?? '',
    date_retour:          p.date_retour          ?? '',
    whatsapp_numero:      p.whatsapp_numero      ?? '',
    callmebot_apikey:     p.callmebot_apikey     ?? '',
    lien_groupe_whatsapp: p.lien_groupe_whatsapp ?? '',
    taux_demi_pension:    String(p.taux_demi_pension  ?? 30),
    taux_marge_famille:   String(p.taux_marge_famille ?? 25),
  }
}

const EMPTY: FormState = {
  nom_evenement: '', date_depart: '', date_retour: '',
  whatsapp_numero: '', callmebot_apikey: '', lien_groupe_whatsapp: '',
  taux_demi_pension: '30', taux_marge_famille: '25',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(s: string) { return parseFloat(s) || 0 }

const TYPE_BADGE: Record<ChargeFamille['type'], { label: string; color: string; bg: string }> = {
  hebergement: { label: 'Hébergement', color: '#7eb8ff', bg: 'rgba(0,48,144,0.25)' },
  repas:       { label: 'Repas',       color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
  transport:   { label: 'Transport',   color: '#fdbe11', bg: 'rgba(253,190,17,0.12)' },
  custom:      { label: 'Autre',       color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
}

const UNITE_LABELS: Record<ChargeFamille['unite'], string> = {
  par_pers_nuit: 'par pers/nuit',
  par_pers_jour: 'par pers/jour',
  par_personne:  'par personne',
  fixe:          'fixe (forfait)',
}

function margeColor(p: number) {
  if (p >= 20) return 'text-green-500'
  if (p >= 10) return 'text-orange-400'
  return 'text-red-500'
}

function margeP(cdr: number, pv: number) {
  if (pv <= 0) return 0
  return Math.round(((pv - cdr) / pv) * 100)
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

// ── AddChargeModal ─────────────────────────────────────────────────────────────

interface AddForm {
  nom: string; type: ChargeFamille['type']
  cdr: string; pv: string; unite: ChargeFamille['unite']; actif: boolean
}

const ADD_EMPTY: AddForm = { nom: '', type: 'hebergement', cdr: '', pv: '', unite: 'par_pers_nuit', actif: true }

function AddChargeModal({ onAdd, onClose }: {
  onAdd(body: Omit<ChargeFamille, 'id'>): Promise<void>
  onClose(): void
}) {
  const [form, setForm]   = useState<AddForm>(ADD_EMPTY)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof AddForm>(k: K, v: AddForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const inputCls = 'w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'
  const selCls   = 'w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-[#0a0f2e] text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSaving(true)
    await onAdd({
      nom:   form.nom.trim(),
      type:  form.type,
      cdr:   n(form.cdr),
      pv:    n(form.pv),
      unite: form.unite,
      actif: form.actif,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Ajouter une charge</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <i className="ti ti-x text-xl" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nom <span className="text-red-500">*</span></label>
            <input type="text" required value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Assurance" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value as ChargeFamille['type'])} className={selCls}>
                <option value="hebergement">Hébergement</option>
                <option value="repas">Repas</option>
                <option value="transport">Transport</option>
                <option value="custom">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Unité</label>
              <select value={form.unite} onChange={e => set('unite', e.target.value as ChargeFamille['unite'])} className={selCls}>
                <option value="par_pers_nuit">par pers/nuit</option>
                <option value="par_pers_jour">par pers/jour</option>
                <option value="par_personne">par personne</option>
                <option value="fixe">fixe (forfait)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">CDR (DA)</label>
              <input type="number" min="0" step="1" value={form.cdr} onChange={e => set('cdr', e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">PV (DA)</label>
              <input type="number" min="0" step="1" value={form.pv} onChange={e => set('pv', e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>
          {(n(form.cdr) > 0 || n(form.pv) > 0) && (
            <div className="text-xs text-gray-400">
              Marge preview :
              <span className={`ml-2 font-bold ${margeColor(margeP(n(form.cdr), n(form.pv)))}`}>
                {margeP(n(form.cdr), n(form.pv))}%
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">Actif</label>
            <button type="button" role="switch" aria-checked={form.actif} onClick={() => set('actif', !form.actif)}
              className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${form.actif ? 'bg-[#003090]' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.actif ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/5">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              style={{ background: '#fdbe11', color: '#003090' }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60">
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParametresPage() {
  // ── Params state
  const [form, setForm]           = useState<FormState>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [testing, setTesting]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [showKey, setShowKey]     = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'famille'>('general')

  // ── Charges state
  const [charges, setCharges]         = useState<ChargeFamille[]>([])
  const [chargesLoading, setChargesLoading] = useState(false)
  const [editMap, setEditMap]         = useState<Record<string, { nom: string; cdr: string; pv: string }>>({})
  const [savingId, setSavingId]       = useState<string | null>(null)
  const [showAdd, setShowAdd]         = useState(false)

  // ── Simulator state
  const [sim, setSim] = useState({
    nbA: '2', nbE: '2', nbB: '0', nuits: '5',
    repas: 'complet' as 'complet' | 'demi' | 'sans',
    transport: false,
  })

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // ── Load params
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

  // ── Load charges
  const fetchCharges = useCallback(async () => {
    setChargesLoading(true)
    const r = await fetch('/api/charges-famille')
    if (r.ok) {
      const data: ChargeFamille[] = await r.json()
      setCharges(data)
      const em: Record<string, { nom: string; cdr: string; pv: string }> = {}
      for (const c of data) em[c.id] = { nom: c.nom, cdr: String(c.cdr), pv: String(c.pv) }
      setEditMap(em)
    }
    setChargesLoading(false)
  }, [])

  useEffect(() => { fetchParams() }, [fetchParams])
  useEffect(() => { fetchCharges() }, [fetchCharges])

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // ── Charge CRUD ─────────────────────────────────────────────────
  async function toggleCharge(id: string, actif: boolean) {
    await fetch('/api/charges-famille', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actif }),
    })
    setCharges(cs => cs.map(c => c.id === id ? { ...c, actif } : c))
  }

  async function saveCharge(id: string) {
    const edit = editMap[id]
    if (!edit) return
    setSavingId(id)
    const r = await fetch('/api/charges-famille', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nom: edit.nom, cdr: n(edit.cdr), pv: n(edit.pv) }),
    })
    if (r.ok) {
      const updated: ChargeFamille = await r.json()
      setCharges(cs => cs.map(c => c.id === id ? updated : c))
      notify('Charge sauvegardée.', 'success')
    } else {
      notify('Erreur lors de la sauvegarde.', 'error')
    }
    setSavingId(null)
  }

  async function deleteCharge(id: string) {
    if (!confirm('Supprimer cette charge ?')) return
    const r = await fetch(`/api/charges-famille?id=${id}`, { method: 'DELETE' })
    if (r.ok) {
      setCharges(cs => cs.filter(c => c.id !== id))
      notify('Charge supprimée.', 'success')
    }
  }

  async function addCharge(body: Omit<ChargeFamille, 'id'>) {
    const r = await fetch('/api/charges-famille', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, ordre: charges.length + 1 }),
    })
    if (r.ok) {
      const newCharge: ChargeFamille = await r.json()
      setCharges(cs => [...cs, newCharge])
      setEditMap(em => ({ ...em, [newCharge.id]: { nom: newCharge.nom, cdr: String(newCharge.cdr), pv: String(newCharge.pv) } }))
      notify('Charge ajoutée.', 'success')
      setShowAdd(false)
    } else {
      notify('Erreur lors de l\'ajout.', 'error')
    }
  }

  // ── Simulateur ─────────────────────────────────────────────────
  const simResult = useMemo(() => {
    if (charges.length === 0) return null
    return calculerFamilleV2(charges, {
      nbAdultes:   parseInt(sim.nbA)   || 0,
      nbEnfants:   parseInt(sim.nbE)   || 0,
      nbBebes:     parseInt(sim.nbB)   || 0,
      nombreNuits: parseInt(sim.nuits) || 0,
      repas:       sim.repas,
      transport:   sim.transport,
    })
  }, [charges, sim])

  // ── Save params ─────────────────────────────────────────────────
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
      taux_demi_pension:    n(form.taux_demi_pension)  || 30,
      taux_marge_famille:   n(form.taux_marge_famille) || 25,
    }
    const r = await fetch('/api/parametres', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  // ── Test WhatsApp ───────────────────────────────────────────────
  async function handleTestWhatsApp() {
    if (!form.whatsapp_numero || !form.callmebot_apikey) {
      notify('Renseigner le numéro WhatsApp et la clé CallMeBot.', 'error')
      return
    }
    setTesting(true)
    const r = await fetch('/api/notify', {
      method:  'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero:  form.whatsapp_numero,
        apikey:  form.callmebot_apikey,
        message: '✅ Test Al Hazm Academy — notification WhatsApp opérationnelle.',
      }),
    })
    if (r.ok) notify('Message WhatsApp envoyé avec succès.', 'success')
    else notify('Échec de l\'envoi WhatsApp.', 'error')
    setTesting(false)
  }

  function copyLink() {
    if (!form.lien_groupe_whatsapp) return
    navigator.clipboard.writeText(form.lien_groupe_whatsapp)
    notify('Lien copié dans le presse-papiers.', 'success')
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const numInputCls = 'w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#003090] text-right font-mono'

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
          ['general', 'Paramètres généraux', 'ti-settings'],
          ['famille', 'Tarifs Famille',       'ti-users'],
        ] as const).map(([tab, label, icon]) => (
          <button
            key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-white/8 text-[#003090] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <i className={`ti ${icon}`} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ══ ONGLET : PARAMÈTRES GÉNÉRAUX ══════════════════════ */}
        {activeTab === 'general' && (
          <>
            <Section title="Événement" icon="ti-calendar-event">
              <div>
                <label className={labelCls}>
                  Nom de l&apos;événement <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={form.nom_evenement}
                  onChange={e => setField('nom_evenement', e.target.value)}
                  placeholder="Ex: Rusica Park 2026" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date de départ</label>
                  <input type="date" value={form.date_depart}
                    onChange={e => setField('date_depart', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date de retour</label>
                  <input type="date" value={form.date_retour}
                    onChange={e => setField('date_retour', e.target.value)} className={inputCls} />
                </div>
              </div>
            </Section>

            <Section title="Notifications WhatsApp" icon="ti-brand-whatsapp">
              <div>
                <label className={labelCls}>Numéro WhatsApp admin</label>
                <input type="tel" value={form.whatsapp_numero}
                  onChange={e => setField('whatsapp_numero', e.target.value)}
                  placeholder="+213XXXXXXXXX" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">
                  Ce numéro doit avoir activé CallMeBot. Format international (+213…).
                </p>
              </div>
              <div>
                <label className={labelCls}>Clé API CallMeBot</label>
                <div className="relative">
                  <input type={showKey ? 'text' : 'password'} value={form.callmebot_apikey}
                    onChange={e => setField('callmebot_apikey', e.target.value)}
                    placeholder="Votre clé CallMeBot" className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}>
                    <i className={`ti ${showKey ? 'ti-eye-off' : 'ti-eye'} text-base`} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Obtenez votre clé sur{' '}
                  <span className="text-[#003090] dark:text-[#fdbe11]">callmebot.com</span>
                  {' '}en envoyant &quot;I allow callmebot to send me messages&quot; au +34 644 597 101.
                </p>
              </div>
              <button type="button" onClick={handleTestWhatsApp}
                disabled={testing || !form.whatsapp_numero || !form.callmebot_apikey}
                className="flex items-center gap-2 px-4 py-2 border border-[#003090] dark:border-[#fdbe11] text-[#003090] dark:text-[#fdbe11] rounded-lg text-sm font-medium hover:bg-[#e8ecf6] dark:hover:bg-white/5 disabled:opacity-40 transition-colors">
                <i className={`ti ${testing ? 'ti-loader-2 animate-spin' : 'ti-send'}`} aria-hidden="true" />
                {testing ? 'Envoi en cours…' : 'Tester la notification'}
              </button>
            </Section>

            <Section title="Lien groupe WhatsApp" icon="ti-link">
              <div>
                <label className={labelCls}>Lien d&apos;invitation au groupe</label>
                <div className="flex gap-2">
                  <input type="url" value={form.lien_groupe_whatsapp}
                    onChange={e => setField('lien_groupe_whatsapp', e.target.value)}
                    placeholder="https://chat.whatsapp.com/..." className={`${inputCls} flex-1`} />
                  <button type="button" onClick={copyLink} disabled={!form.lien_groupe_whatsapp}
                    className="px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
                    aria-label="Copier le lien">
                    <i className="ti ti-copy text-base" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Affiché sur la page de confirmation publique.</p>
              </div>
            </Section>

            {/* Taux généraux */}
            <Section title="Taux" icon="ti-percentage">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Taux demi-pension (%)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="1"
                      value={form.taux_demi_pension}
                      onChange={e => setField('taux_demi_pension', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] font-mono text-right" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Réduction appliquée sur la charge repas de type &quot;demi&quot; (facteur 0.6 dans Logique C)</p>
                </div>
                <div>
                  <label className={labelCls}>
                    Taux de marge cible <span className="text-[#fdbe11] text-xs">(indicateur)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="1"
                      value={form.taux_marge_famille}
                      onChange={e => setField('taux_marge_famille', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] font-mono text-right" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Indicateur de contrôle uniquement — le PV est maintenant calculé depuis la grille des charges.
                    {simResult && (
                      <span className={`ml-1 font-semibold ${margeColor(simResult.margeP)}`}>
                        Marge réelle : {simResult.margeP}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ══ ONGLET : TARIFS FAMILLE ════════════════════════════ */}
        {activeTab === 'famille' && (
          <>
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              <i className="ti ti-info-circle text-lg shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Logique C — CDR et PV indépendants par charge</p>
                <p className="mt-0.5">
                  PV total = Σ (pv_charge × volume). Chaque charge définit son propre prix de vente.
                  Le taux_marge_famille est un indicateur de contrôle uniquement.
                </p>
              </div>
            </div>

            {/* ── Grille charges ─────────────────────────────── */}
            <Section title="Grille tarifaire famille" icon="ti-list">
              {chargesLoading ? (
                <div className="flex items-center justify-center h-20 text-gray-400">
                  <i className="ti ti-loader-2 animate-spin text-2xl" aria-hidden="true" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          <th className="px-3 py-2">Actif</th>
                          <th className="px-3 py-2">Nom</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2 w-32">CDR (DA)</th>
                          <th className="px-3 py-2 w-32">PV (DA)</th>
                          <th className="px-3 py-2">Unité</th>
                          <th className="px-3 py-2 text-right">Marge%</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {charges.map(charge => {
                          const edit = editMap[charge.id] ?? { nom: charge.nom, cdr: String(charge.cdr), pv: String(charge.pv) }
                          const badge = TYPE_BADGE[charge.type]
                          const mp = margeP(n(edit.cdr), n(edit.pv))
                          const isSaving = savingId === charge.id

                          return (
                            <tr key={charge.id} className={`hover:bg-white/5 transition-colors ${!charge.actif ? 'opacity-50' : ''}`}>
                              <td className="px-3 py-2">
                                <button type="button" role="switch" aria-checked={charge.actif}
                                  onClick={() => toggleCharge(charge.id, !charge.actif)}
                                  className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${charge.actif ? 'bg-[#003090]' : 'bg-gray-600'}`}>
                                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${charge.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                </button>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text" value={edit.nom}
                                  onChange={e => setEditMap(em => ({ ...em, [charge.id]: { ...em[charge.id], nom: e.target.value } }))}
                                  className="w-full bg-transparent text-white text-sm border-b border-transparent focus:border-[#fdbe11] focus:outline-none px-1 py-0.5"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                  style={{ color: badge.color, background: badge.bg }}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" min="0" step="1" value={edit.cdr}
                                  onChange={e => setEditMap(em => ({ ...em, [charge.id]: { ...em[charge.id], cdr: e.target.value } }))}
                                  className={numInputCls} />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" min="0" step="1" value={edit.pv}
                                  onChange={e => setEditMap(em => ({ ...em, [charge.id]: { ...em[charge.id], pv: e.target.value } }))}
                                  className={numInputCls} />
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                                {UNITE_LABELS[charge.unite]}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold">
                                <span className={margeColor(mp)}>{mp}%</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-1">
                                  <button type="button" onClick={() => saveCharge(charge.id)} disabled={isSaving}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-[#003090] text-white hover:opacity-80 disabled:opacity-40 transition-opacity">
                                    {isSaving ? '…' : 'Sauvegarder'}
                                  </button>
                                  <button type="button" onClick={() => deleteCharge(charge.id)}
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                                    <i className="ti ti-trash text-sm" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {charges.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-gray-500 text-sm">
                              Aucune charge définie. Ajoutez-en une ci-dessous.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-lg text-sm transition-colors">
                    <i className="ti ti-plus" aria-hidden="true" />
                    Ajouter une charge
                  </button>
                </>
              )}
            </Section>

            {/* ── Simulateur ─────────────────────────────────── */}
            <Section title="Simulateur temps réel" icon="ti-calculator">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {([
                  ['nbA',   'Adultes'],
                  ['nbE',   'Enfants'],
                  ['nbB',   'Bébés'],
                  ['nuits', 'Nuits'],
                ] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input type="number" min="0" step="1" value={sim[k]}
                      onChange={e => setSim(s => ({ ...s, [k]: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#003090] font-mono text-right" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Repas</label>
                  <select value={sim.repas} onChange={e => setSim(s => ({ ...s, repas: e.target.value as 'complet' | 'demi' | 'sans' }))}
                    className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm bg-[#0a0f2e] text-white focus:outline-none focus:ring-2 focus:ring-[#003090]">
                    <option value="complet">Pension complète</option>
                    <option value="demi">Demi-pension</option>
                    <option value="sans">Sans repas</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Transport</label>
                    <button type="button" role="switch" aria-checked={sim.transport}
                      onClick={() => setSim(s => ({ ...s, transport: !s.transport }))}
                      className={`w-10 h-5 rounded-full relative transition-colors ${sim.transport ? 'bg-[#003090]' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sim.transport ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {simResult ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Charge</th>
                        <th className="px-3 py-2 text-right">CDR</th>
                        <th className="px-3 py-2 text-right">PV</th>
                        <th className="px-3 py-2 text-right">Marge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {simResult.detail.map(d => {
                        const mp = margeP(d.cdr, d.pv)
                        return (
                          <tr key={d.nom} className="hover:bg-white/5">
                            <td className="px-3 py-2 text-gray-300">{d.nom}</td>
                            <td className="px-3 py-2 text-right font-mono text-gray-400">{d.cdr.toLocaleString('fr-DZ')} DA</td>
                            <td className="px-3 py-2 text-right font-mono text-white">{d.pv.toLocaleString('fr-DZ')} DA</td>
                            <td className={`px-3 py-2 text-right font-mono font-semibold ${margeColor(mp)}`}>{mp}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-[#fdbe11]/30">
                      <tr className="font-bold">
                        <td className="px-3 py-2 text-white">TOTAL</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-300">{simResult.cdrTotal.toLocaleString('fr-DZ')} DA</td>
                        <td className="px-3 py-2 text-right font-mono text-[#fdbe11]">{simResult.pvTotal.toLocaleString('fr-DZ')} DA</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${margeColor(simResult.margeP)}`}>{simResult.margeP}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {charges.length === 0 ? 'Aucune charge active.' : 'Entrez une composition pour simuler.'}
                </p>
              )}
            </Section>
          </>
        )}

        {/* ── Save button ────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="sticky bottom-0 bg-[#0a0f2e] border-t border-white/10 py-3 flex justify-end">
            <button type="submit" disabled={saving}
              style={{ background: '#fdbe11', color: '#003090' }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity">
              <i className={`ti ${saving ? 'ti-loader-2 animate-spin' : 'ti-device-floppy'}`} aria-hidden="true" />
              {saving ? 'Enregistrement…' : 'Sauvegarder les paramètres'}
            </button>
          </div>
        )}

      </form>

      {/* Add modal */}
      {showAdd && (
        <AddChargeModal onAdd={addCharge} onClose={() => setShowAdd(false)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

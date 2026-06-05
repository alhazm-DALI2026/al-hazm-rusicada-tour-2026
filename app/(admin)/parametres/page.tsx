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
}

function toForm(p: Parametres): FormState {
  return {
    nom_evenement:        p.nom_evenement        ?? '',
    date_depart:          p.date_depart          ?? '',
    date_retour:          p.date_retour          ?? '',
    whatsapp_numero:      p.whatsapp_numero      ?? '',
    callmebot_apikey:     p.callmebot_apikey      ?? '',
    lien_groupe_whatsapp: p.lien_groupe_whatsapp ?? '',
    taux_demi_pension:    String(p.taux_demi_pension ?? 30),
  }
}

const EMPTY: FormState = {
  nom_evenement: '', date_depart: '', date_retour: '',
  whatsapp_numero: '', callmebot_apikey: '', lien_groupe_whatsapp: '',
  taux_demi_pension: '30',
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParametresPage() {
  const [form, setForm]       = useState<FormState>(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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
      taux_demi_pension:    parseFloat(form.taux_demi_pension) || 30,
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

  // ── Field style ───────────────────────────────────────────────
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
    <div className="p-6 max-w-3xl mx-auto space-y-6">

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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Informations événement ──────────────────────────── */}
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

        {/* ── Tarification ───────────────────────────────────── */}
        <Section title="Tarification" icon="ti-calculator">
          <div>
            <label className={labelCls}>
              Taux demi-pension (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="100" step="1"
                value={form.taux_demi_pension}
                onChange={e => setField('taux_demi_pension', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
              />
              <span className="text-sm text-gray-500">
                Réduction appliquée sur le tarif repas en demi-pension.
                Actuellement : <strong>{form.taux_demi_pension} %</strong>
              </span>
            </div>
          </div>
        </Section>

        {/* ── WhatsApp & CallMeBot ────────────────────────────── */}
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

        {/* ── Lien groupe WhatsApp ────────────────────────────── */}
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

        {/* ── Save button ─────────────────────────────────────── */}
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

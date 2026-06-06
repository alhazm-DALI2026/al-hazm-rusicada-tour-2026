'use client'

import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/Toast'
import type { MoteurCout, MoteurCoutCategorie, MoteurCoutType } from '@/types'

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: { value: MoteurCoutCategorie; label: string; badge: string }[] = [
  { value: 'hebergement', label: 'Hébergement', badge: 'bg-blue-100   text-blue-700   border-blue-200'   },
  { value: 'repas',       label: 'Repas',        badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'transport',   label: 'Transport',    badge: 'bg-green-100  text-green-700  border-green-200'  },
  { value: 'assurance',   label: 'Assurance',    badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'medical',     label: 'Médical',      badge: 'bg-red-100    text-red-700    border-red-200'    },
  { value: 'media',       label: 'Média',        badge: 'bg-gray-100   text-gray-600   border-gray-200'   },
  { value: 'autre',       label: 'Autre',        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

const TYPES: { value: MoteurCoutType; label: string }[] = [
  { value: 'par_nuit',     label: 'Par nuit'     },
  { value: 'par_jour',     label: 'Par jour'     },
  { value: 'par_personne', label: 'Par personne' },
  { value: 'fixe_global',  label: 'Fixe global'  },
]

const EMPTY: FormState = {
  libelle: '', categorie: 'hebergement', type: 'par_nuit',
  montant: '', ordre: '0', actif: true,
}

const TOTAL_CATS: MoteurCoutCategorie[] = ['hebergement', 'repas', 'transport']

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  libelle:   string
  categorie: MoteurCoutCategorie
  type:      MoteurCoutType
  montant:   string
  ordre:     string
  actif:     boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function catCfg(cat: MoteurCoutCategorie) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]
}

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${value ? 'bg-[#003090]' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MoteurPage() {
  const [couts, setCouts]       = useState<MoteurCout[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MoteurCout | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm]         = useState<FormState>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // ── Data ────────────────────────────────────────────────
  const fetchCouts = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/moteur')
      if (r.ok) setCouts(await r.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCouts() }, [fetchCouts])

  // ── Form helpers ────────────────────────────────────────
  function openCreate() {
    setEditItem(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(c: MoteurCout) {
    setEditItem(c)
    setForm({
      libelle: c.libelle, categorie: c.categorie, type: c.type,
      montant: String(c.montant), ordre: String(c.ordre), actif: c.actif,
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // ── Submit ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...(editItem ? { id: editItem.id } : {}),
      libelle:   form.libelle.trim(),
      categorie: form.categorie,
      type:      form.type,
      montant:   parseFloat(form.montant) || 0,
      ordre:     parseInt(form.ordre, 10) || 0,
      actif:     form.actif,
    }
    const r = await fetch('/api/moteur', {
      method:  editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (r.ok) {
      notify(editItem ? 'Coût modifié.' : 'Coût ajouté.', 'success')
      closeForm()
      fetchCouts()
    } else {
      const err = await r.json().catch(() => ({})) as { error?: string }
      notify(err.error ?? 'Erreur lors de la sauvegarde.', 'error')
    }
    setSaving(false)
  }

  // ── Toggle actif (inline) ───────────────────────────────
  async function handleToggle(c: MoteurCout) {
    const r = await fetch('/api/moteur', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: c.id, actif: !c.actif }),
    })
    if (r.ok) {
      setCouts(prev => prev.map(x => x.id === c.id ? { ...x, actif: !x.actif } : x))
    } else {
      notify('Erreur lors de la mise à jour.', 'error')
    }
  }

  // ── Delete ──────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    const r = await fetch(`/api/moteur?id=${deleteId}`, { method: 'DELETE' })
    if (r.ok) {
      notify('Coût supprimé.', 'success')
      setCouts(prev => prev.filter(c => c.id !== deleteId))
    } else {
      notify('Erreur lors de la suppression.', 'error')
    }
    setDeleteId(null)
  }

  // ── Totals ──────────────────────────────────────────────
  const totalFor = (cat: MoteurCoutCategorie) =>
    couts.filter(c => c.categorie === cat && c.actif).reduce((s, c) => s + Number(c.montant), 0)

  const grandTotal = couts.filter(c => c.actif).reduce((s, c) => s + Number(c.montant), 0)

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Moteur de coûts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {couts.length} entrée{couts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] transition-colors"
        >
          <i className="ti ti-plus" aria-hidden="true" />
          Nouveau coût
        </button>
      </div>

      {/* ── Bandeau info ──────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        <i className="ti ti-info-circle text-lg shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold">Charges globales — offres standard uniquement</p>
          <p className="mt-0.5">Les charges ici alimentent les offres standard uniquement. Pour les tarifs famille → <span className="font-semibold underline">Paramètres</span></p>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <i className="ti ti-loader-2 animate-spin text-3xl" aria-hidden="true" />
          </div>
        ) : couts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <i className="ti ti-database-off text-3xl" aria-hidden="true" />
            <span className="text-sm">Aucun coût configuré</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f2f8] dark:bg-white/5 text-left">
                  {['Libellé', 'Catégorie', 'Type de calcul', 'Montant', 'Actif', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-[#003090] dark:text-[#fdbe11] ${
                      h === 'Montant' ? 'text-right' : h === 'Actif' || h === 'Actions' ? 'text-center' : ''
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {couts.map(c => (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#f8f9fd] dark:hover:bg-white/5 transition-colors ${!c.actif ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate">
                      {c.libelle}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${catCfg(c.categorie).badge}`}>
                        {catCfg(c.categorie).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {TYPES.find(t => t.value === c.type)?.label}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {Number(c.montant).toLocaleString('fr-DZ')} DA
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle value={c.actif} onChange={() => handleToggle(c)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-[#003090] hover:bg-[#e8ecf6] rounded-lg transition-colors"
                          aria-label="Modifier"
                        >
                          <i className="ti ti-pencil text-base" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Supprimer"
                        >
                          <i className="ti ti-trash text-base" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Totaux par catégorie ───────────────────────────── */}
      {couts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TOTAL_CATS.map(cat => (
            <div key={cat} className="bg-[var(--color-surface)] rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{catCfg(cat).label}</p>
              <p className="text-lg font-bold text-[#003090] dark:text-white font-mono">{fmt(totalFor(cat))}</p>
            </div>
          ))}
          <div className="bg-[#003090] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#fdbe11] mb-1 font-medium">Total (actifs)</p>
            <p className="text-lg font-bold text-white font-mono">{fmt(grandTotal)}</p>
          </div>
        </div>
      )}

      {/* ── Modal formulaire ──────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold text-[#003090] dark:text-white">
                {editItem ? 'Modifier le coût' : 'Nouveau coût'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <i className="ti ti-x text-xl" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={form.libelle}
                  onChange={e => setField('libelle', e.target.value)}
                  placeholder="Ex: Hébergement chambre double par nuit"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <select
                    value={form.categorie}
                    onChange={e => setField('categorie', e.target.value as MoteurCoutCategorie)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de calcul</label>
                  <select
                    value={form.type}
                    onChange={e => setField('type', e.target.value as MoteurCoutType)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  >
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Montant (DA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" required min="0" step="0.01"
                    value={form.montant}
                    onChange={e => setField('montant', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordre</label>
                  <input
                    type="number" min="0"
                    value={form.ordre}
                    onChange={e => setField('ordre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Actif</span>
                <Toggle value={form.actif} onChange={v => setField('actif', v)} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Enregistrement…' : editItem ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal suppression ─────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <i className="ti ti-trash text-red-600 text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Supprimer ce coût ?</p>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

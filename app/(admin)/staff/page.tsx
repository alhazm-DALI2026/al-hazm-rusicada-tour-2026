'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Toast from '@/components/Toast'
import type { MoteurCout, MoteurCoutCategorie, Staff, TypeChambre } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CHAMBRES: TypeChambre[] = ['Single', 'Double', 'Triple', 'Quadruple']

const FONCTIONS_SUGGEREES = [
  'Entraîneur', 'Médecin', 'Arbitre', 'Intendant',
  'Animateur', 'Coordinateur', 'Chauffeur', 'Logisticien',
]

const EMPTY: FormState = {
  nom: '', fonction: '', type_chambre: '', cout_revient: '', prime: '0',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  nom:          string
  fonction:     string
  type_chambre: TypeChambre | ''
  cout_revient: string
  prime:        string
}

interface CdrBreakdown {
  hebergement: number
  repas:       number
  transport:   number
  total:       number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

function firstActive(couts: MoteurCout[], cat: MoteurCoutCategorie): number {
  return couts.find(c => c.categorie === cat && c.actif)?.montant ?? 0
}

function calcCDR(chambre: TypeChambre | '', couts: MoteurCout[]): CdrBreakdown {
  const hebergs = couts.filter(c => c.categorie === 'hebergement' && c.actif)
  const matched = chambre
    ? (hebergs.find(c => c.libelle.toLowerCase().includes(chambre.toLowerCase())) ?? hebergs[0])
    : hebergs[0]
  const h = matched?.montant ?? 0
  const r = firstActive(couts, 'repas')
  const t = firstActive(couts, 'transport')
  return { hebergement: h, repas: r, transport: t, total: h + r + t }
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  icon, label, value, accent = false,
}: {
  icon: string; label: string; value: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ${accent ? 'bg-[#003090]' : 'bg-surface'}`}>
      <div className="flex items-center gap-2 mb-2">
        <i className={`ti ${icon} text-lg ${accent ? 'text-[#fdbe11]' : 'text-[#003090] dark:text-[#fdbe11]'}`} aria-hidden="true" />
        <span className={`text-xs font-medium ${accent ? 'text-[#fdbe11]' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${accent ? 'text-white' : 'text-[#003090] dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff]           = useState<Staff[]>([])
  const [couts, setCouts]           = useState<MoteurCout[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState<Staff | null>(null)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [form, setForm]             = useState<FormState>(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // ── Data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rs, rc] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/moteur').then(r => r.json()),
      ])
      setStaff(rs)
      setCouts(rc)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── CDR suggestion (memo) ──────────────────────────────────────
  const cdrSuggestion = useMemo(
    () => calcCDR(form.type_chambre, couts),
    [form.type_chambre, couts],
  )

  // ── Summary totals ─────────────────────────────────────────────
  const totalCDR    = useMemo(() => staff.reduce((s, m) => s + Number(m.cout_revient), 0), [staff])
  const totalPrimes = useMemo(() => staff.reduce((s, m) => s + Number(m.prime), 0), [staff])
  const totalCharge = totalCDR + totalPrimes

  // ── Form helpers ───────────────────────────────────────────────
  function openCreate() {
    setEditItem(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(m: Staff) {
    setEditItem(m)
    setForm({
      nom:          m.nom,
      fonction:     m.fonction,
      type_chambre: m.type_chambre ?? '',
      cout_revient: String(m.cout_revient),
      prime:        String(m.prime),
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => {
      const next = { ...f, [key]: val }
      // Auto-fill cout_revient when chambre changes on new form
      if (key === 'type_chambre' && !editItem) {
        const bdg = calcCDR(val as TypeChambre | '', couts)
        next.cout_revient = String(bdg.total)
      }
      return next
    })
  }

  function applySuggestion() {
    setForm(f => ({ ...f, cout_revient: String(cdrSuggestion.total) }))
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...(editItem ? { id: editItem.id } : {}),
      nom:          form.nom.trim(),
      fonction:     form.fonction.trim(),
      type_chambre: form.type_chambre || null,
      cout_revient: parseFloat(form.cout_revient) || 0,
      prime:        parseFloat(form.prime) || 0,
    }
    const r = await fetch('/api/staff', {
      method:  editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (r.ok) {
      notify(editItem ? 'Membre modifié.' : 'Membre ajouté.', 'success')
      closeForm()
      fetchAll()
    } else {
      const err = await r.json().catch(() => ({})) as { error?: string }
      notify(err.error ?? 'Erreur lors de la sauvegarde.', 'error')
    }
    setSaving(false)
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    const r = await fetch(`/api/staff?id=${deleteId}`, { method: 'DELETE' })
    if (r.ok) {
      notify('Membre supprimé.', 'success')
      setStaff(prev => prev.filter(m => m.id !== deleteId))
    } else {
      notify('Erreur lors de la suppression.', 'error')
    }
    setDeleteId(null)
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {staff.length} membre{staff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] transition-colors"
        >
          <i className="ti ti-user-plus" aria-hidden="true" />
          Ajouter un membre
        </button>
      </div>

      {/* ── Summary cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon="ti-users"      label="Membres"       value={String(staff.length)} />
        <SummaryCard icon="ti-calculator" label="Total CDR"     value={fmt(totalCDR)} />
        <SummaryCard icon="ti-rosette"    label="Total primes"  value={fmt(totalPrimes)} />
        <SummaryCard icon="ti-coin"       label="Charge totale" value={fmt(totalCharge)} accent />
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <i className="ti ti-loader-2 animate-spin text-3xl" aria-hidden="true" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <i className="ti ti-users-off text-3xl" aria-hidden="true" />
            <span className="text-sm">Aucun membre staff</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f2f8] dark:bg-white/5 text-left">
                  {[
                    { label: 'Nom',          cls: '' },
                    { label: 'Fonction',     cls: '' },
                    { label: 'Chambre',      cls: 'text-center' },
                    { label: 'CDR',          cls: 'text-right' },
                    { label: 'Prime',        cls: 'text-right' },
                    { label: 'Total charge', cls: 'text-right' },
                    { label: 'Date ajout',   cls: 'text-center' },
                    { label: 'Actions',      cls: 'text-center' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 font-semibold text-[#003090] dark:text-[#fdbe11] ${h.cls}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {staff.map(m => {
                  const charge = Number(m.cout_revient) + Number(m.prime)
                  return (
                    <tr key={m.id} className="hover:bg-[#f8f9fd] dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                        {m.nom}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {m.fonction}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.type_chambre ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {m.type_chambre}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {Number(m.cout_revient).toLocaleString('fr-DZ')} DA
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {Number(m.prime) > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {Number(m.prime).toLocaleString('fr-DZ')} DA
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#003090] dark:text-white whitespace-nowrap">
                        {charge.toLocaleString('fr-DZ')} DA
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(m.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 text-[#003090] hover:bg-[#e8ecf6] rounded-lg transition-colors"
                            aria-label="Modifier"
                          >
                            <i className="ti ti-pencil text-base" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => { setDeleteId(m.id); setDeleteName(m.nom) }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Supprimer"
                          >
                            <i className="ti ti-trash text-base" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Totaux row */}
              <tfoot>
                <tr className="bg-[#003090] text-white text-sm font-semibold">
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right font-mono">{totalCDR.toLocaleString('fr-DZ')} DA</td>
                  <td className="px-4 py-3 text-right font-mono">{totalPrimes.toLocaleString('fr-DZ')} DA</td>
                  <td className="px-4 py-3 text-right font-mono">{totalCharge.toLocaleString('fr-DZ')} DA</td>
                  <td className="px-4 py-3" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal formulaire ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-surface z-10">
              <h2 className="text-lg font-bold text-[#003090] dark:text-white">
                {editItem ? 'Modifier le membre' : 'Ajouter un membre'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <i className="ti ti-x text-xl" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    value={form.nom}
                    onChange={e => setField('nom', e.target.value)}
                    placeholder="Ex: Benali"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>

                {/* Fonction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fonction <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    list="fonctions-list"
                    value={form.fonction}
                    onChange={e => setField('fonction', e.target.value)}
                    placeholder="Ex: Entraîneur"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                  <datalist id="fonctions-list">
                    {FONCTIONS_SUGGEREES.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </div>

              {/* Type chambre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de chambre
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setField('type_chambre', '')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.type_chambre === ''
                        ? 'bg-[#003090] text-white border-[#003090]'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/20 hover:border-[#003090]'
                    }`}
                  >
                    Aucune
                  </button>
                  {CHAMBRES.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setField('type_chambre', ch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.type_chambre === ch
                          ? 'bg-[#003090] text-white border-[#003090]'
                          : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/20 hover:border-[#003090]'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* CDR preview panel */}
              <div className="bg-[#f0f2f8] dark:bg-white/5 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Aperçu CDR
                  {form.type_chambre && (
                    <span className="ml-2 normal-case font-normal text-[#003090] dark:text-[#fdbe11]">
                      — chambre {form.type_chambre}
                    </span>
                  )}
                </p>
                {(
                  [
                    { label: 'Hébergement', icon: 'ti-building', value: cdrSuggestion.hebergement },
                    { label: 'Repas',       icon: 'ti-soup',     value: cdrSuggestion.repas       },
                    { label: 'Transport',   icon: 'ti-bus',      value: cdrSuggestion.transport   },
                  ] as { label: string; icon: string; value: number }[]
                ).map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <i className={`ti ${row.icon}`} aria-hidden="true" />
                      {row.label}
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {row.value.toLocaleString('fr-DZ')} DA
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#003090] dark:text-white">CDR suggéré</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#003090] dark:text-white">
                      {cdrSuggestion.total.toLocaleString('fr-DZ')} DA
                    </span>
                    {String(cdrSuggestion.total) !== form.cout_revient && cdrSuggestion.total > 0 && (
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="text-xs px-2 py-0.5 bg-[#003090] text-white rounded-md hover:bg-[#002070] transition-colors"
                      >
                        Utiliser
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Coût de revient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coût de revient (DA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" required min="0" step="0.01"
                    value={form.cout_revient}
                    onChange={e => setField('cout_revient', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Modifiable manuellement</p>
                </div>

                {/* Prime */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prime (DA)
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.prime}
                    onChange={e => setField('prime', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
              </div>

              {/* Total charge preview */}
              {((parseFloat(form.cout_revient) || 0) + (parseFloat(form.prime) || 0)) > 0 && (
                <div className="flex items-center justify-between bg-[#003090] text-white rounded-xl px-4 py-3">
                  <span className="text-sm font-medium">Charge totale</span>
                  <span className="font-mono font-bold">
                    {((parseFloat(form.cout_revient) || 0) + (parseFloat(form.prime) || 0)).toLocaleString('fr-DZ')} DA
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
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
                  {saving ? 'Enregistrement…' : editItem ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal suppression ──────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <i className="ti ti-user-x text-red-600 text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Supprimer {deleteName} ?</p>
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

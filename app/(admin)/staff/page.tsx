'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Toast from '@/components/Toast'
import { calculerCDRStaff } from '@/lib/calc'
import type { ChargeStaff, MoteurCout, Parametres, Staff, TypeChambre } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CHAMBRES: TypeChambre[] = ['Single', 'Double', 'Triple', 'Quadruple']

const FONCTIONS_SUGGEREES = [
  'Entraîneur', 'Médecin', 'Arbitre', 'Intendant',
  'Animateur', 'Coordinateur', 'Chauffeur', 'Logisticien',
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  nom:            string
  fonction:       string
  type_chambre:   TypeChambre | ''
  prime:          string
  charges_custom: ChargeStaff[]
}

interface ChargeModalForm {
  libelle:   string
  montant:   string
  type:      'par_nuit' | 'par_jour' | 'par_personne' | 'fixe_global'
  categorie: string
}

const EMPTY: FormState = {
  nom: '', fonction: '', type_chambre: '', prime: '0', charges_custom: [],
}

const EMPTY_CHARGE: ChargeModalForm = {
  libelle: '', montant: '', type: 'par_nuit', categorie: 'hebergement',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

function catIcon(cat: string) {
  switch (cat) {
    case 'hebergement': return 'ti-bed'
    case 'repas':       return 'ti-tools-kitchen-2'
    case 'transport':   return 'ti-bus'
    default:            return 'ti-star'
  }
}

function catColor(cat: string) {
  switch (cat) {
    case 'hebergement': return 'text-blue-400'
    case 'repas':       return 'text-green-400'
    default:            return 'text-[#fdbe11]'
  }
}

function chargeCalc(c: ChargeStaff, nombreNuits: number): { formule: string; montant: number } {
  const nombreJours = nombreNuits + 1
  switch (c.type) {
    case 'par_nuit':
      return {
        formule: `${c.montant.toLocaleString('fr-DZ')} × ${nombreNuits} nuits`,
        montant: c.montant * nombreNuits,
      }
    case 'par_jour':
      return {
        formule: `${c.montant.toLocaleString('fr-DZ')} × ${nombreJours} jours`,
        montant: c.montant * nombreJours,
      }
    case 'par_personne':
    case 'fixe_global':
      return {
        formule: `${c.montant.toLocaleString('fr-DZ')} (forfait)`,
        montant: c.montant,
      }
  }
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
  const [staff, setStaff]                     = useState<Staff[]>([])
  const [moteurCouts, setMoteurCouts]          = useState<MoteurCout[]>([])
  const [params, setParams]                   = useState<Parametres | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [showForm, setShowForm]               = useState(false)
  const [editItem, setEditItem]               = useState<Staff | null>(null)
  const [deleteId, setDeleteId]               = useState<string | null>(null)
  const [deleteName, setDeleteName]           = useState('')
  const [form, setForm]                       = useState<FormState>(EMPTY)
  const [saving, setSaving]                   = useState(false)
  const [toast, setToast]                     = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null)
  const [chargeModal, setChargeModal]         = useState<ChargeModalForm>(EMPTY_CHARGE)

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // ── nombreNuits depuis params ──────────────────────────────────
  const nombreNuits = useMemo(() => {
    if (params?.date_depart && params?.date_retour) {
      return Math.round(
        (new Date(params.date_retour).getTime() - new Date(params.date_depart).getTime()) / 86400000,
      )
    }
    return 5
  }, [params])

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rs, rc, rp] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/moteur').then(r => r.json()),
        fetch('/api/parametres').then(r => r.json()),
      ])
      setStaff(Array.isArray(rs) ? rs : [])
      setMoteurCouts(Array.isArray(rc) ? rc : [])
      if (rp && !rp.error) setParams(rp)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── initCharges depuis moteur ──────────────────────────────────
  function initCharges(typeChambre: string): ChargeStaff[] {
    return moteurCouts
      .filter(c => c.actif)
      .filter(c => {
        if (c.categorie !== 'hebergement') return true
        return typeChambre
          ? c.libelle.toLowerCase().includes(typeChambre.toLowerCase())
          : false
      })
      .map(c => ({
        id:        c.id,
        libelle:   c.libelle,
        categorie: c.categorie,
        type:      c.type,
        montant:   c.montant,
        actif:     true,
        custom:    false,
      }))
  }

  // ── CDR temps réel ─────────────────────────────────────────────
  const cdrCalc = useMemo(
    () => calculerCDRStaff(form.charges_custom, nombreNuits),
    [form.charges_custom, nombreNuits],
  )

  const cdrByCategory = useMemo(
    () => cdrCalc.detail.reduce((acc, d) => {
      acc[d.categorie] = (acc[d.categorie] ?? 0) + d.montant
      return acc
    }, {} as Record<string, number>),
    [cdrCalc],
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
      nom:            m.nom,
      fonction:       m.fonction,
      type_chambre:   m.type_chambre ?? '',
      prime:          String(m.prime),
      charges_custom: m.charges_custom ?? [],
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  function onTypeChambreChange(newChambre: TypeChambre | '') {
    setForm(f => {
      const newHeberg  = newChambre ? initCharges(newChambre).filter(c => c.categorie === 'hebergement') : []
      const keepOthers = f.charges_custom.filter(c => c.categorie !== 'hebergement')
      return { ...f, type_chambre: newChambre, charges_custom: [...newHeberg, ...keepOthers] }
    })
  }

  function initFormCharges() {
    setForm(f => ({ ...f, charges_custom: initCharges(f.type_chambre) }))
  }

  function toggleCharge(id: string) {
    setForm(f => ({
      ...f,
      charges_custom: f.charges_custom.map(c => c.id === id ? { ...c, actif: !c.actif } : c),
    }))
  }

  function removeCharge(id: string) {
    setForm(f => ({ ...f, charges_custom: f.charges_custom.filter(c => c.id !== id) }))
  }

  // ── Charge modal ───────────────────────────────────────────────
  function openAddCharge() {
    setEditingChargeId(null)
    setChargeModal(EMPTY_CHARGE)
    setChargeModalOpen(true)
  }

  function openEditCharge(c: ChargeStaff) {
    setEditingChargeId(c.id)
    setChargeModal({ libelle: c.libelle, montant: String(c.montant), type: c.type, categorie: c.categorie })
    setChargeModalOpen(true)
  }

  function saveCharge() {
    const montant = parseFloat(chargeModal.montant) || 0
    if (!chargeModal.libelle.trim() || montant <= 0) return

    if (editingChargeId) {
      setForm(f => ({
        ...f,
        charges_custom: f.charges_custom.map(c =>
          c.id === editingChargeId
            ? { ...c, libelle: chargeModal.libelle.trim(), montant, type: chargeModal.type, categorie: chargeModal.categorie }
            : c,
        ),
      }))
    } else {
      const newCharge: ChargeStaff = {
        id:        `custom_${Date.now()}`,
        libelle:   chargeModal.libelle.trim(),
        categorie: chargeModal.categorie,
        type:      chargeModal.type,
        montant,
        actif:     true,
        custom:    true,
      }
      setForm(f => ({ ...f, charges_custom: [...f.charges_custom, newCharge] }))
    }
    setChargeModalOpen(false)
  }

  const chargeModalPreview = useMemo(() => {
    const m = parseFloat(chargeModal.montant) || 0
    const nombreJours = nombreNuits + 1
    switch (chargeModal.type) {
      case 'par_nuit': return m * nombreNuits
      case 'par_jour': return m * nombreJours
      default:         return m
    }
  }, [chargeModal.montant, chargeModal.type, nombreNuits])

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...(editItem ? { id: editItem.id } : {}),
      nom:            form.nom.trim(),
      fonction:       form.fonction.trim(),
      type_chambre:   form.type_chambre || null,
      cout_revient:   form.charges_custom.length > 0 ? cdrCalc.total : (editItem?.cout_revient ?? 0),
      prime:          parseFloat(form.prime) || 0,
      charges_custom: form.charges_custom,
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

  // ── Recalcul depuis moteur (table action) ──────────────────────
  async function recalcFromMoteur(m: Staff) {
    const charges = initCharges(m.type_chambre ?? '')
    const { total } = calculerCDRStaff(charges, nombreNuits)
    const r = await fetch('/api/staff', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        id: m.id, nom: m.nom, fonction: m.fonction,
        type_chambre: m.type_chambre, cout_revient: total,
        prime: m.prime, charges_custom: charges,
      }),
    })
    if (r.ok) { notify('Charges initialisées.', 'success'); fetchAll() }
    else        notify('Erreur recalcul.', 'error')
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
            {nombreNuits > 0 && (
              <span className="ml-2 text-gray-400">· {nombreNuits} nuit{nombreNuits !== 1 ? 's' : ''}</span>
            )}
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
                  const charge     = Number(m.cout_revient) + Number(m.prime)
                  const hasCharges = (m.charges_custom ?? []).length > 0
                  const tooltip    = `CDR: ${Number(m.cout_revient).toLocaleString('fr-DZ')} DA | Prime: ${Number(m.prime).toLocaleString('fr-DZ')} DA | Total: ${charge.toLocaleString('fr-DZ')} DA`
                  return (
                    <tr
                      key={m.id}
                      title={tooltip}
                      className="hover:bg-[#f8f9fd] dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{m.nom}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.fonction}</td>
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
                          {!hasCharges && (
                            <button
                              onClick={() => recalcFromMoteur(m)}
                              title="Initialiser charges depuis moteur"
                              className="p-1.5 text-[#fdbe11] hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            >
                              <i className="ti ti-refresh text-base" aria-hidden="true" />
                            </button>
                          )}
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

              {/* Nom / Fonction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex: Benali"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fonction <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    list="fonctions-list"
                    value={form.fonction}
                    onChange={e => setForm(f => ({ ...f, fonction: e.target.value }))}
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
                    onClick={() => onTypeChambreChange('')}
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
                      onClick={() => onTypeChambreChange(ch)}
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

              {/* ── Section charges (dark) ──────────────────────── */}
              <div className="rounded-xl overflow-hidden" style={{ background: '#0a0f2e' }}>

                {/* Header charges */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Charges
                  </span>
                  <button
                    type="button"
                    onClick={openAddCharge}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background:   'rgba(253,190,17,0.12)',
                      border:       '1px solid rgba(253,190,17,0.2)',
                      color:        '#fdbe11',
                      borderRadius: 10,
                    }}
                  >
                    <i className="ti ti-plus text-sm" aria-hidden="true" />
                    Ajouter charge
                  </button>
                </div>

                <div className="p-4 space-y-1.5">

                  {/* État vide */}
                  {form.charges_custom.length === 0 && (
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                        Aucune charge configurée
                      </span>
                      {moteurCouts.length > 0 && (
                        <button
                          type="button"
                          onClick={initFormCharges}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          Initialiser depuis moteur
                        </button>
                      )}
                    </div>
                  )}

                  {/* Liste des charges */}
                  {form.charges_custom.map(c => {
                    const calc = chargeCalc(c, nombreNuits)
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{
                          background:   'rgba(255,255,255,0.03)',
                          border:       c.custom
                            ? '1px dashed rgba(253,190,17,0.2)'
                            : '1px solid rgba(255,255,255,0.06)',
                          marginBottom: 6,
                        }}
                      >
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleCharge(c.id)}
                          aria-label={c.actif ? 'Désactiver' : 'Activer'}
                          style={{
                            width:      30,
                            height:     17,
                            borderRadius: 999,
                            background: c.actif ? '#003090' : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                            position:   'relative',
                            transition: 'background 0.2s',
                          }}
                        >
                          <span style={{
                            display:    'block',
                            width:      13,
                            height:     13,
                            borderRadius: 999,
                            background: '#fff',
                            position:   'absolute',
                            top:        2,
                            left:       c.actif ? 15 : 2,
                            transition: 'left 0.15s',
                          }} />
                        </button>

                        {/* Icône catégorie */}
                        <div className={`shrink-0 flex items-center justify-center ${catColor(c.categorie)}`} style={{ width: 26, height: 26 }}>
                          <i className={`ti ${catIcon(c.categorie)} text-base`} aria-hidden="true" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1.3 }} className="truncate">
                            {c.libelle}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, lineHeight: 1.4 }}>
                            {calc.formule}
                          </p>
                        </div>

                        {/* Montant calculé */}
                        <span style={{
                          color:      c.actif ? '#fff' : 'rgba(255,255,255,0.2)',
                          fontSize:   12,
                          fontWeight: 700,
                          flexShrink: 0,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {c.actif ? `${calc.montant.toLocaleString('fr-DZ')} DA` : '0 DA'}
                        </span>

                        {/* Modifier */}
                        <button
                          type="button"
                          onClick={() => openEditCharge(c)}
                          className="shrink-0 p-1 transition-colors"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                          aria-label="Modifier"
                        >
                          <i className="ti ti-edit text-sm" aria-hidden="true" />
                        </button>

                        {/* Supprimer (custom only) */}
                        {c.custom && (
                          <button
                            type="button"
                            onClick={() => removeCharge(c.id)}
                            className="shrink-0 p-1 transition-colors hover:text-red-400"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            aria-label="Supprimer"
                          >
                            <i className="ti ti-trash text-sm" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Encadré CDR total */}
                  {form.charges_custom.length > 0 && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '12px 0 8px' }} />
                      <div style={{
                        background:   'rgba(0,48,144,0.15)',
                        borderLeft:   '3px solid #7eb8ff',
                        borderRadius: '0 10px 10px 0',
                        padding:      12,
                      }}>
                        {[
                          { key: 'hebergement', label: 'Hébergement' },
                          { key: 'repas',       label: 'Repas'       },
                          { key: 'transport',   label: 'Transport'   },
                        ].map(row => (
                          <div key={row.key} className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{row.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'monospace' }}>
                              {(cdrByCategory[row.key] ?? 0).toLocaleString('fr-DZ')} DA
                            </span>
                          </div>
                        ))}
                        {(() => {
                          const autres = Object.entries(cdrByCategory)
                            .filter(([k]) => !['hebergement', 'repas', 'transport'].includes(k))
                            .reduce((s, [, v]) => s + v, 0)
                          return autres > 0 ? (
                            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Autres</span>
                              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'monospace' }}>
                                {autres.toLocaleString('fr-DZ')} DA
                              </span>
                            </div>
                          ) : null
                        })()}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', margin: '8px 0' }} />
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#7eb8ff', fontWeight: 700, fontSize: 15 }}>CDR total</span>
                          <span style={{ color: '#7eb8ff', fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>
                            {cdrCalc.total.toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Prime */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prime (DA)
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.prime}
                  onChange={e => setForm(f => ({ ...f, prime: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                />
              </div>

              {/* Encadré charge totale */}
              {(form.charges_custom.length > 0 || (parseFloat(form.prime) || 0) > 0) && (
                <div style={{
                  background:   'rgba(253,190,17,0.08)',
                  borderLeft:   '3px solid #fdbe11',
                  borderRadius: '0 10px 10px 0',
                  padding:      12,
                }}>
                  {(() => {
                    const cdr = form.charges_custom.length > 0
                      ? cdrCalc.total
                      : (editItem ? Number(editItem.cout_revient) : 0)
                    const prime = parseFloat(form.prime) || 0
                    return (
                      <>
                        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                          <span className="text-sm text-gray-600 dark:text-gray-300">CDR</span>
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-200">
                            {cdr.toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Prime</span>
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-200">
                            {prime.toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(253,190,17,0.2)', marginBottom: 8 }} />
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#fdbe11', fontWeight: 700, fontSize: 18 }}>Charge totale</span>
                          <span style={{ color: '#fdbe11', fontWeight: 700, fontSize: 18, fontFamily: 'monospace' }}>
                            {(cdr + prime).toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Boutons */}
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

      {/* ── Modale ajout/modification charge ──────────────────── */}
      {chargeModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: '#0a0f2e', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {editingChargeId ? 'Modifier la charge' : 'Ajouter une charge'}
            </h3>

            {/* Libellé */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Libellé
              </label>
              <input
                type="text"
                value={chargeModal.libelle}
                onChange={e => setChargeModal(cm => ({ ...cm, libelle: e.target.value }))}
                placeholder="Ex: Chambre double"
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{
                  background:  'rgba(255,255,255,0.05)',
                  border:      '1px solid rgba(255,255,255,0.1)',
                  color:       '#fff',
                }}
              />
            </div>

            {/* Montant */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Montant DA
              </label>
              <input
                type="number" min="0" step="0.01"
                value={chargeModal.montant}
                onChange={e => setChargeModal(cm => ({ ...cm, montant: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background:  'rgba(255,255,255,0.05)',
                  border:      '1px solid rgba(255,255,255,0.1)',
                  color:       '#fff',
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Type
              </label>
              <select
                value={chargeModal.type}
                onChange={e => setChargeModal(cm => ({ ...cm, type: e.target.value as ChargeModalForm['type'] }))}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background:  'rgba(255,255,255,0.05)',
                  border:      '1px solid rgba(255,255,255,0.1)',
                  color:       '#fff',
                }}
              >
                <option value="par_nuit"     style={{ background: '#0a0f2e' }}>Par nuit</option>
                <option value="par_jour"     style={{ background: '#0a0f2e' }}>Par jour</option>
                <option value="par_personne" style={{ background: '#0a0f2e' }}>Par personne</option>
                <option value="fixe_global"  style={{ background: '#0a0f2e' }}>Forfait global</option>
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Catégorie
              </label>
              <select
                value={chargeModal.categorie}
                onChange={e => setChargeModal(cm => ({ ...cm, categorie: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background:  'rgba(255,255,255,0.05)',
                  border:      '1px solid rgba(255,255,255,0.1)',
                  color:       '#fff',
                }}
              >
                <option value="hebergement" style={{ background: '#0a0f2e' }}>Hébergement</option>
                <option value="repas"       style={{ background: '#0a0f2e' }}>Repas</option>
                <option value="transport"   style={{ background: '#0a0f2e' }}>Transport</option>
                <option value="autre"       style={{ background: '#0a0f2e' }}>Autre</option>
              </select>
            </div>

            {/* Aperçu calcul */}
            {chargeModalPreview > 0 && (
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(0,48,144,0.15)', border: '1px solid rgba(0,48,144,0.3)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Montant calculé</span>
                <span style={{ color: '#7eb8ff', fontWeight: 700, fontFamily: 'monospace' }}>
                  = {chargeModalPreview.toLocaleString('fr-DZ')} DA
                </span>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setChargeModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveCharge}
                disabled={!chargeModal.libelle.trim() || !(parseFloat(chargeModal.montant) > 0)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40"
                style={{ background: '#fdbe11', color: '#003090' }}
              >
                {editingChargeId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
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

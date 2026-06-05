'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Toast from '@/components/Toast'
import { calculerCoutOffre } from '@/lib/calc'
import type {
  MoteurCout, MoteurCoutCategorie, Offre,
  RepasType, TypeChambre, TypePublic,
} from '@/types'

// ── Static config ─────────────────────────────────────────────────────────────

const TP_CFG: { value: TypePublic; label: string; badge: string }[] = [
  { value: 'enfant',  label: 'Enfant',  badge: 'bg-blue-100   text-blue-700   border-blue-200'   },
  { value: 'adulte',  label: 'Adulte',  badge: 'bg-green-100  text-green-700  border-green-200'  },
  { value: 'famille', label: 'Famille', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

const CHAMBRES: TypeChambre[] = ['Single', 'Double', 'Triple', 'Quadruple']

const REPAS_OPTS: { value: RepasType; label: string }[] = [
  { value: 'complet', label: 'Pension complète' },
  { value: 'demi',    label: 'Demi-pension'     },
  { value: 'sans',    label: 'Sans repas'        },
]

const CAT_LABEL: Record<MoteurCoutCategorie, string> = {
  hebergement: 'Hébergement', repas: 'Repas',     transport: 'Transport',
  assurance:   'Assurance',   medical: 'Médical', media: 'Média', autre: 'Autre',
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  nom: string; description: string
  type_public: TypePublic; type_chambre: TypeChambre
  nombre_nuits: string; nombre_jours: string
  transport_inclus: boolean; transport_optionnel: boolean
  repas_type: RepasType; places_total: string
  couts_inclus: string[]; prix_vente: string; ordre_affichage: string
}

const EMPTY: FormState = {
  nom: '', description: '', type_public: 'adulte', type_chambre: 'Double',
  nombre_nuits: '4', nombre_jours: '5',
  transport_inclus: false, transport_optionnel: false,
  repas_type: 'demi', places_total: '20',
  couts_inclus: [], prix_vente: '', ordre_affichage: '0',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'
const tpCfg = (tp: TypePublic) => TP_CFG.find(t => t.value === tp) ?? TP_CFG[0]

function buildDraft(f: FormState): Offre {
  return {
    couts_inclus: f.couts_inclus,
    nombre_nuits: parseInt(f.nombre_nuits) || 0,
    nombre_jours: parseInt(f.nombre_jours) || 0,
    places_total: parseInt(f.places_total) || 1,
  } as unknown as Offre
}

function calcBreakdown(f: FormState, couts: MoteurCout[]) {
  const map    = new Map(couts.map(c => [c.id, c]))
  const nuits  = parseInt(f.nombre_nuits)  || 0
  const jours  = parseInt(f.nombre_jours)  || 0
  const places = parseInt(f.places_total)  || 1
  const res    = new Map<MoteurCoutCategorie, number>()
  for (const id of f.couts_inclus) {
    const c = map.get(id)
    if (!c?.actif) continue
    let v = 0
    switch (c.type) {
      case 'par_nuit':     v = c.montant * nuits;   break
      case 'par_jour':     v = c.montant * jours;   break
      case 'par_personne': v = c.montant;            break
      case 'fixe_global':  v = c.montant / places;  break
    }
    res.set(c.categorie, (res.get(c.categorie) ?? 0) + v)
  }
  return res
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange(v: boolean): void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${value ? 'bg-[#003090]' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Offre card ────────────────────────────────────────────────────────────────

function OffreCard({ o, onEdit, onDelete, onToggle }: {
  o: Offre; onEdit(): void; onDelete(): void; onToggle(): void
}) {
  const cfg    = tpCfg(o.type_public)
  const marge  = Number(o.marge)
  const margeP = Number(o.prix_vente) > 0 ? (marge / Number(o.prix_vente)) * 100 : 0
  const placesP = o.places_total > 0 ? (o.places_restantes / o.places_total) * 100 : 0

  return (
    <div className={`bg-[var(--color-surface)] rounded-xl shadow-sm flex flex-col overflow-hidden ${!o.actif ? 'opacity-60' : ''}`}>
      <div className="h-1.5 bg-[#003090]" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{o.nom}</h3>
            {o.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{o.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              o.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {o.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <i className="ti ti-bed text-[#003090]" aria-hidden="true" />
            {o.type_chambre} · {o.nombre_nuits}N / {o.nombre_jours}J
          </span>
          <span className="flex items-center gap-1">
            <i className="ti ti-tools-kitchen-2 text-[#003090]" aria-hidden="true" />
            {REPAS_OPTS.find(r => r.value === o.repas_type)?.label}
          </span>
          {(o.transport_inclus || o.transport_optionnel) && (
            <span className="flex items-center gap-1 col-span-2">
              <i className="ti ti-bus text-[#003090]" aria-hidden="true" />
              {o.transport_inclus ? 'Transport inclus' : 'Transport optionnel'}
            </span>
          )}
        </div>

        {/* Financials */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#f0f2f8] dark:bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400 mb-0.5">CDR</p>
            <p className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">
              {fmt(Number(o.cout_revient))}
            </p>
          </div>
          <div className="bg-[#f0f2f8] dark:bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400 mb-0.5">Prix vente</p>
            <p className="text-xs font-bold font-mono text-[#003090] dark:text-[#7a9de8]">
              {fmt(Number(o.prix_vente))}
            </p>
          </div>
          <div className={`rounded-lg p-2 text-center ${marge >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className="text-[10px] text-gray-400 mb-0.5">Marge {margeP.toFixed(0)}%</p>
            <p className={`text-xs font-bold font-mono ${marge >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
              {fmt(marge)}
            </p>
          </div>
        </div>

        {/* Places */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Places restantes</span>
            <span className="font-semibold text-gray-600 dark:text-gray-300">
              {o.places_restantes} / {o.places_total}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#003090] rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, placesP))}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-[#003090] text-[#003090] rounded-lg text-xs font-medium hover:bg-[#e8ecf6] transition-colors">
            <i className="ti ti-pencil" aria-hidden="true" /> Modifier
          </button>
          <button onClick={onToggle}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              o.actif
                ? 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-white/20 dark:text-gray-300'
                : 'bg-[#003090] text-white hover:bg-[#002070]'
            }`}>
            <i className={`ti ${o.actif ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" />
            {o.actif ? 'Désactiver' : 'Activer'}
          </button>
          <button onClick={onDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <i className="ti ti-trash" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OffresPage() {
  const [offres, setOffres]       = useState<Offre[]>([])
  const [allCouts, setAllCouts]   = useState<MoteurCout[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState<Offre | null>(null)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const notify = (msg: string, type: 'success' | 'error') => setToast({ message: msg, type })

  // ── Load data ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [ro, rc] = await Promise.all([fetch('/api/offres'), fetch('/api/moteur')])
    if (ro.ok) setOffres(await ro.json())
    if (rc.ok) setAllCouts(await rc.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Live CDR ───────────────────────────────────────────────────
  const activeCouts = useMemo(() => allCouts.filter(c => c.actif), [allCouts])
  const cdr         = useMemo(() => calculerCoutOffre(buildDraft(form), allCouts), [form, allCouts])
  const breakdown   = useMemo(() => calcBreakdown(form, allCouts), [form, allCouts])
  const prixVente   = parseFloat(form.prix_vente) || 0
  const marge       = prixVente - cdr
  const margeP      = prixVente > 0 ? (marge / prixVente) * 100 : 0

  // ── Form helpers ───────────────────────────────────────────────
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleCout(id: string) {
    setForm(f => ({
      ...f,
      couts_inclus: f.couts_inclus.includes(id)
        ? f.couts_inclus.filter(x => x !== id)
        : [...f.couts_inclus, id],
    }))
  }

  function openCreate() { setEditItem(null); setForm(EMPTY); setShowForm(true) }

  function openEdit(o: Offre) {
    setEditItem(o)
    setForm({
      nom:                 o.nom,
      description:         o.description ?? '',
      type_public:         o.type_public,
      type_chambre:        o.type_chambre,
      nombre_nuits:        String(o.nombre_nuits),
      nombre_jours:        String(o.nombre_jours),
      transport_inclus:    o.transport_inclus,
      transport_optionnel: o.transport_optionnel,
      repas_type:          o.repas_type,
      places_total:        String(o.places_total),
      couts_inclus:        o.couts_inclus,
      prix_vente:          String(o.prix_vente),
      ordre_affichage:     String(o.ordre_affichage),
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const places = parseInt(form.places_total) || 0
    const payload = {
      ...(editItem ? { id: editItem.id } : {}),
      nom:                 form.nom.trim(),
      description:         form.description.trim() || null,
      type_public:         form.type_public,
      type_chambre:        form.type_chambre,
      nombre_nuits:        parseInt(form.nombre_nuits) || 0,
      nombre_jours:        parseInt(form.nombre_jours) || 0,
      transport_inclus:    form.transport_inclus,
      transport_optionnel: form.transport_optionnel,
      repas_type:          form.repas_type,
      places_total:        places,
      places_restantes:    editItem ? editItem.places_restantes : places,
      couts_inclus:        form.couts_inclus,
      cout_revient:        cdr,
      prix_vente:          prixVente,
      actif:               editItem?.actif ?? true,
      ordre_affichage:     parseInt(form.ordre_affichage) || 0,
    }
    const r = await fetch('/api/offres', {
      method:  editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (r.ok) {
      notify(editItem ? 'Offre modifiée.' : 'Offre créée.', 'success')
      closeForm(); loadAll()
    } else {
      const err = await r.json().catch(() => ({})) as { error?: string }
      notify(err.error ?? 'Erreur lors de la sauvegarde.', 'error')
    }
    setSaving(false)
  }

  // ── Toggle actif ───────────────────────────────────────────────
  async function handleToggleActif(o: Offre) {
    const r = await fetch('/api/offres', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: o.id, actif: !o.actif }),
    })
    if (r.ok) setOffres(prev => prev.map(x => x.id === o.id ? { ...x, actif: !x.actif } : x))
    else notify('Erreur lors de la mise à jour.', 'error')
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    const r = await fetch(`/api/offres?id=${deleteId}`, { method: 'DELETE' })
    if (r.ok) { notify('Offre supprimée.', 'success'); setOffres(prev => prev.filter(o => o.id !== deleteId)) }
    else notify('Erreur lors de la suppression.', 'error')
    setDeleteId(null)
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Offres</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {offres.length} offre{offres.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] transition-colors">
          <i className="ti ti-plus" aria-hidden="true" /> Nouvelle offre
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <i className="ti ti-loader-2 animate-spin text-3xl" aria-hidden="true" />
        </div>
      ) : offres.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
          <i className="ti ti-ticket-off text-3xl" aria-hidden="true" />
          <span className="text-sm">Aucune offre configurée</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offres.map(o => (
            <OffreCard
              key={o.id} o={o}
              onEdit={() => openEdit(o)}
              onDelete={() => setDeleteId(o.id)}
              onToggle={() => handleToggleActif(o)}
            />
          ))}
        </div>
      )}

      {/* ── Form modal ──────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-2xl my-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold text-[#003090] dark:text-white">
                {editItem ? 'Modifier l\'offre' : 'Nouvelle offre'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <i className="ti ti-x text-xl" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Nom + Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de l'offre <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.nom}
                    onChange={e => setField('nom', e.target.value)}
                    placeholder="Ex: Pack Adulte Double"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Description courte de l'offre…"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090] resize-none"
                  />
                </div>
              </div>

              {/* Type public + Chambre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de public</label>
                  <select value={form.type_public}
                    onChange={e => setField('type_public', e.target.value as TypePublic)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]">
                    {TP_CFG.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de chambre</label>
                  <select value={form.type_chambre}
                    onChange={e => setField('type_chambre', e.target.value as TypeChambre)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]">
                    {CHAMBRES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de nuits</label>
                  <input type="number" min="1" value={form.nombre_nuits}
                    onChange={e => setField('nombre_nuits', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de jours</label>
                  <input type="number" min="1" value={form.nombre_jours}
                    onChange={e => setField('nombre_jours', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Transport inclus',    key: 'transport_inclus'    as const },
                    { label: 'Transport optionnel', key: 'transport_optionnel' as const },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 bg-[#f0f2f8] dark:bg-white/5 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      <Toggle value={form[key]} onChange={v => setField(key, v)} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de repas</label>
                  <select value={form.repas_type}
                    onChange={e => setField('repas_type', e.target.value as RepasType)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]">
                    {REPAS_OPTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Coûts inclus */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coûts inclus
                  <span className="ml-1 text-xs text-gray-400">({form.couts_inclus.length} sélectionné{form.couts_inclus.length !== 1 ? 's' : ''})</span>
                </p>
                {activeCouts.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun coût actif dans le moteur.</p>
                ) : (
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg divide-y divide-gray-100 dark:divide-white/10 max-h-48 overflow-y-auto">
                    {activeCouts.map(c => (
                      <label key={c.id}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-[#f8f9fd] dark:hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0">
                          <input type="checkbox"
                            checked={form.couts_inclus.includes(c.id)}
                            onChange={() => toggleCout(c.id)}
                            className="w-4 h-4 rounded accent-[#003090]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.libelle}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-gray-400">{CAT_LABEL[c.categorie]}</span>
                          <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">
                            {Number(c.montant).toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CDR preview */}
              <div className="border border-[#003090]/20 rounded-xl p-4 bg-[#f0f2f8] dark:bg-white/5 space-y-1.5">
                <p className="text-xs font-semibold text-[#003090] dark:text-[#fdbe11] uppercase tracking-wide mb-2">
                  Aperçu calcul en temps réel
                </p>
                {breakdown.size === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sélectionnez des coûts pour voir le détail.</p>
                ) : (
                  Array.from(breakdown.entries()).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{CAT_LABEL[cat]}</span>
                      <span className="font-mono">{fmt(val)}</span>
                    </div>
                  ))
                )}
                <div className="border-t border-gray-200 dark:border-white/10 pt-1.5 mt-1 space-y-1">
                  <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-white">
                    <span>Total CDR</span>
                    <span className="font-mono">{fmt(cdr)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#003090] dark:text-[#7a9de8]">
                    <span>Prix vente</span>
                    <span className="font-mono">{fmt(prixVente)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold ${marge >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                    <span>Marge</span>
                    <span className="font-mono">{fmt(marge)} ({margeP.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Places + Prix vente + Ordre */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Places total <span className="text-red-500">*</span>
                  </label>
                  <input type="number" required min="1" value={form.places_total}
                    onChange={e => setField('places_total', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix de vente (DA) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" required min="0" step="0.01" value={form.prix_vente}
                    onChange={e => setField('prix_vente', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordre affichage</label>
                  <input type="number" min="0" value={form.ordre_affichage}
                    onChange={e => setField('ordre_affichage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-sm bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#003090] text-white rounded-lg text-sm font-medium hover:bg-[#002070] disabled:opacity-60 transition-colors">
                  {saving ? 'Enregistrement…' : editItem ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete modal ──────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <i className="ti ti-trash text-red-600 text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Supprimer cette offre ?</p>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

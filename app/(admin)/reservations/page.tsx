'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import StatutBadge from '@/components/StatutBadge'
import Toast from '@/components/Toast'
import { calculerFamilleV2 } from '@/lib/calc'
import type { ChargeFamille } from '@/lib/calc'
import type {
  Offre, Parametres, Reservation,
  RepasType, SourceReservation, TypeReservation,
} from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type ResWithOffre = Reservation & { offre: Offre | null }

interface Membre { nom: string; prenom: string; annee_naissance: number | null }

interface Filters { statut: string; source: string; type: string; search: string }

interface CreateForm {
  resType: TypeReservation
  offre_id: string
  nb_adultes: string; nb_enfants: string; nb_bebes: string
  nom: string; prenom: string; telephone: string; email: string; annee_naissance: string
  transport: boolean; repas_type: RepasType
  nombre_nuits: string; prix_vente: string
}

const EMPTY_FORM: CreateForm = {
  resType: 'standard', offre_id: '',
  nb_adultes: '2', nb_enfants: '1', nb_bebes: '0',
  nom: '', prenom: '', telephone: '', email: '', annee_naissance: '',
  transport: false, repas_type: 'demi', nombre_nuits: '4', prix_vente: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => Number(n).toLocaleString('fr-DZ') + ' DA'
const dateStr = (s: string) => new Date(s).toLocaleDateString('fr-FR')
const datetimeStr = (s: string) => new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

function buildConfirmMsg(r: ResWithOffre) {
  return [
    '✅ Réservation confirmée !',
    `📋 Réf : ${r.reference}`,
    `👤 ${r.prenom} ${r.nom}  📞 ${r.telephone}`,
    `🏕️ ${r.offre?.nom ?? 'N/A'}`,
    `💰 ${fmt(Number(r.prix_vente))}`,
    process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP
      ? `🔗 Groupe : ${process.env.NEXT_PUBLIC_LIEN_GROUPE_WHATSAPP}`
      : '',
  ].filter(Boolean).join('\n')
}

async function exportToExcel(data: ResWithOffre[]) {
  const XLSX = await import('xlsx')
  const headers = [
    'Référence','Nom','Prénom','Année de naissance','Téléphone','Email','Offre','Type',
    'Adultes','Enfants','Nuits','Transport','Repas',
    'CDR (DA)','Prix vente (DA)','Encaissé (DA)','Marge (DA)',
    'Statut','Source','Créé le','Confirmé le',
  ]
  const toRow = (r: ResWithOffre) => [
    r.reference, r.nom, r.prenom, r.annee_naissance ?? '', r.telephone, r.email ?? '',
    r.offre?.nom ?? '', r.type, r.nb_adultes, r.nb_enfants, r.nombre_nuits,
    r.transport ? 'Oui' : 'Non', r.repas_type,
    Number(r.cout_revient), Number(r.prix_vente), Number(r.encaissement), Number(r.marge),
    r.statut, r.source,
    dateStr(r.created_at),
    r.confirmed_at ? dateStr(r.confirmed_at) : '',
  ]
  const wb = XLSX.utils.book_new()
  const sheets: [string, ResWithOffre[]][] = [
    ['Toutes', data],
    ['Confirmées', data.filter(r => r.statut === 'confirmee')],
    ['En attente', data.filter(r => r.statut === 'en_attente')],
  ]
  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(toRow)])
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[addr]) ws[addr].s = {
        fill: { patternType: 'solid', fgColor: { rgb: '003090' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true },
      }
    }
    ws['!cols'] = headers.map(() => ({ wch: 18 }))
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  XLSX.writeFile(wb, `al-hazm-reservations-${new Date().toISOString().slice(0,10)}.xlsx`, { cellStyles: true })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange(v: boolean): void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${value ? 'bg-[#003090]' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SourceBadge({ source }: { source: SourceReservation }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
      source === 'admin'
        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
        : 'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-500/10   dark:text-blue-400   dark:border-blue-500/30'
    }`}>{source === 'admin' ? 'Admin' : 'Client'}</span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#003090] dark:text-[#fdbe11] mb-2">{title}</p>
      <div className="bg-[#f0f2f8] dark:bg-white/5 rounded-xl divide-y divide-gray-100 dark:divide-white/10">{children}</div>
    </div>
  )
}
function DRow({ label, value: val, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-gray-500 shrink-0 mr-3">{label}</span>
      <span className={`text-xs font-medium text-right truncate max-w-[60%] ${color ?? 'text-gray-800 dark:text-gray-200'}`}>{val}</span>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function DrawerDetail({ r, onClose, onSaveAnnee, onSaveMembres, onSaveEncaissement }: {
  r: ResWithOffre; onClose(): void
  onSaveAnnee(id: string, annee: number | null): Promise<void>
  onSaveMembres(id: string, membres: Membre[]): Promise<void>
  onSaveEncaissement(id: string, montant: number): Promise<void>
}) {
  const marge  = Number(r.marge)
  const margeP = Number(r.prix_vente) > 0 ? (marge / Number(r.prix_vente)) * 100 : 0
  const [annee, setAnnee] = useState(r.annee_naissance != null ? String(r.annee_naissance) : '')
  const [saving, setSaving] = useState(false)
  const dirty = annee !== (r.annee_naissance != null ? String(r.annee_naissance) : '')

  async function saveAnnee() {
    setSaving(true)
    await onSaveAnnee(r.id, annee ? parseInt(annee) : null)
    setSaving(false)
  }

  const [encaissement, setEncaissement] = useState(String(r.encaissement ?? 0))
  const [savingEnc, setSavingEnc] = useState(false)
  const encDirty = encaissement !== String(r.encaissement ?? 0)

  async function saveEncaissement() {
    setSavingEnc(true)
    await onSaveEncaissement(r.id, parseFloat(encaissement) || 0)
    setSavingEnc(false)
  }

  // ── Membres de la famille ──────────────────────────────────────
  const nbBebes = r.type === 'famille'
    ? ((r.options_custom as { nb_bebes?: number } | null)?.nb_bebes ?? 0)
    : 0
  const totalMembres  = r.type === 'famille' ? r.nb_adultes + r.nb_enfants + nbBebes : 0
  const savedMembres  = (r.options_custom as { membres?: Membre[] } | null)?.membres ?? []
  const initMembres   = Array.from({ length: totalMembres }, (_, i) =>
    savedMembres[i] ?? { nom: '', prenom: '', annee_naissance: null })
  const [membres, setMembres] = useState<Membre[]>(initMembres)
  const [savingMembres, setSavingMembres] = useState(false)
  const membresDirty = JSON.stringify(membres) !== JSON.stringify(initMembres)

  function updateMembre(i: number, patch: Partial<Membre>) {
    setMembres(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  }

  function roleLabel(i: number): string {
    if (i < r.nb_adultes) return `Adulte ${i + 1}`
    if (i < r.nb_adultes + r.nb_enfants) return `Enfant ${i - r.nb_adultes + 1}`
    return `Bébé ${i - r.nb_adultes - r.nb_enfants + 1}`
  }

  async function saveMembres() {
    setSavingMembres(true)
    await onSaveMembres(r.id, membres)
    setSavingMembres(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0f172a] border-l border-white/10 h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-[#0f172a] border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#003090] dark:text-white font-mono">{r.reference}</p>
            <p className="text-xs text-gray-500">{r.prenom} {r.nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="ti ti-x text-xl" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 space-y-4 flex-1">
          <Section title="Identité">
            <DRow label="Référence" value={r.reference} />
            <DRow label="Nom complet" value={`${r.prenom} ${r.nom}`} />
            <DRow label="Téléphone" value={r.telephone} />
            <DRow label="Email" value={r.email ?? '—'} />
            <div className="flex items-center justify-between px-3 py-2 gap-2">
              <span className="text-xs text-gray-500 shrink-0">Année de naissance</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={1940} max={new Date().getFullYear()}
                  placeholder="—" value={annee} onChange={e => setAnnee(e.target.value)}
                  className="w-20 px-2 py-1 text-xs text-right border border-gray-200 dark:border-[#003090] rounded-md bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
                {dirty && (
                  <button onClick={saveAnnee} disabled={saving}
                    className="p-1 text-green-500 hover:bg-white/5 rounded-md transition-colors disabled:opacity-40"
                    title="Enregistrer">
                    <i className={`ti ${saving ? 'ti-loader-2 animate-spin' : 'ti-check'} text-sm`} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </Section>
          <Section title="Séjour">
            <DRow label="Offre" value={r.offre?.nom ?? '—'} />
            <DRow label="Type" value={r.type === 'famille' ? 'Famille' : 'Standard'} />
            {r.type === 'famille' && (() => {
              const oc = r.options_custom as { chambres?: { type: string }[] } | null
              const chambres = oc?.chambres
              if (!chambres?.length) return null
              const counts = new Map<string, number>()
              for (const c of chambres) counts.set(c.type, (counts.get(c.type) ?? 0) + 1)
              const label = Array.from(counts.entries()).map(([t, n]) => `${n}×${t}`).join(' + ')
              return <DRow label="Chambres" value={label} />
            })()}
            <DRow label="Composition" value={(() => {
                const nbB = r.type === 'famille'
                  ? ((r.options_custom as { nb_bebes?: number } | null)?.nb_bebes ?? 0)
                  : 0
                return `${r.nb_adultes}A + ${r.nb_enfants}E${nbB > 0 ? ` + ${nbB}B` : ''}`
              })()} />
            <DRow label="Nuits" value={String(r.nombre_nuits)} />
            <DRow label="Transport" value={
              r.offre?.transport_inclus ? '✅ Inclus'
              : r.transport             ? '➕ Optionnel ajouté'
              : '❌ Non'
            } />
            <DRow label="Repas" value={
              r.repas_type === 'complet' ? 'Pension complète'
              : r.repas_type === 'demi' ? 'Demi-pension'
              : 'Sans repas'
            } />
          </Section>
          {r.type === 'famille' && totalMembres > 0 && (
            <Section title="Membres de la famille">
              <div className="p-2 space-y-2">
                {membres.map((m, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-400">{roleLabel(i)}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input placeholder="Prénom" value={m.prenom}
                        onChange={e => updateMembre(i, { prenom: e.target.value })}
                        className="px-2 py-1 text-xs border border-gray-200 dark:border-[#003090] rounded-md bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
                      <input placeholder="Nom" value={m.nom}
                        onChange={e => updateMembre(i, { nom: e.target.value })}
                        className="px-2 py-1 text-xs border border-gray-200 dark:border-[#003090] rounded-md bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
                    </div>
                    <input type="number" min={1940} max={new Date().getFullYear()} placeholder="Année de naissance"
                      value={m.annee_naissance ?? ''}
                      onChange={e => updateMembre(i, { annee_naissance: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-[#003090] rounded-md bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
                  </div>
                ))}
                {membresDirty && (
                  <button onClick={saveMembres} disabled={savingMembres}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-40">
                    <i className={`ti ${savingMembres ? 'ti-loader-2 animate-spin' : 'ti-check'} text-sm`} aria-hidden="true" />
                    Enregistrer les membres
                  </button>
                )}
              </div>
            </Section>
          )}
          <Section title="Finance">
            <DRow label="CDR" value={fmt(Number(r.cout_revient))} />
            <DRow label="Prix vente" value={fmt(Number(r.prix_vente))} />
            <div className="flex items-center justify-between px-3 py-2 gap-2">
              <span className="text-xs text-gray-500 shrink-0">Encaissé (DA)</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} step="0.01"
                  value={encaissement} onChange={e => setEncaissement(e.target.value)}
                  className="w-24 px-2 py-1 text-xs text-right border border-gray-200 dark:border-[#003090] rounded-md bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
                {encDirty && (
                  <button onClick={saveEncaissement} disabled={savingEnc}
                    className="p-1 text-green-500 hover:bg-white/5 rounded-md transition-colors disabled:opacity-40"
                    title="Enregistrer">
                    <i className={`ti ${savingEnc ? 'ti-loader-2 animate-spin' : 'ti-check'} text-sm`} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <DRow label="Reste à encaisser" value={fmt(Math.max(Number(r.prix_vente) - Number(r.encaissement), 0))}
              color={Number(r.encaissement) >= Number(r.prix_vente) ? 'text-green-600 dark:text-green-400' : 'text-amber-500'} />
            <DRow label={`Marge (${margeP.toFixed(1)}%)`} value={fmt(marge)}
              color={marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'} />
          </Section>
          <Section title="Statut & dates">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-500">Statut</span>
              <StatutBadge statut={r.statut} />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-500">Source</span>
              <SourceBadge source={r.source} />
            </div>
            <DRow label="Créé le" value={datetimeStr(r.created_at)} />
            {r.confirmed_at && <DRow label="Confirmé le" value={datetimeStr(r.confirmed_at)} />}
          </Section>
          <Section title="Notifications WhatsApp">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-500">Soumission</span>
              <span className={`text-xs font-semibold ${r.notif_soumission_envoyee ? 'text-green-600' : 'text-gray-400'}`}>
                {r.notif_soumission_envoyee ? '✓ Envoyée' : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-500">Confirmation</span>
              <span className={`text-xs font-semibold ${r.notif_confirmation_envoyee ? 'text-green-600' : 'text-gray-400'}`}>
                {r.notif_confirmation_envoyee ? '✓ Envoyée' : '—'}
              </span>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

// ── CreateModal ───────────────────────────────────────────────────────────────

function CreateModal({
  offres, params, charges, onSuccess, onClose, onError,
}: {
  offres: Offre[]; params: Parametres | null; charges: ChargeFamille[]
  onSuccess(): void; onClose(): void; onError(msg: string): void
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const setF = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const offre = offres.find(o => o.id === form.offre_id) ?? null

  // Auto-fill fields when standard offre is selected
  useEffect(() => {
    if (form.resType === 'standard' && offre) {
      setForm(f => ({
        ...f,
        transport:    offre.transport_inclus,
        repas_type:   offre.repas_type,
        nombre_nuits: String(offre.nombre_nuits),
        prix_vente:   String(offre.prix_vente),
      }))
    }
  }, [form.offre_id, form.resType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live calcul famille (Logique C)
  const familleResult = useMemo(() => {
    if (form.resType !== 'famille' || charges.length === 0) return null
    return calculerFamilleV2(charges, {
      nbAdultes:   parseInt(form.nb_adultes)   || 0,
      nbEnfants:   parseInt(form.nb_enfants)   || 0,
      nbBebes:     parseInt(form.nb_bebes)     || 0,
      nombreNuits: parseInt(form.nombre_nuits) || 0,
      transport:   form.transport,
      repas:       form.repas_type,
    })
  }, [form.resType, form.nb_adultes, form.nb_enfants, form.nb_bebes, form.nombre_nuits, form.transport, form.repas_type, charges])

  useEffect(() => {
    if (form.resType === 'famille' && familleResult) {
      setForm(f => ({ ...f, prix_vente: String(familleResult.pvTotal) }))
    }
  }, [familleResult, form.resType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live CDR
  const cdr = useMemo(() => {
    if (form.resType === 'standard' && offre) return Number(offre.cout_revient)
    if (form.resType === 'famille' && familleResult) return familleResult.cdrTotal
    return 0
  }, [form.resType, offre, familleResult])

  const prixVente = parseFloat(form.prix_vente) || 0
  const marge     = prixVente - cdr

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const nuits     = parseInt(form.nombre_nuits) || (offre?.nombre_nuits ?? 1)
    const nbAdultes = parseInt(form.nb_adultes) || 1
    const nbEnfants = parseInt(form.nb_enfants) || 0
    const nbBebes   = parseInt(form.nb_bebes)   || 0
    const payload = {
      offre_id:    form.resType === 'standard' ? form.offre_id || null : null,
      nom:         form.nom.trim(), prenom: form.prenom.trim(),
      telephone:   form.telephone.trim(), email: form.email.trim() || null,
      annee_naissance: form.annee_naissance ? parseInt(form.annee_naissance) : null,
      type:        form.resType,
      source:      'admin' as const,
      statut:      'en_attente' as const,
      nb_adultes:  nbAdultes,
      nb_enfants:  nbEnfants,
      nombre_nuits: nuits,
      transport:   form.transport,
      repas_type:  form.repas_type,
      cout_revient: cdr,
      prix_vente:  prixVente,
      notif_soumission_envoyee:   false,
      notif_confirmation_envoyee: false,
      ...(form.resType === 'famille' && familleResult ? {
        options_custom: {
          nb_bebes:   nbBebes,
          detail_cdr: familleResult.detail,
        },
      } : {}),
    }
    const r = await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (r.ok) { onSuccess() }
    else {
      const err = await r.json().catch(() => ({})) as { error?: string }
      onError(err.error ?? 'Erreur lors de la création.')
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'
  const selCls   = 'w-full px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl w-full max-w-xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-bold text-[#003090] dark:text-white">Nouvelle réservation (Admin)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="ti ti-x text-xl" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Type */}
          <div className="flex gap-2">
            {(['standard', 'famille'] as TypeReservation[]).map(t => (
              <button key={t} type="button" onClick={() => setF('resType', t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  form.resType === t ? 'bg-[#003090] text-white' : 'border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}>{t}</button>
            ))}
          </div>

          {/* Offre selection */}
          {form.resType === 'standard' ? (
            <div>
              <label className={labelCls}>Offre <span className="text-red-500">*</span></label>
              <select required value={form.offre_id} onChange={e => setF('offre_id', e.target.value)} className={selCls}>
                <option value="">— Choisir une offre —</option>
                {offres.filter(o => o.actif && o.type_public !== 'famille').map(o => (
                  <option key={o.id} value={o.id}>{o.nom} ({o.type_public})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Adultes</label>
                <input type="number" min="1" value={form.nb_adultes}
                  onChange={e => setF('nb_adultes', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Enfants</label>
                <input type="number" min="0" value={form.nb_enfants}
                  onChange={e => setF('nb_enfants', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bébés</label>
                <input type="number" min="0" value={form.nb_bebes}
                  onChange={e => setF('nb_bebes', e.target.value)} className={inputCls} />
              </div>
              {familleResult && familleResult.detail.length > 0 && (
                <div className="col-span-3 bg-[#f0f2f8] dark:bg-white/5 rounded-lg overflow-hidden">
                  {familleResult.detail.map(d => {
                    const mp = d.pv > 0 ? Math.round(((d.pv - d.cdr) / d.pv) * 100) : 0
                    return (
                      <div key={d.nom} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-white/5 last:border-0">
                        <span className="text-gray-500 dark:text-gray-400">{d.nom}</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">CDR {d.cdr.toLocaleString('fr-DZ')} / PV {d.pv.toLocaleString('fr-DZ')} DA
                          <span className="ml-2 text-green-500">({mp}%)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            {([['prenom', 'Prénom'], ['nom', 'Nom'], ['telephone', 'Téléphone'], ['email', 'Email']] as const).map(([k, label]) => (
              <div key={k}>
                <label className={labelCls}>{label}{k !== 'email' && <span className="text-red-500"> *</span>}</label>
                <input type={k === 'email' ? 'email' : 'text'}
                  required={k !== 'email'}
                  value={form[k]}
                  onChange={e => setF(k, e.target.value)}
                  className={inputCls} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Année de naissance</label>
              <input type="number" min={1940} max={new Date().getFullYear()}
                placeholder="ex: 1990"
                value={form.annee_naissance}
                onChange={e => setF('annee_naissance', e.target.value)}
                className={inputCls} />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type de repas</label>
              <select value={form.repas_type} onChange={e => setF('repas_type', e.target.value as RepasType)} className={selCls}>
                <option value="complet">Pension complète</option>
                <option value="demi">Demi-pension</option>
                <option value="sans">Sans repas</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nuits</label>
              <input type="number" min="1" value={form.nombre_nuits}
                onChange={e => setF('nombre_nuits', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-[#f0f2f8] dark:bg-[#0a0f2e] dark:border dark:border-[#003090] rounded-lg">
            <span className="text-sm text-gray-700 dark:text-white">Transport</span>
            <Toggle value={form.transport} onChange={v => setF('transport', v)} />
          </div>

          {/* CDR preview */}
          <div className="border border-[#003090]/20 rounded-xl p-3 bg-[#f0f2f8] dark:bg-white/5 space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-white">
              <span>CDR calculé</span><span className="font-mono">{fmt(cdr)}</span>
            </div>
            <div>
              <label className={labelCls + ' mt-1'}>Prix de vente (DA) <span className="text-red-500">*</span></label>
              <input type="number" required min="0" step="0.01" value={form.prix_vente}
                onChange={e => setF('prix_vente', e.target.value)}
                placeholder="0.00" className={inputCls} />
            </div>
            <div className={`flex justify-between text-xs font-bold pt-1 ${marge >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
              <span>Marge</span>
              <span className="font-mono">{fmt(marge)} ({prixVente > 0 ? ((marge / prixVente) * 100).toFixed(1) : 0}%)</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              style={{ background: '#fdbe11', color: '#003090' }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity">
              {saving ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ResWithOffre[]>([])
  const [offres, setOffres]             = useState<Offre[]>([])
  const [params, setParams]             = useState<Parametres | null>(null)
  const [charges, setCharges]           = useState<ChargeFamille[]>([])
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState<Filters>({ statut: '', source: '', type: '', search: '' })
  const [drawerItem, setDrawerItem]     = useState<ResWithOffre | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [cancelItem, setCancelItem]     = useState<ResWithOffre | null>(null)
  const [confirmItem, setConfirmItem]   = useState<ResWithOffre | null>(null)
  const [confirmAmount, setConfirmAmount] = useState('')
  const [toast, setToast]               = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const notify = (msg: string, type: 'success' | 'error') => setToast({ message: msg, type })

  // ── Load ─────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [rr, ro, rp, rc] = await Promise.all([
      fetch('/api/reservations'),
      fetch('/api/offres'),
      fetch('/api/parametres'),
      fetch('/api/charges-famille'),
    ])
    if (rr.ok) setReservations(await rr.json())
    if (ro.ok) setOffres(await ro.json())
    if (rp.ok) setParams(await rp.json())
    if (rc.ok) setCharges(await rc.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return reservations.filter(r =>
      (!filters.statut || r.statut === filters.statut) &&
      (!filters.source || r.source === filters.source) &&
      (!filters.type   || r.type   === filters.type)   &&
      (!q || r.reference?.toLowerCase().includes(q)
          || r.nom.toLowerCase().includes(q)
          || r.prenom.toLowerCase().includes(q)
          || r.telephone.includes(q))
    )
  }, [reservations, filters])

  // ── Statut: mise à jour locale optimiste + notification dashboard ──
  const patchLocal = useCallback((id: string, patch: Partial<ResWithOffre>) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    setDrawerItem(prev => prev && prev.id === id ? { ...prev, ...patch } : prev)
    window.dispatchEvent(new Event('reservations-changed'))
  }, [])

  // ── Année de naissance ───────────────────────────────────────────
  async function handleSaveAnnee(id: string, annee: number | null) {
    const res = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, annee_naissance: annee }),
    })
    if (!res.ok) { notify('Erreur lors de la sauvegarde.', 'error'); return }
    patchLocal(id, { annee_naissance: annee })
    notify('Année de naissance enregistrée.', 'success')
  }

  // ── Encaissement ───────────────────────────────────────────────
  async function handleSaveEncaissement(id: string, montant: number) {
    const res = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, encaissement: montant }),
    })
    if (!res.ok) { notify('Erreur lors de la sauvegarde de l\'encaissement.', 'error'); return }
    patchLocal(id, { encaissement: montant })
    notify('Encaissement enregistré.', 'success')
  }

  // ── Membres de la famille ─────────────────────────────────────
  async function handleSaveMembres(id: string, membres: Membre[]) {
    const oc = (drawerItem?.options_custom ?? {}) as Record<string, unknown>
    const options_custom = { ...oc, membres }
    const res = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, options_custom }),
    })
    if (!res.ok) { notify('Erreur lors de la sauvegarde des membres.', 'error'); return }
    patchLocal(id, { options_custom })
    notify('Membres de la famille enregistrés.', 'success')
  }

  // ── Confirm ───────────────────────────────────────────────────
  // Une réservation confirmée doit être validée par un encaissement (DA) > 0.
  function tryConfirm(r: ResWithOffre) {
    if (Number(r.encaissement) > 0) { handleConfirm(r); return }
    setConfirmItem(r)
    setConfirmAmount(String(r.prix_vente))
  }

  async function handleConfirm(r: ResWithOffre, encaissement?: number) {
    const body: Record<string, unknown> = { id: r.id, statut: 'confirmee', notif_confirmation_envoyee: false }
    if (encaissement != null) body.encaissement = encaissement
    const res = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { notify('Erreur de confirmation.', 'error'); return }
    patchLocal(r.id, {
      statut: 'confirmee', confirmed_at: new Date().toISOString(), notif_confirmation_envoyee: false,
      ...(encaissement != null ? { encaissement } : {}),
    })
    notify('Réservation confirmée.', 'success')
    // WhatsApp notify (en arrière-plan, ne bloque pas l'UI)
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO
    if (whatsapp) {
      fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: whatsapp, message: buildConfirmMsg(r) }),
      }).then(() => {
        fetch('/api/reservations', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: r.id, notif_confirmation_envoyee: true }),
        })
        patchLocal(r.id, { notif_confirmation_envoyee: true })
      }).catch(() => {})
    }
  }

  // ── Unconfirm (retour en attente) ────────────────────────────────
  async function handleUnconfirm(r: ResWithOffre) {
    const res = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, statut: 'en_attente', notif_confirmation_envoyee: false, confirmed_at: null }),
    })
    if (!res.ok) { notify('Erreur lors du changement de statut.', 'error'); return }
    patchLocal(r.id, { statut: 'en_attente', confirmed_at: null, notif_confirmation_envoyee: false })
    notify('Réservation remise en attente.', 'success')
  }

  // ── Cancel ────────────────────────────────────────────────────
  async function handleCancel() {
    if (!cancelItem) return
    const r = await fetch('/api/reservations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cancelItem.id, statut: 'annulee' }),
    })
    if (r.ok) { patchLocal(cancelItem.id, { statut: 'annulee' }); notify('Réservation annulée.', 'success') }
    else notify('Erreur lors de l\'annulation.', 'error')
    setCancelItem(null)
  }

  // ── Delete ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    const r = await fetch(`/api/reservations?id=${deleteId}`, { method: 'DELETE' })
    if (r.ok) {
      notify('Réservation supprimée.', 'success')
      setReservations(prev => prev.filter(x => x.id !== deleteId))
      window.dispatchEvent(new Event('reservations-changed'))
    }
    else notify('Erreur lors de la suppression.', 'error')
    setDeleteId(null)
  }

  // ── UI ────────────────────────────────────────────────────────
  const selCls = 'px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]'

  return (
    <div className="p-4 max-w-screen-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#003090] dark:text-white">Réservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} / {reservations.length} réservation{reservations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel(filtered)}
            className="flex items-center gap-2 px-4 py-2 border border-[#003090] text-[#003090] dark:text-white dark:border-white/40 rounded-lg text-sm font-medium hover:bg-[#e8ecf6] dark:hover:bg-white/5 transition-colors">
            <i className="ti ti-file-spreadsheet" aria-hidden="true" /> Exporter Excel
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ background: '#fdbe11', color: '#003090' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
            <i className="ti ti-plus" aria-hidden="true" /> Nouvelle réservation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-sm">
        <input type="search" placeholder="Réf / Nom / Téléphone…"
          value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]"
        />
        <select value={filters.statut} onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))} className={selCls}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="confirmee">Confirmée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} className={selCls}>
          <option value="">Toutes les sources</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className={selCls}>
          <option value="">Tous les types</option>
          <option value="standard">Standard</option>
          <option value="famille">Famille</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <i className="ti ti-loader-2 animate-spin text-3xl" aria-hidden="true" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <i className="ti ti-inbox text-3xl" aria-hidden="true" />
            <span className="text-sm">Aucune réservation trouvée</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f0f2f8] dark:bg-white/5 text-left">
                  {['Référence','Nom Prénom','Naissance','Téléphone','Offre','Composition','Transport','CDR','Prix vente','Encaissé','Marge','Statut','Source','Date','Actions']
                    .map(h => (
                      <th key={h} className="px-3 py-3 font-semibold text-[#003090] dark:text-[#fdbe11] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {filtered.map(r => {
                  const marge  = Number(r.marge)
                  const margeP = Number(r.prix_vente) > 0 ? (marge / Number(r.prix_vente)) * 100 : 0
                  return (
                    <tr key={r.id}
                      className="hover:bg-[#f8f9fd] dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setDrawerItem(r)}>
                      <td className="px-3 py-3 font-mono font-semibold text-[#003090] dark:text-[#7a9de8] whitespace-nowrap">
                        {r.reference}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {r.prenom} {r.nom}
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {r.annee_naissance ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {r.telephone}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
                        {r.offre?.nom ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {r.nb_adultes}A
                        {r.nb_enfants > 0 ? ` + ${r.nb_enfants}E` : ''}
                        {r.type === 'famille' && ((r.options_custom as { nb_bebes?: number } | null)?.nb_bebes ?? 0) > 0
                          ? ` + ${(r.options_custom as { nb_bebes?: number }).nb_bebes}B`
                          : ''}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        {r.offre?.transport_inclus ? (
                          <span className="text-green-600">✅ Inclus</span>
                        ) : r.transport ? (
                          <span className="text-blue-600">➕ Ajouté</span>
                        ) : (
                          <span className="text-gray-400">❌ Non</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {Number(r.cout_revient).toLocaleString('fr-DZ')} DA
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-[#003090] dark:text-[#7a9de8] whitespace-nowrap">
                        {Number(r.prix_vente).toLocaleString('fr-DZ')} DA
                      </td>
                      <td className="px-3 py-3 font-mono whitespace-nowrap">
                        {(() => {
                          const enc = Number(r.encaissement)
                          const pv  = Number(r.prix_vente)
                          const color = enc <= 0
                            ? 'text-gray-400'
                            : enc >= pv
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-500'
                          return <span className={color}>{enc.toLocaleString('fr-DZ')} DA</span>
                        })()}
                      </td>
                      <td className={`px-3 py-3 font-mono font-semibold whitespace-nowrap ${marge >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                        {margeP.toFixed(0)}%
                      </td>
                      <td className="px-3 py-3"><StatutBadge statut={r.statut} /></td>
                      <td className="px-3 py-3"><SourceBadge source={r.source} /></td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{dateStr(r.created_at)}</td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {r.statut === 'en_attente' && (
                            <button onClick={() => tryConfirm(r)}
                              className="p-1.5 text-green-500 hover:bg-white/5 rounded-lg transition-colors"
                              title="Confirmer">
                              <i className="ti ti-circle-check text-base" aria-hidden="true" />
                            </button>
                          )}
                          {r.statut === 'confirmee' && (
                            <button onClick={() => handleUnconfirm(r)}
                              className="p-1.5 text-amber-500 hover:bg-white/5 rounded-lg transition-colors"
                              title="Remettre en attente">
                              <i className="ti ti-rotate-2 text-base" aria-hidden="true" />
                            </button>
                          )}
                          {r.statut !== 'annulee' && (
                            <button onClick={() => setCancelItem(r)}
                              className="p-1.5 text-orange-400 hover:bg-white/5 rounded-lg transition-colors"
                              title="Annuler">
                              <i className="ti ti-ban text-base" aria-hidden="true" />
                            </button>
                          )}
                          <button onClick={() => setDrawerItem(r)}
                            className="p-1.5 text-[#7eb8ff] hover:bg-white/5 rounded-lg transition-colors"
                            title="Détail">
                            <i className="ti ti-eye text-base" aria-hidden="true" />
                          </button>
                          <button onClick={() => setDeleteId(r.id)}
                            className="p-1.5 text-red-500 hover:bg-white/5 rounded-lg transition-colors"
                            title="Supprimer">
                            <i className="ti ti-trash text-base" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerItem && <DrawerDetail key={drawerItem.id} r={drawerItem} onClose={() => setDrawerItem(null)} onSaveAnnee={handleSaveAnnee} onSaveMembres={handleSaveMembres} onSaveEncaissement={handleSaveEncaissement} />}

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          offres={offres} params={params} charges={charges}
          onSuccess={() => { setShowCreate(false); notify('Réservation créée.', 'success'); loadAll(); window.dispatchEvent(new Event('reservations-changed')) }}
          onClose={() => setShowCreate(false)}
          onError={(msg) => notify(msg, 'error')}
        />
      )}

      {/* Cancel modal */}
      {cancelItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <i className="ti ti-ban text-lg" style={{ color: '#f97316' }} aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Annuler la réservation ?</p>
                <p className="text-xs text-gray-500 font-mono">{cancelItem.reference}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelItem(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Retour
              </button>
              <button onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal — encaissement requis */}
      {confirmItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <i className="ti ti-cash text-lg" style={{ color: '#22c55e' }} aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Confirmer la réservation</p>
                <p className="text-xs text-gray-500 font-mono">{confirmItem.reference}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Une réservation confirmée doit être validée par un encaissement. Saisissez le montant reçu en DA.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Montant encaissé (DA) <span className="text-red-500">*</span></label>
              <input type="number" min={0.01} step="0.01" autoFocus required
                value={confirmAmount} onChange={e => setConfirmAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-[#003090] rounded-lg text-sm bg-white dark:bg-[#0a0f2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003090]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => {
                  const montant = parseFloat(confirmAmount)
                  if (!montant || montant <= 0) { notify('Le montant encaissé doit être supérieur à 0.', 'error'); return }
                  handleConfirm(confirmItem, montant)
                  setConfirmItem(null)
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <i className="ti ti-trash text-lg" style={{ color: '#ef4444' }} aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Supprimer la réservation ?</p>
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

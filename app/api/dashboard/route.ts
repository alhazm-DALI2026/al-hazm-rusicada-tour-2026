import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const [
    { data: reservations, error: errRes },
    { data: staffList,    error: errStaff },
    { data: fixesData,    error: errFixes },
  ] = await Promise.all([
    supabaseAdmin
      .from('reservation')
      .select('statut,type,nb_adultes,nb_enfants,prix_vente,cout_revient,marge'),
    supabaseAdmin
      .from('staff')
      .select('cout_revient,prime'),
    supabaseAdmin
      .from('moteur_cout')
      .select('libelle,montant')
      .eq('type', 'fixe_global')
      .eq('actif', true),
  ])

  if (errRes)   return Response.json({ error: errRes.message },   { status: 500 })
  if (errStaff) return Response.json({ error: errStaff.message }, { status: 500 })
  if (errFixes) return Response.json({ error: errFixes.message }, { status: 500 })

  const all   = reservations ?? []
  const staff = staffList    ?? []
  const fixes = fixesData    ?? []

  const confirmes = all.filter(r => r.statut === 'confirmee')
  const enAttente = all.filter(r => r.statut === 'en_attente')

  type Row = (typeof all)[number]

  const sum = (arr: Row[], key: keyof Row) =>
    arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)

  const participants = (arr: Row[]) =>
    arr.reduce((acc, r) => acc + (r.nb_adultes ?? 0) + (r.nb_enfants ?? 0), 0)

  const staffCout = staff.reduce(
    (acc, s) => acc + (Number(s.cout_revient) || 0) + (Number(s.prime) || 0),
    0,
  )

  const chargesFixesTotal = fixes.reduce((acc, c) => acc + (Number(c.montant) || 0), 0)

  const revenus_confirmes = sum(confirmes, 'prix_vente')
  const cdr_total         = sum(confirmes, 'cout_revient')
  const marge_brute       = revenus_confirmes - cdr_total

  return Response.json({
    confirmes: {
      count:        confirmes.length,
      standard:     confirmes.filter(r => r.type === 'standard').length,
      famille:      confirmes.filter(r => r.type === 'famille').length,
      participants: participants(confirmes),
      revenus:      revenus_confirmes,
      cdr:          cdr_total,
      marge:        sum(confirmes, 'marge'),
    },
    en_attente: {
      count:           enAttente.length,
      standard:        enAttente.filter(r => r.type === 'standard').length,
      famille:         enAttente.filter(r => r.type === 'famille').length,
      participants:    participants(enAttente),
      revenus_estimes: sum(enAttente, 'prix_vente'),
    },
    staff: {
      count:      staff.length,
      cout_total: staffCout,
    },
    charges_fixes: {
      total:  chargesFixesTotal,
      detail: fixes.map(c => ({ libelle: c.libelle, montant: Number(c.montant) })),
    },
    bilan: {
      revenus_confirmes,
      cdr_total,
      marge_brute,
      charges_fixes:  chargesFixesTotal,
      charges_staff:  staffCout,
      benefice_net:   marge_brute - chargesFixesTotal - staffCout,
    },
  })
}

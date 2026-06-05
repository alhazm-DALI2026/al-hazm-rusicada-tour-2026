import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const [{ data: reservations, error: errRes }, { data: staffList, error: errStaff }] =
    await Promise.all([
      supabaseAdmin.from('reservation').select('statut,nb_adultes,nb_enfants,prix_vente,cout_revient,marge'),
      supabaseAdmin.from('staff').select('cout_revient,prime'),
    ])

  if (errRes)   return Response.json({ error: errRes.message },   { status: 500 })
  if (errStaff) return Response.json({ error: errStaff.message }, { status: 500 })

  const all      = reservations ?? []
  const staff    = staffList    ?? []

  const confirmes  = all.filter(r => r.statut === 'confirmee')
  const enAttente  = all.filter(r => r.statut === 'en_attente')

  const sum = <K extends keyof (typeof all)[number]>(arr: typeof all, key: K) =>
    arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)

  const participants = (arr: typeof all) =>
    arr.reduce((acc, r) => acc + (r.nb_adultes ?? 0) + (r.nb_enfants ?? 0), 0)

  const staffCout = staff.reduce(
    (acc, s) => acc + (Number(s.cout_revient) || 0) + (Number(s.prime) || 0),
    0,
  )

  const revenus_confirmes = sum(confirmes, 'prix_vente')
  const cdr_total         = sum(confirmes, 'cout_revient')

  return Response.json({
    confirmes: {
      count:        confirmes.length,
      participants: participants(confirmes),
      revenus:      revenus_confirmes,
      cdr:          cdr_total,
      marge:        sum(confirmes, 'marge'),
    },
    en_attente: {
      count:            enAttente.length,
      participants:     participants(enAttente),
      revenus_estimes:  sum(enAttente, 'prix_vente'),
    },
    staff: {
      count:      staff.length,
      cout_total: staffCout,
    },
    bilan: {
      revenus_confirmes,
      cdr_total,
      charges_staff:  staffCout,
      benefice_net:   revenus_confirmes - cdr_total - staffCout,
    },
  })
}

import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculerOffreFamille } from '@/lib/calc'
import type { Parametres, RepasType, TypeChambre } from '@/types'

// ── Recalcul sécurisé CDR/PV pour les offres famille ─────────────────────────

async function recalcFamille(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data: params } = await supabaseAdmin
    .from('parametres')
    .select('*')
    .eq('id', 'default')
    .single<Parametres>()

  if (!params) return body

  const oc = ((body.options_custom ?? {}) as {
    type_chambre?:   TypeChambre
    nb_adultes?:     number
    nb_enfants?:     number
    nombre_nuits?:   number
    repas_type?:     RepasType
    avec_transport?: boolean
  })

  const calc = calculerOffreFamille(
    oc.type_chambre   ?? 'Double',
    oc.nb_adultes     ?? 2,
    oc.nb_enfants     ?? 0,
    oc.nombre_nuits   ?? 5,
    oc.repas_type     ?? 'complet',
    oc.avec_transport ?? false,
    params,
  )

  return { ...body, cout_revient: calc.cdrTotal, prix_vente: calc.pvTotal }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('offre')
    .select('*')
    .order('ordre_affichage', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  let body = await request.json() as Record<string, unknown>
  if (body.type_public === 'famille') body = await recalcFamille(body)

  const { data, error } = await supabaseAdmin
    .from('offre')
    .insert(body)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const { id, marge: _marge, ...fields } = await request.json() as Record<string, unknown> & { id?: string; marge?: unknown }
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })

  let updateFields: Record<string, unknown> = fields
  if (fields.type_public === 'famille') updateFields = await recalcFamille(fields)

  const { data, error } = await supabaseAdmin
    .from('offre')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('offre')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}

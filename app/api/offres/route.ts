import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculerFamilleV2 } from '@/lib/calc'
import type { ChargeFamille } from '@/lib/calc'

// ── Recalcul sécurisé CDR/PV pour les offres famille ─────────────────────────

async function recalcFamille(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data: charges } = await supabaseAdmin
    .from('charges_famille')
    .select('*')
    .order('ordre')

  if (!charges || charges.length === 0) return body

  const oc = (body.options_custom ?? {}) as {
    nb_adultes?: number
    nb_enfants?: number
    nb_bebes?:   number
  }

  const result = calculerFamilleV2(charges as ChargeFamille[], {
    nbAdultes:   Number(oc.nb_adultes   ?? body.nb_adultes   ?? 2),
    nbEnfants:   Number(oc.nb_enfants   ?? body.nb_enfants   ?? 0),
    nbBebes:     Number(oc.nb_bebes     ?? 0),
    nombreNuits: Number(body.nombre_nuits ?? 5),
    repas:       (body.repas_type as 'complet' | 'demi' | 'sans') ?? 'complet',
    transport:   Boolean(body.transport_inclus ?? false),
  })

  return {
    ...body,
    cout_revient: result.cdrTotal,
    prix_vente:   result.pvTotal,
    options_custom: {
      ...(oc as Record<string, unknown>),
      detail_cdr: result.detail,
    },
  }
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

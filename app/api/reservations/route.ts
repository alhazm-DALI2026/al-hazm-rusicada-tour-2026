import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type CoutItem = { montant?: number; type?: string; categorie?: string }

function transportSupplementFromCouts(
  couts: unknown[],
  nuits: number,
  jours: number,
): number {
  const tc = (couts as CoutItem[]).find(c => c?.categorie === 'transport')
  if (!tc?.montant) return 0
  switch (tc.type) {
    case 'par_nuit': return tc.montant * nuits
    case 'par_jour': return tc.montant * jours
    default:         return tc.montant
  }
}

export async function GET(request: NextRequest) {
  const statut = request.nextUrl.searchParams.get('statut')

  let query = supabaseAdmin
    .from('reservation')
    .select('*, offre(*)')
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  // marge et reference sont générés côté DB — on les exclut du body
  const { marge: _m, reference: _r, ...body } = await request.json()

  // Pour les réservations standard, recalculer prix_vente / cout_revient
  // en fonction du transport optionnel (source de vérité = offre en DB)
  if (body.offre_id && body.type === 'standard') {
    const { data: offre } = await supabaseAdmin
      .from('offre')
      .select('prix_vente, cout_revient, transport_inclus, transport_optionnel, nombre_nuits, nombre_jours, couts_inclus')
      .eq('id', body.offre_id)
      .single()

    if (offre) {
      const isOptional = offre.transport_optionnel && !offre.transport_inclus
      const supplement = isOptional
        ? transportSupplementFromCouts(
            Array.isArray(offre.couts_inclus) ? offre.couts_inclus : [],
            offre.nombre_nuits,
            offre.nombre_jours,
          )
        : 0
      const avecTransport = body.transport && isOptional

      body.prix_vente   = Number(offre.prix_vente)   + (avecTransport ? supplement : 0)
      body.cout_revient = Number(offre.cout_revient)  - (avecTransport ? 0 : supplement)
    }
  }

  const { data, error } = await supabaseAdmin
    .from('reservation')
    .insert(body)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const { id, marge: _marge, ...fields } = await request.json()
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })

  // Horodater la confirmation si le statut passe à 'confirmee'
  if (fields.statut === 'confirmee' && !fields.confirmed_at) {
    fields.confirmed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('reservation')
    .update(fields)
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
    .from('reservation')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}

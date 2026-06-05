import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

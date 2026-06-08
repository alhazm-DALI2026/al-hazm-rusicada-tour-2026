import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const payload = {
    nom:            body.nom,
    fonction:       body.fonction,
    type_chambre:   body.type_chambre,
    cout_revient:   body.cout_revient,
    prime:          body.prime,
    charges_custom: body.charges_custom ?? [],
  }

  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert(payload)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id } = body
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })

  const payload = {
    nom:            body.nom,
    fonction:       body.fonction,
    type_chambre:   body.type_chambre,
    cout_revient:   body.cout_revient,
    prime:          body.prime,
    charges_custom: body.charges_custom ?? [],
  }

  const { data, error } = await supabaseAdmin
    .from('staff')
    .update(payload)
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
    .from('staff')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}

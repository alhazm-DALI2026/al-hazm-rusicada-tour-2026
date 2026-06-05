import { type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { telephone, message } = await request.json()

  if (!telephone || !message) {
    return Response.json({ error: 'telephone et message requis' }, { status: 400 })
  }

  const apikey = process.env.CALLMEBOT_APIKEY
  if (!apikey) {
    return Response.json({ error: 'CALLMEBOT_APIKEY non configuré' }, { status: 503 })
  }

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(telephone)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(apikey)}`

  const res = await fetch(url)
  const text = await res.text()

  if (!res.ok) {
    return Response.json({ error: 'Échec CallMeBot', detail: text }, { status: 502 })
  }

  return Response.json({ ok: true, detail: text })
}

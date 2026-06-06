import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}))

  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD

  if (!validUser || !validPass) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const token = createHash('sha256').update(validPass).digest('hex')

  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })
  return res
}

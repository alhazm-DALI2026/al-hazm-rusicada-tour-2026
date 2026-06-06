import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'

const PROTECTED = [
  '/dashboard',
  '/moteur',
  '/offres',
  '/reservations',
  '/staff',
  '/parametres',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (!isProtected) return NextResponse.next()

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.redirect(new URL('/', request.url))

  const expected = createHash('sha256').update(adminPassword).digest('hex')
  const cookieVal = request.cookies.get('admin_auth')?.value

  if (cookieVal !== expected) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/moteur/:path*',
    '/offres/:path*',
    '/reservations/:path*',
    '/staff/:path*',
    '/parametres/:path*',
  ],
}

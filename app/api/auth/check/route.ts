import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const jar   = await cookies()
  const token = jar.get('admin_auth')?.value ?? ''
  const valid = createHash('sha256')
    .update(process.env.ADMIN_PASSWORD ?? '')
    .digest('hex')

  return NextResponse.json({ isAdmin: token !== '' && token === valid })
}

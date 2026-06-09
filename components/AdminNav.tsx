'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: 'ti-layout-dashboard' },
  { href: '/reservations', label: 'Réservations', icon: 'ti-calendar-check',  badge: true },
  { href: '/offres',       label: 'Offres',        icon: 'ti-ticket'           },
  { href: '/moteur',       label: 'Moteur',        icon: 'ti-calculator'       },
  { href: '/staff',        label: 'Staff',         icon: 'ti-users'            },
  { href: '/parametres',   label: 'Paramètres',    icon: 'ti-settings'         },
]

const BOTTOM = NAV.filter(n => n.href !== '/staff')

function SidebarContent({
  pathname, pending, onClose, onLogout,
}: {
  pathname: string
  pending:  number
  onClose?: () => void
  onLogout: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/images/logo-white.png"
            alt="Al Hazm"
            width={36} height={36}
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
              Al Hazm Admin
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.3 }}>
              Rusicada Tour 2026
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '10px 12px',
                borderRadius:   10,
                textDecoration: 'none',
                transition:     'all 0.2s',
                background:     active ? 'rgba(253,190,17,0.1)' : 'transparent',
                border:         active ? '1px solid rgba(253,190,17,0.2)' : '1px solid transparent',
                color:          active ? '#fdbe11' : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                }
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
              {item.badge && pending > 0 && (
                <span style={{
                  marginLeft:     'auto',
                  background:     '#ef4444',
                  color:          '#fff',
                  width:          18,
                  height:         18,
                  borderRadius:   '50%',
                  fontSize:       10,
                  fontWeight:     700,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                }}>
                  {pending > 9 ? '9+' : pending}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onLogout}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            color:      'rgba(239,68,68,0.6)',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            fontSize:   13,
            padding:    '8px 4px',
            width:      '100%',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')}
        >
          <i className="ti ti-logout" style={{ fontSize: 16 }} aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function AdminNav() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [pending,    setPending]    = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then((d: { en_attente?: { count: number } }) => setPending(d?.en_attente?.count ?? 0))
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const pageTitle = NAV.find(n => pathname.startsWith(n.href))?.label ?? 'Admin'

  return (
    <>
      {/* ── Desktop sidebar (≥1024px) ─────────────── */}
      <div
        className="hidden lg:flex lg:flex-col"
        style={{
          position:    'fixed',
          top:         0,
          left:        0,
          width:       260,
          height:      '100vh',
          background:  '#060a1e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex:      40,
          overflowY:   'auto',
        }}
      >
        <SidebarContent
          pathname={pathname}
          pending={pending}
          onLogout={handleLogout}
        />
      </div>

      {/* ── Mobile header (<1024px) ────────────────── */}
      <header
        className="lg:hidden"
        style={{
          position:       'sticky',
          top:            0,
          height:         56,
          zIndex:         40,
          background:     '#060a1e',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          padding:        '0 16px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/logo-white.png"
            alt="Al Hazm"
            width={28} height={28}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{pageTitle}</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Menu"
        >
          <i className="ti ti-menu-2" style={{ fontSize: 22 }} aria-hidden="true" />
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden">
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{
            position:   'fixed',
            top:        0,
            left:       0,
            bottom:     0,
            width:      260,
            zIndex:     91,
            background: '#060a1e',
            overflowY:  'auto',
          }}>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                position:   'absolute',
                top:        12,
                right:      12,
                color:      'rgba(255,255,255,0.5)',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    4,
                zIndex:     1,
              }}
              aria-label="Fermer"
            >
              <i className="ti ti-x" style={{ fontSize: 20 }} aria-hidden="true" />
            </button>
            <SidebarContent
              pathname={pathname}
              pending={pending}
              onClose={() => setDrawerOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavItem {
  href:   string
  label:  string
  icon:   string
  badge?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: 'ti-layout-dashboard' },
  { href: '/reservations', label: 'Réservations', icon: 'ti-calendar-event', badge: true },
  { href: '/offres',       label: 'Offres',        icon: 'ti-ticket' },
  { href: '/moteur',       label: 'Moteur',        icon: 'ti-calculator' },
  { href: '/staff',        label: 'Staff',         icon: 'ti-users' },
  { href: '/parametres',   label: 'Paramètres',    icon: 'ti-settings' },
]

function ShieldLogo() {
  return (
    <svg width="28" height="33" viewBox="0 0 28 33" fill="none" aria-hidden="true">
      <path
        d="M14 1L1 6.5V16c0 8.837 5.8 16.5 13 19 7.2-2.5 13-10.163 13-19V6.5L14 1z"
        fill="#003090"
        stroke="#fdbe11"
        strokeWidth="1.5"
      />
      <path
        d="M8 17l4 4 8-8"
        stroke="#fdbe11"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AdminNav() {
  const pathname              = usePathname()
  const router                = useRouter()
  const [pending, setPending] = useState(0)
  const [dark, setDark]       = useState(false)

  // Restore saved theme on mount
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  // Fetch pending reservations count
  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then((d: { en_attente?: { count: number } }) => {
        setPending(d?.en_attente?.count ?? 0)
      })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <header
      className="sticky top-0 z-50 bg-[var(--color-surface)] border-b-[3px] border-[#fdbe11] shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 mr-2">
          <ShieldLogo />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#003090] dark:text-white">
              Al Hazm Academy
            </span>
            <span className="text-xs text-[#fdbe11] font-semibold" dir="rtl">
              أكاديمية الحزم
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 flex-1" aria-label="Navigation admin">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#003090] text-white'
                    : 'text-[#003090] hover:bg-[#e8ecf6] dark:text-white dark:hover:bg-white/10'
                }`}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                <span className="hidden lg:inline">{item.label}</span>

                {item.badge && pending > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 rounded-full flex items-center justify-center px-0.5 leading-none">
                    {pending > 9 ? '9+' : pending}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#003090] hover:bg-[#e8ecf6] dark:text-white dark:hover:bg-white/10 transition-colors"
            title="Vue publique"
          >
            <i className="ti ti-eye" aria-hidden="true" />
            <span className="hidden lg:inline">Public</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#003090] hover:bg-[#e8ecf6] dark:text-white dark:hover:bg-white/10 transition-colors"
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Déconnexion"
          >
            <span>🚪</span>
            <span className="hidden lg:inline">Déconnexion</span>
          </button>
        </div>

      </div>
    </header>
  )
}

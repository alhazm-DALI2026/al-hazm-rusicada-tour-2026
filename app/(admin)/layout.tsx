import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Tabler Icons webfont — hoistée dans <head> par React 19 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
      />
      {/* Wrapper dark — force les classes dark: sur tous les enfants admin */}
      <div
        className="dark"
        style={{
          '--color-bg':          '#0a0f2e',
          '--color-surface':     'rgba(255,255,255,0.04)',
          '--admin-header-h':    '56px',
          '--admin-sidebar-w':   '260px',
          '--admin-bottomnav-h': '60px',
        } as React.CSSProperties}
      >
        <AdminNav />
        <main
          className="lg:ml-[260px] pt-[56px] lg:pt-0 pb-[68px] lg:pb-0"
          style={{ background: '#0a0f2e', minHeight: '100vh' }}
        >
          {children}
        </main>
      </div>
    </>
  )
}

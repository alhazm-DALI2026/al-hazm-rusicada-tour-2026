import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Tabler Icons webfont — hoistée dans <head> par React 19 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
      />
      <AdminNav />
      <main className="bg-bg min-h-screen">{children}</main>
    </>
  )
}

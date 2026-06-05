export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold text-[var(--color-blue)]">
        {process.env.NEXT_PUBLIC_NOM_EVENEMENT}
      </h1>
    </main>
  )
}

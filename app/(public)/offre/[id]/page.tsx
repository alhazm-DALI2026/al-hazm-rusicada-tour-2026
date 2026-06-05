export default async function OffrePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <main className="p-8"><h1 className="text-2xl font-bold">Offre {id}</h1></main>
}

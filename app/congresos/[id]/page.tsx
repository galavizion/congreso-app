import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CongresoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: congress } = await supabase
    .from('congresses')
    .select('*')
    .eq('id', id)
    .single()

  if (!congress) notFound()

  const { data: stands } = await supabase
    .from('stands')
    .select('*')
    .eq('congress_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">{congress.name}</h1>
        </div>
        <p className="text-sm text-gray-400 ml-8">
          {congress.start_date} → {congress.end_date}
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <div className="flex gap-3 mb-3">
          <Link
            href={`/congresos/${id}/stands/nuevo`}
            className="flex-1 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl text-center active:bg-gray-700 transition-colors"
          >
            + Nuevo stand
          </Link>
          <Link
            href={`/congresos/${id}/crear-admin`}
            className="flex-1 bg-white text-gray-700 text-sm font-medium px-4 py-3 rounded-xl text-center border border-gray-200 active:bg-gray-50 transition-colors"
          >
            + Admin
          </Link>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/congresos/${id}/horarios`}
            className="flex-1 bg-white text-gray-700 text-sm font-medium px-4 py-3 rounded-xl text-center border border-gray-200 active:bg-gray-50 transition-colors"
          >
            Horarios
          </Link>
          <Link
            href={`/congresos/${id}/mapa`}
            className="flex-1 bg-white text-gray-700 text-sm font-medium px-4 py-3 rounded-xl text-center border border-gray-200 active:bg-gray-50 transition-colors"
          >
            Mapa
          </Link>
        </div>
      </div>

      {/* Lista de stands */}
      <div className="px-4 pb-6 flex flex-col gap-3 max-w-2xl mx-auto">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Stands ({stands?.length ?? 0})
        </h2>

        {stands?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay stands aún. Crea el primero.
          </div>
        )}

        {stands?.map(stand => (
          <Link
            key={stand.id}
            href={`/congresos/${id}/stands/${stand.id}`}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900">{stand.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{stand.brand ?? 'Sin marca'}</p>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
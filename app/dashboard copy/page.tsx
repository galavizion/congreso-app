import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: congresses } = await supabase
    .from('congresses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WinWin</h1>
          <p className="text-xs text-gray-400">God Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/congresos/nuevo"
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl active:bg-gray-700 transition-colors"
          >
            + Nuevo
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Congresos ({congresses?.length ?? 0})
        </h2>

        {congresses?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay congresos aún. Crea el primero.
          </div>
        )}

        {congresses?.map(congress => (
          <Link
            key={congress.id}
            href={`/congresos/${congress.id}`}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900">{congress.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{congress.description ?? 'Sin descripción'}</p>
              <p className="text-xs text-gray-300 mt-1">
                {congress.start_date} → {congress.end_date}
              </p>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
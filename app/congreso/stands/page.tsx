import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CongresoStandsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, congresses(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'congress') redirect('/login')

  const congress = (profile as any).congresses

  const { data: stands } = await supabase
    .from('stands')
    .select('*')
    .eq('congress_id', congress.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/congreso/dashboard" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">Stands</h1>
        </div>
        <Link
          href="/congreso/stands/nuevo"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          + Nuevo
        </Link>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        <p className="text-sm text-gray-500">{congress?.name}</p>

        {stands?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay stands registrados aún.
          </div>
        )}

        {stands?.map(stand => (
          <div
            key={stand.id}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900">{stand.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{stand.brand ?? 'Sin marca'}</p>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </div>
        ))}

      </div>
    </div>
  )
}
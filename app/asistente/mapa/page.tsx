import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function MapaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'attendee') redirect('/login')

  // Obtener el congreso y su mapa
  const { data: congress } = await supabase
    .from('congresses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/asistente/inicio" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Mapa</h1>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {congress?.map_url ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <img
              src={congress.map_url}
              alt="Mapa del congreso"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            El mapa aún no está disponible.
          </div>
        )}
      </div>

    </div>
  )
}
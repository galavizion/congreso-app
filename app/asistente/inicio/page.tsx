import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AsistenteDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'attendee') redirect('/login')

  // Obtener puntos del asistente
  const { data: points } = await supabase
    .from('points')
    .select('*')
    .eq('attendee_id', user.id)

  const totalPoints = points?.reduce((acc, p) => acc + p.total_points, 0) ?? 0

  // Obtener cantidad de stands escaneados
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('attendee_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gray-900 px-4 py-6">
        <h1 className="text-xl font-bold text-white">WinWin</h1>
        <p className="text-gray-400 text-sm mt-0.5">Hola, {profile.name} 👋</p>

        {/* Puntos */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Tus puntos</p>
            <p className="text-white text-3xl font-bold mt-0.5">{totalPoints}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Stands visitados</p>
            <p className="text-white text-3xl font-bold mt-0.5">{leads?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <Link
          href="/asistente/horarios"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
            🗓️
          </div>
          <div>
            <p className="font-semibold text-gray-900">Horarios</p>
            <p className="text-sm text-gray-400">Conferencias del congreso</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/asistente/mapa"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">
            🗺️
          </div>
          <div>
            <p className="font-semibold text-gray-900">Mapa</p>
            <p className="text-sm text-gray-400">Encuentra los stands</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/asistente/stands"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
            🏪
          </div>
          <div>
            <p className="font-semibold text-gray-900">Stands</p>
            <p className="text-sm text-gray-400">Noticias y novedades</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/asistente/regalos"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl">
            🎁
          </div>
          <div>
            <p className="font-semibold text-gray-900">Regalos</p>
            <p className="text-sm text-gray-400">Canjea tus puntos</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

      </div>
    </div>
  )
}
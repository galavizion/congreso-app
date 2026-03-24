import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function CongresoDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  console.log('user:', user?.id)

  if (!user) {
    console.log('no user, redirecting')
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, congresses(*)')
    .eq('id', user.id)
    .single()

  console.log('profile:', profile?.role)

  if (!profile || profile.role !== 'congress') {
    console.log('no profile or wrong role, redirecting')
    redirect('/login')
  }

  const congress = (profile as any).congresses

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WinWin</h1>
          <p className="text-sm text-gray-400 mt-0.5">{congress?.name ?? 'Mi congreso'}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Menu */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <Link
          href="/congreso/stands"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
            🏪
          </div>
          <div>
            <p className="font-semibold text-gray-900">Stands</p>
            <p className="text-sm text-gray-400">Gestiona los expositores</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/congreso/horarios"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">
            🗓️
          </div>
          <div>
            <p className="font-semibold text-gray-900">Horarios</p>
            <p className="text-sm text-gray-400">Conferencias del evento</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/congreso/mapa"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
            🗺️
          </div>
          <div>
            <p className="font-semibold text-gray-900">Mapa</p>
            <p className="text-sm text-gray-400">Sube el plano del evento</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/congreso/regalos"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl">
            🎁
          </div>
          <div>
            <p className="font-semibold text-gray-900">Regalos</p>
            <p className="text-sm text-gray-400">Administra el catálogo</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/congreso/asistentes"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="font-semibold text-gray-900">Asistentes</p>
            <p className="text-sm text-gray-400">Lista de registrados</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

      </div>
    </div>
  )
}
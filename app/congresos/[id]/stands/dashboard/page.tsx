import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function StandDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, stands(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'stand') redirect('/login')

  const stand = (profile as any).stands

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">WinWin</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stand?.name ?? 'Mi stand'}</p>
      </div>

      {/* Menu */}
      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <Link
          href="/stand/mi-qr"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            📱
          </div>
          <div>
            <p className="font-semibold text-gray-900">Mi QR</p>
            <p className="text-sm text-gray-400">Muéstralo para capturar leads</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/stand/noticias"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            📢
          </div>
          <div>
            <p className="font-semibold text-gray-900">Noticias</p>
            <p className="text-sm text-gray-400">Publica updates de tu stand</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

        <Link
          href="/stand/leads"
          className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="font-semibold text-gray-900">Leads</p>
            <p className="text-sm text-gray-400">Asistentes que escanearon tu QR</p>
          </div>
          <span className="text-gray-300 text-xl ml-auto">›</span>
        </Link>

      </div>
    </div>
  )
}
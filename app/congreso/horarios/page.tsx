import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CongresoHorariosPage() {
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

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('congress_id', congress.id)
    .order('starts_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/congreso/dashboard" className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">Horarios</h1>
        </div>
        <Link
          href="/congreso/horarios/nuevo"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          + Nuevo
        </Link>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {schedules?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay conferencias programadas aún.
          </div>
        )}

        {schedules?.map(schedule => (
          <div key={schedule.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{schedule.title}</p>
                {schedule.speaker && (
                  <p className="text-sm text-gray-500 mt-0.5">{schedule.speaker}</p>
                )}
                {schedule.room && (
                  <p className="text-xs text-gray-400 mt-1">📍 {schedule.room}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-gray-700">
                  {schedule.starts_at
                    ? new Date(schedule.starts_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
                <p className="text-xs text-gray-400">
                  {schedule.ends_at
                    ? new Date(schedule.ends_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
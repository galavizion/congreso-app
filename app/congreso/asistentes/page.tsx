import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AsistentesPage() {
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

  // Asistentes con sus puntos
  const { data: attendees } = await supabase
    .from('profiles')
    .select('*, points(*)')
    .eq('congress_id', congress.id)
    .eq('role', 'attendee')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/congreso/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Asistentes</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total registrados</p>
            <p className="text-white text-3xl font-bold mt-0.5">{attendees?.length ?? 0}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>

        {attendees?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay asistentes registrados aún.
          </div>
        )}

        {attendees?.map(attendee => {
          const points = (attendee.points as any[]) ?? []
          const totalPoints = points.reduce((acc: number, p: any) => acc + p.total_points, 0)

          return (
            <div
              key={attendee.id}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{attendee.name ?? 'Sin nombre'}</p>
                <p className="text-sm text-gray-400">{attendee.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(attendee.created_at).toLocaleDateString('es-MX')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-amber-600 font-semibold">{totalPoints}</p>
                <p className="text-xs text-gray-400">puntos</p>
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
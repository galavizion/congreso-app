import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function LeadsPage() {
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

  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles(*)')
    .eq('stand_id', stand.id)
    .order('scanned_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/stand/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total de leads</p>
            <p className="text-white text-3xl font-bold mt-0.5">{leads?.length ?? 0}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>

        {leads?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            Aún no hay leads. Comparte tu QR con los asistentes.
          </div>
        )}

        {leads?.map(lead => (
          <div
            key={lead.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-900">
                {(lead.profiles as any)?.name ?? 'Sin nombre'}
              </p>
              <p className="text-sm text-gray-400">
                {(lead.profiles as any)?.email}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                {new Date(lead.scanned_at).toLocaleString('es-MX')}
              </p>
            </div>
            <span className="text-green-500 text-sm font-medium shrink-0">
              +{lead.points_awarded} pts
            </span>
          </div>
        ))}

      </div>
    </div>
  )
}
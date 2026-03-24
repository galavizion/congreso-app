import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function StandDetailPage({
  params,
}: {
  params: Promise<{ id: string; standId: string }>
}) {
  const { id, standId } = await params
  const supabase = await createClient()

  const { data: stand } = await supabase
    .from('stands')
    .select('*')
    .eq('id', standId)
    .single()

  if (!stand) notFound()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles(*)')
    .eq('stand_id', standId)
    .order('scanned_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-1">
          <Link href={`/congresos/${id}`} className="text-gray-400 text-xl">‹</Link>
          <h1 className="text-lg font-semibold text-gray-900">{stand.name}</h1>
        </div>
        <p className="text-sm text-gray-400 ml-8">{stand.brand}</p>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        {/* Info del stand */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-500">Información</p>
          <p className="text-sm text-gray-700">{stand.description ?? 'Sin descripción'}</p>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">QR Code</p>
            <p className="text-sm font-mono text-gray-600 mt-1">{stand.qr_code}</p>
          </div>
        </div>

        {/* Leads */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Leads ({leads?.length ?? 0})
        </h2>

        {leads?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            Aún no hay leads para este stand.
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
            <span className="text-green-500 text-sm font-medium">
              +{lead.points_awarded} pts
            </span>
          </div>
        ))}

      </div>
    </div>
  )
}
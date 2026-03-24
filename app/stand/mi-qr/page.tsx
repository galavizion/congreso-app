import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import QRCode from './QRCode'

export default async function MiQRPage() {
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
  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${stand?.qr_code}`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/stand/dashboard" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Mi QR</h1>
      </div>

      <div className="px-4 py-8 flex flex-col items-center gap-6 max-w-sm mx-auto">

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 w-full">
          <p className="font-semibold text-gray-900 text-lg">{stand?.name}</p>
          <p className="text-sm text-gray-400">{stand?.brand}</p>

          {/* QR */}
          <div className="p-4 bg-white border border-gray-100 rounded-xl">
            <QRCode value={qrValue} />
          </div>

          <p className="text-xs text-gray-400 text-center">
            Los asistentes escanean este QR para registrar su visita y ganar puntos
          </p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 w-full">
          <p className="text-sm text-amber-700 text-center font-medium">
            💡 Imprime este QR y colócalo en tu stand
          </p>
        </div>

      </div>
    </div>
  )
}
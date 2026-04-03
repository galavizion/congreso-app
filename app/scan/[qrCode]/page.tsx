import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ qrCode: string }>
}) {
  const { qrCode } = await params
  const supabase = await createClient()

  // Verificar que el QR existe
  const { data: stand } = await supabase
    .from('stands')
    .select('*, congresses(*)')
    .eq('qr_code', qrCode)
    .single()

  if (!stand) redirect('/login')

  // Verificar si hay sesión
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay sesión, mandar a registro con el QR en la URL
  if (!user) {
    redirect(`/login?qr=${qrCode}&congress=${stand.congress_id}`)
  }

  // Si ya tiene sesión, procesar el escaneo directamente
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'attendee') {
    redirect(`/login?qr=${qrCode}&congress=${stand.congress_id}`)
  }

  // Verificar si ya escaneó este stand
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('stand_id', stand.id)
    .eq('attendee_id', user.id)
    .single()

  if (!existingLead) {
    // Insertar lead
    await supabase.from('leads').insert({
      stand_id: stand.id,
      attendee_id: user.id,
      points_awarded: 10,
    })

    // Sumar puntos
    const { data: points } = await supabase
      .from('points')
      .select('*')
      .eq('attendee_id', user.id)
      .eq('congress_id', stand.congress_id)
      .single()

    if (points) {
      await supabase
        .from('points')
        .update({ total_points: points.total_points + 10 })
        .eq('id', points.id)
    } else {
      await supabase.from('points').insert({
        attendee_id: user.id,
        congress_id: stand.congress_id,
        total_points: 10,
      })
    }
  }

  // Redirigir al inicio del asistente
  redirect('/asistente/inicio')
}
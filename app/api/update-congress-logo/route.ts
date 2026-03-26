import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { congressId, logoUrl } = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabaseAdmin
      .from('congresses')
      .update({ logo_url: logoUrl })
      .eq('id', congressId)
      .select()

    if (error) {
      console.error('Error actualizando congreso:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Congreso actualizado:', data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error en endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
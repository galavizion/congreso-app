'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface StandForm {
  name: string
  brand: string
  description: string
  email: string
  password: string
  logo: File | null
}

export default function NuevoStandCongresPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<StandForm>({
    name: '',
    brand: '',
    description: '',
    email: '',
    password: '',
    logo: null,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setForm({ ...form, logo: file })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.congress_id) {
      setError('No se encontró el congreso')
      setLoading(false)
      return
    }

   // 1. Crear usuario en Auth (sin afectar sesión actual)
const response = await fetch('/api/create-stand-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: form.email,
    password: form.password,
  }),
})

const authResult = await response.json()

if (!response.ok || !authResult.user) {
  setError(authResult.error ?? 'Error al crear usuario')
  setLoading(false)
  return
}

const newUserId = authResult.user.id
console.log('✅ Usuario creado:', newUserId)


    // 2. Subir logo PRIMERO (si existe)
    let logoUrl: string | null = null

    if (form.logo) {
      try {
        const fileExt = form.logo.name.split('.').pop()
        const tempFileName = `temp-${Date.now()}.${fileExt}`
        
        console.log('🔵 Intentando subir:', tempFileName)
        console.log('🔵 Tamaño archivo:', form.logo.size, 'bytes')
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('stand_logos')
          .upload(tempFileName, form.logo, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Error upload:', uploadError)
        } else {
          console.log('✅ Upload exitoso:', uploadData)

          const { data: urlData } = supabase.storage
            .from('stand_logos')
            .getPublicUrl(tempFileName)
          
          logoUrl = urlData.publicUrl
          console.log('✅ URL pública:', logoUrl)
        }
      } catch (err) {
        console.error('❌ Error catch:', err)
      }
    }

    // 3. Crear stand CON logo_url desde el principio
    const { data: stand, error: standError } = await supabase
      .from('stands')
      .insert({
        congress_id: profile.congress_id,
        name: form.name,
        brand: form.brand,
        description: form.description,
        logo_url: logoUrl,
      })
      .select()
      .single()

    if (standError || !stand) {
      setError(standError?.message ?? 'Error al crear stand')
      setLoading(false)
      return
    }

    console.log('✅ Stand creado con logo:', stand.logo_url)

    // 4. Renombrar archivo con el ID del stand
 
if (logoUrl && form.logo) {
  const fileExt = form.logo.name.split('.').pop()
  const oldFileName = logoUrl.split('/').pop()
  const newFileName = `${stand.id}-${Date.now()}.${fileExt}`
  
  if (oldFileName) {
    const { error: moveError } = await supabase.storage
      .from('stand_logos')
      .move(oldFileName, newFileName)
    
    if (!moveError) {
      const { data: urlData } = supabase.storage
        .from('stand_logos')
        .getPublicUrl(newFileName)
      
      // Actualizar con el nombre final
      await supabase
        .from('stands')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', stand.id)
      
      console.log('✅ Logo renombrado:', newFileName)
    }
  }
}
 
   // 5. Crear perfil del stand
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: newUserId, // ✅ Usar el ID del nuevo usuario
    role: 'stand',
    name: form.name,
    email: form.email,
    congress_id: profile.congress_id,
    stand_id: stand.id,
  })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    console.log('✅ Stand creado correctamente')
    
    // ✅ Redirect que mantiene sesión
    window.location.href = '/congreso/stands'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">‹</button>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo stand</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-500">Datos del stand</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Stand Farmacéutica XYZ"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Marca</label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Ej. Farmacéutica XYZ"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Breve descripción del stand"
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Logo (opcional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {form.logo && (
              <p className="text-xs text-gray-500 mt-1">
                {form.logo.name} ({(form.logo.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-500">Acceso del expositor</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Correo</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@stand.com"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Contraseña temporal</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-50 w-full"
        >
          {loading ? 'Guardando...' : 'Crear stand'}
        </button>

      </div>
    </div>
  )
}
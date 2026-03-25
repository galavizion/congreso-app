'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface StandForm {
  name: string
  brand: string
  description: string
  logo: File | null
  currentLogoUrl: string | null
}

export default function EditarStandPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<StandForm>({
    name: '',
    brand: '',
    description: '',
    logo: null,
    currentLogoUrl: null,
  })

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'congress') {
        router.push('/login')
        return
      }

      const { data: stand } = await supabase
        .from('stands')
        .select('*')
        .eq('id', params.id)
        .eq('congress_id', profile.congress_id)
        .single()

      if (!stand) {
        router.push('/congreso/stands')
        return
      }

      setForm({
        name: stand.name || '',
        brand: stand.brand || '',
        description: stand.description || '',
        logo: null,
        currentLogoUrl: stand.logo_url || null,
      })

      setLoading(false)
    }
    load()
  }, [params.id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setForm({ ...form, logo: file })
  }

async function handleSubmit() {
  setSaving(true)
  setError('')

  let logoUrl = form.currentLogoUrl

  // Si hay nuevo logo, subirlo
  if (form.logo) {
    try {
      const fileExt = form.logo.name.split('.').pop()
      const fileName = `${params.id}-${Date.now()}.${fileExt}`

      console.log('🔵 Intentando subir:', fileName)
      console.log('🔵 Tamaño archivo:', form.logo.size, 'bytes')

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stand_logos')
        .upload(fileName, form.logo, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Error upload:', uploadError)
        setError(`Error subiendo logo: ${uploadError.message}`)
        setSaving(false)
        return
      }

      console.log('✅ Upload exitoso:', uploadData)

      const { data: urlData } = supabase.storage
        .from('stand_logos')
        .getPublicUrl(fileName)

      logoUrl = urlData.publicUrl
      console.log('✅ URL pública:', logoUrl)

      // Opcional: borrar logo anterior si existe
      if (form.currentLogoUrl) {
        const oldFileName = form.currentLogoUrl.split('/').pop()
        if (oldFileName) {
          console.log('🗑️ Borrando logo anterior:', oldFileName)
          await supabase.storage
            .from('stand_logos')
            .remove([oldFileName])
        }
      }

    } catch (err) {
      console.error('❌ Error catch:', err)
      setError('Error procesando logo')
      setSaving(false)
      return
    }
  }

  // Actualizar stand
  console.log('🔵 Actualizando stand con logo_url:', logoUrl)

  const { error: updateError } = await supabase
    .from('stands')
    .update({
      name: form.name,
      brand: form.brand,
      description: form.description,
      logo_url: logoUrl,
    })
    .eq('id', params.id)

  if (updateError) {
    console.error('❌ Error update:', updateError)
    setError(updateError.message)
    setSaving(false)
    return
  }

  console.log('✅ Stand actualizado correctamente')
  window.location.href = `/congreso/stands/${params.id}`
}


  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href={`/congreso/stands/${params.id}`}
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Editar Stand</h1>
              <p className="text-sm text-white/80 mt-0.5">Actualiza la información del expositor</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-4 max-w-5xl mx-auto">

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-700">Datos del stand</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Stand Farmacéutica XYZ"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Marca</label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Ej. Farmacéutica XYZ"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
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
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Logo</label>

            {form.currentLogoUrl && !form.logo && (
              <div className="mb-2">
                <img
                  src={form.currentLogoUrl}
                  alt="Logo actual"
                  className="w-20 h-20 rounded-lg object-cover border border-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1">Logo actual</p>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-indigo-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />

            {form.logo && (
              <p className="text-xs text-gray-500 mt-1">
                Nuevo: {form.logo.name} ({(form.logo.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-indigo-600 text-white text-sm font-semibold px-5 py-4 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 w-full"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CongresoMapaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [congressId, setCongressId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'congress') { router.push('/login'); return }

      const { data: congress } = await supabase
        .from('congresses')
        .select('*')
        .eq('id', profile.congress_id)
        .single()

      setCongressId(congress?.id ?? null)
      setMapUrl(congress?.map_url ?? null)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !congressId) return

    setUploading(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const fileName = `mapa-${congressId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('mapas')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('mapas')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('congresses')
      .update({ map_url: urlData.publicUrl })
      .eq('id', congressId)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setMapUrl(urlData.publicUrl)
    setUploading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/congreso/dashboard"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Mapa del Congreso</h1>
              <p className="text-sm text-white/80 mt-0.5">Sube el plano del evento</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-emerald-400"></div>
      </div>

      <div className="px-6 py-8 flex flex-col gap-4 max-w-5xl mx-auto">

        {/* Mapa actual */}
        {mapUrl ? (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img
              src={mapUrl}
              alt="Mapa del congreso"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗺️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay mapa subido</h3>
            <p className="text-sm text-gray-500">Sube el plano del evento para los asistentes</p>
          </div>
        )}

        {/* Upload */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">
            {mapUrl ? 'Reemplazar mapa' : 'Subir mapa'}
          </p>
          <p className="text-xs text-gray-400">
            Acepta imágenes JPG, PNG o PDF escaneado
          </p>

          <label className="bg-indigo-600 text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-center cursor-pointer disabled:opacity-50">
            {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

      </div>
    </div>
  )
}

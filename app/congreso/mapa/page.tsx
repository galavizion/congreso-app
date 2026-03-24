'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">‹</button>
        <h1 className="text-lg font-semibold text-gray-900">Mapa del congreso</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        {/* Mapa actual */}
        {mapUrl ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <img
              src={mapUrl}
              alt="Mapa del congreso"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay mapa subido aún.
          </div>
        )}

        {/* Upload */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-600">
            {mapUrl ? 'Reemplazar mapa' : 'Subir mapa'}
          </p>
          <p className="text-xs text-gray-400">
            Acepta imágenes JPG, PNG o PDF escaneado
          </p>

          <label className="bg-gray-900 text-white rounded-xl px-4 py-3 text-base font-medium text-center cursor-pointer active:bg-gray-700 transition-colors">
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

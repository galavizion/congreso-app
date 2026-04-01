'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ThemeColors = {
  header_from: string
  header_to: string
  header_text: string
  background: string
  accent: string
  divider_color: string
}

const defaultColors: ThemeColors = {
  header_from: '#987BA6',
  header_to: '#94BBE9',
  header_text: '#FFFFFF',
  background: '#FAFAFA',
  accent: '#EF4444',
  divider_color: '#F43F5E'
}

export default function TemaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [congressId, setCongressId] = useState<string | null>(null)
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'congress') { router.push('/login'); return }

    setCongressId(profile.congress_id)

    const { data: congress } = await supabase
      .from('congresses')
      .select('theme_colors')
      .eq('id', profile.congress_id)
      .single()

    if (congress?.theme_colors) {
      setColors({ ...defaultColors, ...congress.theme_colors })
    }

    setLoading(false)
  }

  async function handleSave() {
    if (!congressId) return
    setSaving(true)

    const { error } = await supabase
      .from('congresses')
      .update({ theme_colors: colors })
      .eq('id', congressId)

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      alert('✅ Tema guardado correctamente')
    }

    setSaving(false)
  }

  function handleReset() {
    if (confirm('¿Restaurar colores por defecto?')) {
      setColors(defaultColors)
    }
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
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header con preview */}
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/congress/dashboard"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              style={{ color: colors.header_text }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>
                Personalizar Tema
              </h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>
                Configura los colores de tu congreso
              </p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        
        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <p className="text-sm text-blue-700">
            💡 Los cambios se aplicarán en toda la aplicación para todos los usuarios del congreso
          </p>
        </div>

        {/* Controles de color */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Colores del tema</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Header gradient from */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header - Color inicial
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.header_from}
                  onChange={(e) => setColors({ ...colors, header_from: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.header_from}
                  onChange={(e) => setColors({ ...colors, header_from: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#987BA6"
                />
              </div>
            </div>

            {/* Header gradient to */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header - Color final
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.header_to}
                  onChange={(e) => setColors({ ...colors, header_to: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.header_to}
                  onChange={(e) => setColors({ ...colors, header_to: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#94BBE9"
                />
              </div>
            </div>

            {/* Header text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto del header
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.header_text}
                  onChange={(e) => setColors({ ...colors, header_text: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.header_text}
                  onChange={(e) => setColors({ ...colors, header_text: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fondo de la app
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.background}
                  onChange={(e) => setColors({ ...colors, background: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.background}
                  onChange={(e) => setColors({ ...colors, background: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#FAFAFA"
                />
              </div>
            </div>

            {/* Accent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de acento
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#EF4444"
                />
              </div>
            </div>

            {/* Divider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Línea divisora
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.divider_color}
                  onChange={(e) => setColors({ ...colors, divider_color: e.target.value })}
                  className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.divider_color}
                  onChange={(e) => setColors({ ...colors, divider_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  placeholder="#F43F5E"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Preview card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Vista previa</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }} className="p-4">
              <p className="font-bold" style={{ color: colors.header_text }}>Ejemplo de Header</p>
              <p className="text-sm mt-1" style={{ color: colors.header_text, opacity: 0.8 }}>Subtítulo del header</p>
            </div>
            <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
            <div className="p-6" style={{ backgroundColor: colors.background }}>
              <button 
                className="px-4 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: colors.accent }}
              >
                Botón de ejemplo
              </button>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Restaurar por defecto
          </button>
        </div>

      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ThemeColors = {
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

export function useTheme(congressId: string | null) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadTheme() {
      if (!congressId) {
        setLoading(false)
        return
      }

      const { data: congress } = await supabase
        .from('congresses')
        .select('theme_colors')
        .eq('id', congressId)
        .single()

      if (congress?.theme_colors) {
        setColors({ ...defaultColors, ...congress.theme_colors })
      }

      setLoading(false)
    }

    loadTheme()
  }, [congressId])

  // Aplicar colores como CSS variables
  useEffect(() => {
    if (!loading) {
      document.documentElement.style.setProperty('--header-from', colors.header_from)
      document.documentElement.style.setProperty('--header-to', colors.header_to)
      document.documentElement.style.setProperty('--header-text', colors.header_text)
      document.documentElement.style.setProperty('--background', colors.background)
      document.documentElement.style.setProperty('--accent', colors.accent)
      document.documentElement.style.setProperty('--divider', colors.divider_color)
    }
  }, [colors, loading])

  return { colors, loading }
}
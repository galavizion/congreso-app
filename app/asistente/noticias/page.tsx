'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type News = {
  id: string
  congress_id: string
  stand_id: string | null
  title: string
  content: string
  image_url: string | null
  published_at: string
  author_name?: string
  author_logo?: string
}

export default function NoticiasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [news, setNews] = useState<News[]>([])
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

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

    if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

    // Cargar noticias del congreso
    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .eq('congress_id', profile.congress_id)
      .order('published_at', { ascending: false })

    if (!newsData) {
      setLoading(false)
      return
    }

    // Cargar datos del congreso
    const { data: congressData } = await supabase
      .from('congresses')
      .select('name, logo_url')
      .eq('id', profile.congress_id)
      .single()

    // Cargar datos de stands
    const standIds = [...new Set(newsData.filter(n => n.stand_id).map(n => n.stand_id!))]
    let standsMap: Record<string, any> = {}

    if (standIds.length > 0) {
      const { data: standsData } = await supabase
        .from('stands')
        .select('id, name, logo_url')
        .in('id', standIds)

      if (standsData) {
        standsMap = Object.fromEntries(standsData.map(s => [s.id, s]))
      }
    }

    // Enriquecer noticias con autor
    const enrichedNews = newsData.map(n => ({
      ...n,
      author_name: n.stand_id ? standsMap[n.stand_id]?.name : congressData?.name,
      author_logo: n.stand_id ? standsMap[n.stand_id]?.logo_url : congressData?.logo_url
    }))

    setNews(enrichedNews)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  // Vista de detalle
  if (selectedNews) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 max-w-5xl mx-auto">
              <button
                onClick={() => setSelectedNews(null)}
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Noticia</h1>
                <p className="text-sm text-white/80 mt-0.5">{selectedNews.author_name}</p>
              </div>
            </div>
          </div>
          <div className="h-1 bg-blue-400"></div>
        </div>

        <div className="px-6 py-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Imagen */}
            {selectedNews.image_url && (
              <div className="relative w-full h-64 bg-gray-100">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              {/* Autor y fecha */}
              <div className="flex items-center gap-2 mb-4">
                {selectedNews.author_logo && (
                  <div className="relative w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    <img
                      src={selectedNews.author_logo}
                      alt={selectedNews.author_name || 'Logo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedNews.author_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedNews.published_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Contenido */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedNews.title}</h2>
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNews.content}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista de lista
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Noticias</h1>
              <p className="text-sm text-white/80 mt-0.5">Novedades del congreso</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-blue-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {news.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin noticias</h3>
            <p className="text-sm text-gray-500">No hay noticias publicadas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="w-full bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all flex items-center gap-4 text-left"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">📰</span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.author_name}</p>
                </div>

                {/* Flecha */}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Stand = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  booth_number: string | null
  category: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
}

type News = {
  id: string
  title: string
  content: string
  image_url: string | null
  published_at: string
}

export default function AsistenteStandsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stands, setStands] = useState<Stand[]>([])
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  const [standNews, setStandNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingNews, setLoadingNews] = useState(false)

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

    // Cargar stands del congreso
    const { data: standsData } = await supabase
      .from('stands')
      .select('*')
      .eq('congress_id', profile.congress_id)
      .order('name', { ascending: true })

    setStands(standsData ?? [])
    setLoading(false)
  }

  async function viewStandDetail(stand: Stand) {
    setSelectedStand(stand)
    setLoadingNews(true)

    // Cargar noticias del stand
    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .eq('stand_id', stand.id)
      .order('published_at', { ascending: false })

    setStandNews(newsData ?? [])
    setLoadingNews(false)
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
  if (selectedStand) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="bg-gradient-to-r from-[#987BA6] to-[#94BBE9]">
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 max-w-5xl mx-auto">
              <button
                onClick={() => setSelectedStand(null)}
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{selectedStand.name}</h1>
                {selectedStand.booth_number && (
                  <p className="text-sm text-white/80 mt-0.5">Stand #{selectedStand.booth_number}</p>
                )}
              </div>
            </div>
          </div>
          <div className="h-1 bg-cyan-400"></div>
        </div>

        <div className="px-6 py-8 max-w-5xl mx-auto">
          {/* Info del stand */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
            <div className="flex items-start gap-4 mb-4">
              {selectedStand.logo_url ? (
                <img
                  src={selectedStand.logo_url}
                  alt={selectedStand.name}
                  className="w-20 h-20 rounded-lg object-cover border border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <span className="text-4xl">🏪</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{selectedStand.name}</h2>
                {selectedStand.category && (
                  <p className="text-sm text-gray-500 mt-0.5">{selectedStand.category}</p>
                )}
              </div>
            </div>

            {selectedStand.description && (
              <p className="text-sm text-gray-700 mb-4">{selectedStand.description}</p>
            )}

            {/* Contacto */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              {selectedStand.website && (
                <a
                  href={selectedStand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <span>🌐</span>
                  <span>{selectedStand.website}</span>
                </a>
              )}
              {selectedStand.contact_email && (
                <a
                  href={`mailto:${selectedStand.contact_email}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  <span>✉️</span>
                  <span>{selectedStand.contact_email}</span>
                </a>
              )}
              {selectedStand.contact_phone && (
                <a
                  href={`tel:${selectedStand.contact_phone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  <span>📞</span>
                  <span>{selectedStand.contact_phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Noticias del stand */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Noticias</h3>
            
            {loadingNews ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : standNews.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">📰</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Sin noticias</h3>
                <p className="text-sm text-gray-500">Este stand no ha publicado noticias aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {standNews.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                  >
                    {item.image_url && (
                      <div className="relative w-full h-48 bg-gray-100">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-gray-400 mb-2">
                        {new Date(item.published_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vista de grid
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
              <h1 className="text-xl font-bold text-white">Stands</h1>
              <p className="text-sm text-white/80 mt-0.5">Descubre los expositores</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-cyan-400"></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {stands.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin stands</h3>
            <p className="text-sm text-gray-500">No hay stands registrados aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stands.map(stand => (
              <button
                key={stand.id}
                onClick={() => viewStandDetail(stand)}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                {/* Logo */}
                <div className="w-20 h-20 rounded-lg bg-gray-50 overflow-hidden mb-3 border border-gray-100">
                  {stand.logo_url ? (
                    <img
                      src={stand.logo_url}
                      alt={stand.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">🏪</span>
                    </div>
                  )}
                </div>

                {/* Nombre */}
                <p className="font-semibold text-gray-900 text-sm line-clamp-2">{stand.name}</p>
                
                {/* Booth number */}
                {stand.booth_number && (
                  <p className="text-xs text-gray-400 mt-1">Stand #{stand.booth_number}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
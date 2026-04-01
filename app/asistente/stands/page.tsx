'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'

type Stand = {
  id: string
  name: string
  brand: string | null
  description: string | null
  logo_url: string | null
  booth_number: string | null
  category: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  tiktok: string | null
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
  const [profile, setProfile] = useState<any>(null)
  const [stands, setStands] = useState<Stand[]>([])
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  const [standNews, setStandNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingNews, setLoadingNews] = useState(false)

  // Cargar tema
  const { colors } = useTheme(profile?.congress_id)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profileData || profileData.role !== 'attendee') { router.push('/login'); return }

    setProfile(profileData)

    // Cargar stands del congreso
    const { data: standsData } = await supabase
      .from('stands')
      .select('*')
      .eq('congress_id', profileData.congress_id)
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  // Vista de detalle
  if (selectedStand) {
    const hasSocial = selectedStand.facebook || selectedStand.instagram || selectedStand.linkedin || selectedStand.tiktok

    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 max-w-5xl mx-auto">
              <button
                onClick={() => setSelectedStand(null)}
                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                style={{ color: colors.header_text }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>{selectedStand.name}</h1>
                {selectedStand.booth_number && (
                  <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Stand #{selectedStand.booth_number}</p>
                )}
              </div>
            </div>
          </div>
          <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
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
                {selectedStand.brand && (
                  <p className="text-sm text-gray-600 mt-0.5">{selectedStand.brand}</p>
                )}
                {selectedStand.category && (
                  <p className="text-xs text-gray-500 mt-1">{selectedStand.category}</p>
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
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: colors.accent }}
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

            {/* Redes sociales */}
            {hasSocial && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <p className="text-xs font-medium text-gray-600 mb-3">Síguenos:</p>
                <div className="flex items-center gap-3">
                  {selectedStand.facebook && (
                    <a
                      href={selectedStand.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {selectedStand.instagram && (
                    <a
                      href={selectedStand.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors"
                      title="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {selectedStand.linkedin && (
                    <a
                      href={selectedStand.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {selectedStand.tiktok && (
                    <a
                      href={selectedStand.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                      title="TikTok"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Noticias del stand */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Noticias</h3>
            
            {loadingNews ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: colors.accent }}></div>
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
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div style={{ background: `linear-gradient(to right, ${colors.header_from}, ${colors.header_to})` }}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Link
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              style={{ color: colors.header_text }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Stands</h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Descubre los expositores</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
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
                
                {/* Brand */}
                {stand.brand && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{stand.brand}</p>
                )}
                
                {/* Booth number */}
                {stand.booth_number && (
                  <p className="text-xs text-gray-400 mt-1">#{stand.booth_number}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AsistenteStandsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'attendee') redirect('/login')

  // Obtener stands con sus últimas noticias
  const { data: stands } = await supabase
    .from('stands')
    .select('*, stand_posts(*)')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/asistente/inicio" className="text-gray-400 text-xl">‹</Link>
        <h1 className="text-lg font-semibold text-gray-900">Stands</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">

        {stands?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
            No hay stands registrados aún.
          </div>
        )}

        {stands?.map(stand => {
          const posts = (stand.stand_posts as any[]) ?? []
          const lastPost = posts.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          return (
            <div key={stand.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* Stand header */}
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{stand.name}</p>
                    <p className="text-sm text-gray-400">{stand.brand}</p>
                  </div>
                  {posts.length > 0 && (
                    <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1 rounded-full">
                      {posts.length} {posts.length === 1 ? 'noticia' : 'noticias'}
                    </span>
                  )}
                </div>
              </div>

              {/* Última noticia */}
              {lastPost ? (
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-gray-700">{lastPost.title}</p>
                  {lastPost.body && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lastPost.body}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(lastPost.created_at).toLocaleString('es-MX')}
                  </p>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-400">Sin noticias por ahora</p>
                </div>
              )}

            </div>
          )
        })}

      </div>
    </div>
  )
}

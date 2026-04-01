'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/hooks/useTheme'
import jsQR from 'jsqr'

export default function EscanearPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [congressId, setCongressId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; points?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cargar tema
  const { colors } = useTheme(profile?.congress_id)

  useEffect(() => {
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
      setAttendeeId(profileData.id)
      setCongressId(profileData.congress_id)
      setLoading(false)
    }
    load()
  }, [])

  async function startCamera() {
    console.log('🎥 Intentando abrir cámara...')
    console.log('📱 navigator.mediaDevices disponible:', !!navigator.mediaDevices)
    console.log('📱 getUserMedia disponible:', !!navigator.mediaDevices?.getUserMedia)
    
    // Primero cambiar a modo scanning para renderizar el video
    setScanning(true)
    
    try {
      console.log('🔄 Solicitando permisos de cámara...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      console.log('✅ Stream obtenido:', stream)
      console.log('📹 Video tracks:', stream.getVideoTracks())
      
      // Esperar a que el video se monte
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (videoRef.current) {
        console.log('✅ videoRef existe, asignando stream...')
        videoRef.current.srcObject = stream
        streamRef.current = stream
        console.log('✅ Cámara iniciada correctamente')
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata cargada, iniciando escaneo...')
          // Dar tiempo extra para que el video esté completamente listo
          setTimeout(() => {
            console.log('🚀 Ejecutando scanQR()...')
            scanQR()
          }, 500)
        }
      } else {
        console.error('❌ videoRef.current es null después de esperar')
        setScanning(false)
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error)
      console.error('❌ Error name:', (error as any)?.name)
      console.error('❌ Error message:', (error as any)?.message)
      alert('No se pudo acceder a la cámara. Verifica los permisos. Error: ' + (error as any)?.message)
      setScanning(false)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  async function scanQR() {
    console.log('🎬 scanQR() llamado, scanning:', scanning)
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ Refs no disponibles')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      console.log('❌ No hay context')
      return
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('⏳ Video no listo, esperando...')
      setTimeout(scanQR, 100)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    console.log('🔍 Escaneando frame...', {
      width: imageData.width,
      height: imageData.height,
      dataLength: imageData.data.length
    })
    
    // Escanear QR con jsQR
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth'
    })
    
    if (code && code.data) {
      console.log('✅ QR detectado:', code.data)
      console.log('📍 Posición:', code.location)
      await processQR(code.data)
      return
    }

    // Continuar escaneando
    requestAnimationFrame(scanQR)
  }

  async function processQR(qrData: string) {
    if (!attendeeId || !congressId) return

    stopCamera()

    try {
      // Extraer stand_id de la URL si viene como URL completa
      let standId = qrData
      
      // Si el QR es una URL, extraer el ID del final
      if (qrData.includes('scan/')) {
        const parts = qrData.split('scan/')
        standId = parts[parts.length - 1]
        console.log('🔍 Stand ID extraído de URL:', standId)
      }

      console.log('🎯 Procesando stand_id:', standId)

      // Verificar que el stand existe y es del congreso correcto
      const { data: stand, error: standError } = await supabase
        .from('stands')
        .select('*')
        .eq('id', standId)
        .eq('congress_id', congressId)
        .single()

      if (standError || !stand) {
        console.error('❌ Error buscando stand:', standError)
        setResult({ success: false, message: 'QR inválido o stand no encontrado' })
        return
      }

      console.log('✅ Stand encontrado:', stand.name)

      // Verificar si ya visitó este stand
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('stand_id', standId)
        .eq('attendee_id', attendeeId)
        .maybeSingle()

      if (existingLead) {
        setResult({ success: false, message: 'Ya visitaste este stand' })
        return
      }

      // Puntos a otorgar
      const pointsToAward = 10

      // Crear lead
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          stand_id: standId,
          attendee_id: attendeeId,
          points_awarded: pointsToAward
        })

      if (leadError) {
        setResult({ success: false, message: 'Error al registrar visita: ' + leadError.message })
        return
      }

      // Sumar puntos al perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', attendeeId)
        .single()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: (profileData?.points ?? 0) + pointsToAward })
        .eq('id', attendeeId)

      if (updateError) {
        setResult({ success: false, message: 'Error al actualizar puntos: ' + updateError.message })
        return
      }

      setResult({ 
        success: true, 
        message: `¡Visita registrada en ${stand.name}!`,
        points: pointsToAward
      })

    } catch (error) {
      console.error('Error processing QR:', error)
      setResult({ success: false, message: 'Error al procesar QR' })
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: colors.accent }}></div>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

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
              <h1 className="text-xl font-bold" style={{ color: colors.header_text }}>Escanear QR</h1>
              <p className="text-sm mt-0.5" style={{ color: colors.header_text, opacity: 0.8 }}>Visita stands y gana puntos</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: colors.divider_color }}></div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        
        {/* Resultado */}
        {result && (
          <div className={`mb-6 rounded-xl p-6 text-center ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-4xl">{result.success ? '✓' : '✗'}</span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '¡Éxito!' : 'Error'}
            </h3>
            <p className={`text-sm mb-4 ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.success && result.points && (
              <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 mb-4">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold text-amber-600">+{result.points} puntos</span>
              </div>
            )}
            <button
              onClick={() => {
                setResult(null)
                if (result.success) {
                  router.push('/asistente/inicio')
                }
              }}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                result.success 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {result.success ? 'Volver al inicio' : 'Intentar de nuevo'}
            </button>
          </div>
        )}

        {/* Cámara o botón */}
        {!result && (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            {scanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[60vh] object-cover bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Marco de escaneo */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-white rounded-2xl shadow-lg"></div>
                </div>

                <button
                  onClick={stopCamera}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${colors.accent}15` }}>
                  <span className="text-5xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Escanea el QR del stand</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Gana 10 puntos por cada stand que visites
                </p>
                <button
                  onClick={startCamera}
                  className="w-full text-white font-semibold px-6 py-4 rounded-lg transition-colors mb-4"
                  style={{ backgroundColor: colors.accent }}
                >
                  Abrir cámara
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
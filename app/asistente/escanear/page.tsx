'use client'

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import jsQR from 'jsqr'

export default function EscanearPage() {
  const router = useRouter()
  const supabase = createClient()
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [congressId, setCongressId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; points?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'attendee') { router.push('/login'); return }

      setAttendeeId(profile.id)
      setCongressId(profile.congress_id)
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
          scanQR()
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
    if (!videoRef.current || !canvasRef.current || !scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
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

    if (scanning) {
      requestAnimationFrame(scanQR)
    }
  }

  async function processQR(qrData: string) {
    if (!attendeeId || !congressId) return

    stopCamera()

    try {
      // El QR debe contener el stand_id
      const standId = qrData

      // Verificar que el stand existe y es del congreso correcto
      const { data: stand } = await supabase
        .from('stands')
        .select('*')
        .eq('id', standId)
        .eq('congress_id', congressId)
        .single()

      if (!stand) {
        setResult({ success: false, message: 'QR inválido o stand no encontrado' })
        return
      }

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

      // Puntos a otorgar (puedes hacerlo configurable)
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', attendeeId)
        .single()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: (profile?.points ?? 0) + pointsToAward })
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

  // Función para probar sin cámara (desarrollo)
  async function testScan() {
    // Aquí puedes poner un stand_id real para probar
    const testStandId = 'd4ba4c3f-a636-4461-b196-1c2d0522b016' // Reemplaza con un ID real
    await processQR(testStandId)
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
              href="/asistente/inicio"
              className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Escanear QR</h1>
              <p className="text-sm text-white/80 mt-0.5">Visita stands y gana puntos</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-indigo-400"></div>
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
                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Escanea el QR del stand</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Gana 10 puntos por cada stand que visites
                </p>
                <button
                  onClick={startCamera}
                  className="w-full bg-indigo-600 text-white font-semibold px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors mb-4"
                >
                  Abrir cámara
                </button>

                {/* Botón de prueba (solo desarrollo) */}
                <button
                  onClick={testScan}
                  className="w-full bg-gray-100 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  🧪   (desarrollo)
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
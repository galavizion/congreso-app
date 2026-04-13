import { useState } from 'react'
import { useImageCompression } from '@/hooks/useImageCompression'
import Image from 'next/image'

interface ImageUploadOptimizedProps {
  onImageSelect: (file: File) => void
  currentImage?: string | null
  label?: string
  maxSizeMB?: number
  maxDimension?: number
  acceptedTypes?: string
}

export function ImageUploadOptimized({
  onImageSelect,
  currentImage,
  label = 'Imagen',
  maxSizeMB = 1,
  maxDimension = 800,
  acceptedTypes = 'image/*'
}: ImageUploadOptimizedProps) {
  const { compressImage, isCompressing } = useImageCompression()
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState('')

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }

    // Validar tamaño antes de comprimir
    const maxBeforeCompression = maxSizeMB * 1024 * 1024 * 3 // 3x el tamaño final
    if (file.size > maxBeforeCompression) {
      setError(`La imagen es demasiado grande. Máximo ${maxSizeMB * 3}MB.`)
      return
    }

    setError('')

    try {
      // Comprimir
      const compressed = await compressImage(file, {
        maxSizeMB,
        maxWidthOrHeight: maxDimension,
        quality: 0.85,
      })

      // Validar resultado
      if (compressed.size > maxSizeMB * 1024 * 1024) {
        setError(`La imagen sigue siendo muy grande. Intenta con una más pequeña.`)
        return
      }

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)

      // Pasar al padre
      onImageSelect(compressed)
    } catch (err) {
      setError('Error al procesar la imagen')
      console.error(err)
    }
  }

  function removeImage() {
    setPreview(null)
    setError('')
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {!preview ? (
        <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors">
          <input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isCompressing}
          />
          <div className="flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isCompressing ? 'Comprimiendo...' : 'Click para subir imagen'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG hasta {maxSizeMB}MB • Se optimizará automáticamente
              </p>
            </div>
          </div>
        </label>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={300}
            className="w-full h-48 object-contain bg-gray-50"
          />
          <button
            onClick={removeImage}
            type="button"
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {isCompressing && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Optimizando imagen...</span>
        </div>
      )}
    </div>
  )
}
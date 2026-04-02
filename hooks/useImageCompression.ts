import { useState } from 'react'

interface CompressImageOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
}

export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false)

  const compressImage = async (
    file: File,
    options: CompressImageOptions = {}
  ): Promise<File> => {
    const {
      maxSizeMB = 4,
      maxWidthOrHeight = 1920,
      quality = 0.8,
    } = options

    setIsCompressing(true)

    try {
      // Si ya es menor a 4MB y no es muy grande, retornar sin comprimir
      if (file.size <= maxSizeMB * 1024 * 1024) {
        const img = await createImageBitmap(file)
        if (img.width <= maxWidthOrHeight && img.height <= maxWidthOrHeight) {
          setIsCompressing(false)
          return file
        }
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          const img = new Image()
          
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            // Calcular nuevas dimensiones manteniendo aspect ratio
            if (width > height) {
              if (width > maxWidthOrHeight) {
                height = (height * maxWidthOrHeight) / width
                width = maxWidthOrHeight
              }
            } else {
              if (height > maxWidthOrHeight) {
                width = (width * maxWidthOrHeight) / height
                height = maxWidthOrHeight
              }
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('No se pudo crear el contexto del canvas'))
              return
            }

            ctx.drawImage(img, 0, 0, width, height)

            // Comprimir
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Error al comprimir la imagen'))
                  return
                }

                // Crear nuevo File
                const compressedFile = new File(
                  [blob],
                  file.name,
                  {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }
                )

                setIsCompressing(false)
                resolve(compressedFile)
              },
              'image/jpeg',
              quality
            )
          }

          img.onerror = () => {
            setIsCompressing(false)
            reject(new Error('Error al cargar la imagen'))
          }

          img.src = e.target?.result as string
        }

        reader.onerror = () => {
          setIsCompressing(false)
          reject(new Error('Error al leer el archivo'))
        }

        reader.readAsDataURL(file)
      })
    } catch (error) {
      setIsCompressing(false)
      throw error
    }
  }

  return { compressImage, isCompressing }
}
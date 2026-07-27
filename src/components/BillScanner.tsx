'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Upload, Loader2, X, AlertCircle, Info } from 'lucide-react'
import ScanReviewModal, { ScannedItem } from './ScanReviewModal'

interface BillScannerProps {
  onItemsConfirmed: (items: Array<{ name: string; price: number; quantity: number }>) => void
  disabled?: boolean
}

// Check if we're in Telegram Mini App
function isTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp
}

// Check if we're on iOS
function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Serverless platforms cap request bodies around 4.5MB, and base64 adds ~33%
// overhead, so keep the encoded image comfortably under that.
const MAX_DIMENSION = 1568
const MAX_UPLOAD_BYTES = 2.5 * 1024 * 1024

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

// Downscale and re-encode the image so the base64 payload stays under the
// server's request body limit. Phone cameras produce 4000px+ photos that
// otherwise get rejected with a 413.
async function compressImage(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let quality = 0.85
  let blob = await canvasToJpeg(canvas, quality)
  while (blob && blob.size > MAX_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.15
    blob = await canvasToJpeg(canvas, quality)
  }
  if (!blob) throw new Error('Failed to encode image')
  return blob
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(blob)
  })
}

export default function BillScanner({
  onItemsConfirmed,
  disabled = false,
}: BillScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isTelegramIOS, setIsTelegramIOS] = useState(false)
  const [isTelegram, setIsTelegram] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Check if we're in Telegram
    const inTelegram = isTelegramMiniApp()
    setIsTelegram(inTelegram)
    // Check if we're in Telegram on iOS - camera won't work at all
    setIsTelegramIOS(inTelegram && isIOS())
  }, [])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      setCameraStream(stream)
      setShowCamera(true)

      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Please use the Upload button instead.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    // Convert to blob and process
    canvas.toBlob(async (blob) => {
      if (!blob) return

      stopCamera()

      // Create preview
      const previewUrl = URL.createObjectURL(blob)
      setPreviewUrl(previewUrl)

      try {
        const compressed = await compressImage(blob)
        const base64 = await blobToBase64(compressed)
        await sendToApi(base64, 'image/jpeg')
      } catch (err) {
        console.error('Image processing error:', err)
        setError('Failed to process photo. Please try again.')
        setPreviewUrl(null)
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  const processImage = async (file: File) => {
    setError(null)

    // Generous limit — the image is compressed before upload
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Please use an image under 20MB.')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid image format. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreviewUrl(previewUrl)

    try {
      const compressed = await compressImage(file)
      const base64 = await blobToBase64(compressed)
      await sendToApi(base64, 'image/jpeg')
    } catch (err) {
      console.error('Image processing error:', err)
      setError('Failed to read image file.')
      setPreviewUrl(null)
    }
  }

  const sendToApi = async (
    base64: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  ) => {
    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          mediaType,
        }),
      })

      // Error responses may be plain text (e.g. "Request Entity Too Large"
      // from the platform), so don't assume JSON
      const text = await response.text()
      let data: { error?: string; items?: ScannedItem[]; warnings?: string[] } | null = null
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Photo is too large to upload. Please try again with a smaller image.')
        }
        throw new Error(data?.error || `Failed to scan bill (error ${response.status}). Please try again.`)
      }

      if (!data) {
        throw new Error('Unexpected response from server. Please try again.')
      }

      if (data.items && data.items.length > 0) {
        setScannedItems(data.items)
        setWarnings(data.warnings || [])
        setShowReviewModal(true)
      } else {
        setError('No items found in the image. Try a clearer photo or add items manually.')
      }
    } catch (err) {
      console.error('Scan error:', err)
      setError(err instanceof Error ? err.message : 'Failed to scan bill. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleConfirmItems = (items: Array<{ name: string; price: number; quantity: number }>) => {
    onItemsConfirmed(items)
    setShowReviewModal(false)
    setPreviewUrl(null)
    setScannedItems([])
    setWarnings([])
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setError(null)
  }

  return (
    <>
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="text-blue-600 dark:text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
          <h3 className="text-sm font-medium dark:text-gray-100">Scan Bill</h3>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Preview */}
        {previewUrl && !isScanning && (
          <div className="mb-3 relative">
            <img
              src={previewUrl}
              alt="Bill preview"
              className="w-full max-h-32 object-contain rounded-md border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={clearPreview}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isScanning && (
          <div className="mb-3 p-4 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Scanning bill...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This may take a few seconds</p>
          </div>
        )}

        {/* Camera Viewfinder for Telegram */}
        {showCamera && (
          <div className="mb-3 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-md bg-black"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
            />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
              <button
                onClick={stopCamera}
                className="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700"
              >
                <X size={24} />
              </button>
              <button
                onClick={capturePhoto}
                className="p-4 bg-white rounded-full hover:bg-gray-100 border-4 border-gray-300"
              >
                <div className="w-8 h-8 bg-red-500 rounded-full" />
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* iOS Telegram Warning */}
        {isTelegramIOS && !showCamera && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Camera not available on iOS</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Telegram on iOS doesn&apos;t support camera access. Please use the Upload button to select a photo from your gallery, or open this app in Safari for camera access.
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        {!isScanning && !showCamera && (
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Upload size={16} className="text-gray-600 dark:text-gray-300" />
              <span className="text-gray-700 dark:text-gray-200">Upload</span>
            </button>
            {!isTelegramIOS && (
              <button
                onClick={() => {
                  if (isTelegram) {
                    startCamera()
                  } else {
                    cameraInputRef.current?.click()
                  }
                }}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Camera size={16} />
                <span>Take Photo</span>
              </button>
            )}
          </div>
        )}

        {disabled && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Add at least one person to enable scanning
          </p>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Review Modal */}
      <ScanReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          clearPreview()
        }}
        items={scannedItems}
        onConfirm={handleConfirmItems}
        warnings={warnings}
      />
    </>
  )
}

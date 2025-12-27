'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, Loader2, X, AlertCircle } from 'lucide-react'
import ScanReviewModal, { ScannedItem } from './ScanReviewModal'

interface BillScannerProps {
  onItemsConfirmed: (items: Array<{ name: string; price: number; quantity: number }>) => void
  disabled?: boolean
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processImage = async (file: File) => {
    setError(null)

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Please use an image under 5MB.')
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

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      await sendToApi(base64, file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    }
    reader.onerror = () => {
      setError('Failed to read image file.')
      setPreviewUrl(null)
    }
    reader.readAsDataURL(file)
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan bill')
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

        {/* Buttons */}
        {!isScanning && (
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Upload size={16} className="text-gray-600 dark:text-gray-300" />
              <span className="text-gray-700 dark:text-gray-200">Upload</span>
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Camera size={16} />
              <span>Take Photo</span>
            </button>
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

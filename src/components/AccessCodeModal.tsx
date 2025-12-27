'use client'

import React, { useState } from 'react'
import { X, Lock, AlertCircle } from 'lucide-react'

interface AccessCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AccessCodeModal({
  isOpen,
  onClose,
  onSuccess,
}: AccessCodeModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)

    try {
      const response = await fetch('/api/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        // Store in session storage so user doesn't need to re-enter
        sessionStorage.setItem('scanAccessGranted', 'true')
        onSuccess()
        setCode('')
      } else {
        setError('Invalid access code. Please try again.')
      }
    } catch {
      setError('Failed to verify. Please try again.')
    }

    setIsValidating(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold dark:text-gray-100">
              Access Required
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter the access code to enable bill scanning feature.
          </p>

          {error && (
            <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter access code"
            autoFocus
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 mb-4"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || isValidating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

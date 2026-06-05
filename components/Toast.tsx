'use client'

import { useEffect } from 'react'

interface ToastProps {
  message:   string
  type:      'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <i
        className={`ti ${type === 'success' ? 'ti-circle-check' : 'ti-circle-x'} text-lg`}
        aria-hidden="true"
      />
      {message}
    </div>
  )
}

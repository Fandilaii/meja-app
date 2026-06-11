'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Meja] Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-terra-light flex items-center justify-center text-3xl mb-5">
        😕
      </div>
      <h1 className="font-display font-bold text-ink text-2xl mb-2">
        Ada yang salah
      </h1>
      <p className="text-sm font-sans text-ink/60 max-w-xs mb-7">
        Terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-[9999px] bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  )
}

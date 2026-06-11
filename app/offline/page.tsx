'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-3xl mb-5">
        📡
      </div>
      <h1 className="font-display font-bold text-ink text-2xl mb-2">
        Kamu Sedang Offline
      </h1>
      <p className="text-sm font-sans text-ink/60 max-w-xs mb-7">
        Cek koneksi internetmu, lalu muat ulang halaman ini.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-[9999px] bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
      >
        Muat Ulang
      </button>
    </div>
  )
}

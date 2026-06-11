import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-sand flex items-center justify-center mb-6">
        <span className="font-display font-bold text-5xl text-gold leading-none">4</span>
        <span className="text-4xl mx-1">🪑</span>
        <span className="font-display font-bold text-5xl text-gold leading-none">4</span>
      </div>
      <h1 className="font-display font-bold text-ink text-2xl mb-2">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-sm font-sans text-ink/60 max-w-xs mb-7">
        Sepertinya meja yang kamu cari sudah terisi — atau tidak pernah ada.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-[9999px] bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}

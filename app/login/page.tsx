'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { signIn, onAuthStateChange } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true) // checking existing session
  const [error,    setError]    = useState<string | null>(null)

  // If already signed-in, skip straight to dashboard
  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
    return unsub
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Email atau kata sandi salah.')
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.')
      } else if (code === 'auth/user-disabled') {
        setError('Akun ini telah dinonaktifkan.')
      } else {
        setError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  // While checking auth session, show blank ink screen (no flash)
  if (checking) {
    return <div className="min-h-screen bg-ink" />
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
      {/* Brand */}
      <div className="mb-10 text-center">
        <div className="font-display font-bold text-4xl text-cream mb-1">
          Meja<span className="text-gold">.</span>
        </div>
        <p className="text-cream/60 font-sans text-sm">Dashboard Restoran</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="font-display font-semibold text-xl text-cream mb-1">
          Masuk ke Dashboard
        </h1>
        <p className="text-cream/50 font-sans text-sm mb-7">
          Kelola reservasi dan meja restoranmu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-sans font-medium text-cream/70 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@restoran.id"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-cream font-sans text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-sans font-medium text-cream/70 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/8 border border-white/15 text-cream font-sans text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
                aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-terra/15 border border-terra/30">
              <p className="text-sm font-sans text-[#FFAD9E]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gold text-white font-sans font-semibold text-sm hover:bg-gold-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Memuat…' : 'Masuk'}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-[11px] font-sans text-cream/30">
        Hanya untuk manajer restoran terdaftar.
      </p>
    </div>
  )
}

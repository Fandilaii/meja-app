'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Pencil, Check, ChevronRight } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import SavedRestaurantCard from '@/components/SavedRestaurantCard'
import { getRestaurant } from '@/lib/firestore'
import {
  getGuestProfile, saveGuestProfile, GuestProfile,
  getSavedRestaurantIds, toggleSavedRestaurant,
  getReservationIds,
} from '@/lib/localStorage'
import type { Restaurant } from '@/types'
import { Separator } from '@/components/ui/separator'

function initials(name: string): string {
  return name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'MJ'
}

const APP_LINKS = [
  { label: 'Syarat & Ketentuan' },
  { label: 'Kebijakan Privasi'  },
  { label: 'Tentang Meja'       },
]

export default function ProfilPage() {
  const [profile, setProfile]             = useState<GuestProfile>({ name: '', phone: '' })
  const [editingName, setEditingName]     = useState(false)
  const [editingPhone, setEditingPhone]   = useState(false)
  const [tempName, setTempName]           = useState('')
  const [tempPhone, setTempPhone]         = useState('')
  const [savedRestaurants, setSaved]      = useState<Restaurant[]>([])
  const [reservationCount, setResCount]   = useState(0)
  const [favoriteArea, setFavArea]        = useState<string | null>(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const p = getGuestProfile() ?? { name: '', phone: '' }
    setProfile(p)
    setTempName(p.name)
    setTempPhone(p.phone)
    setResCount(getReservationIds().length)

    async function loadSaved() {
      const ids = getSavedRestaurantIds()
      const restaurants = await Promise.all(ids.map((id) => getRestaurant(id)))
      setSaved(restaurants.filter(Boolean) as Restaurant[])
      setLoading(false)
    }
    loadSaved()
  }, [])

  // Compute favorite area from saved restaurants
  useEffect(() => {
    if (savedRestaurants.length === 0) { setFavArea(null); return }
    const tally: Record<string, number> = {}
    savedRestaurants.forEach((r) => { tally[r.area] = (tally[r.area] ?? 0) + 1 })
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
    setFavArea(top?.[0] ?? null)
  }, [savedRestaurants])

  function saveName() {
    const updated = { ...profile, name: tempName.trim() }
    setProfile(updated); saveGuestProfile(updated); setEditingName(false)
  }

  function savePhone() {
    const updated = { ...profile, phone: tempPhone.trim() }
    setProfile(updated); saveGuestProfile(updated); setEditingPhone(false)
  }

  function handleRemoveSaved(id: string) {
    toggleSavedRestaurant(id)
    setSaved((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Hero */}
      <div className="bg-ink px-4 pt-12 pb-8 text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-gold flex items-center justify-center mx-auto">
          <span className="font-display font-bold text-white text-2xl">
            {initials(profile.name)}
          </span>
        </div>
        <h1 className="font-display font-bold text-cream text-xl mt-3">
          {profile.name || 'Tamu Meja'}
        </h1>
        <p className="text-sm font-sans text-cream/70 mt-0.5">
          {profile.phone || 'Tambah nomor WhatsApp'}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Profile edit card */}
        <div className="bg-white rounded-2xl border border-meja-border divide-y divide-meja-border">
          {/* Name row */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-sans text-ink/60 uppercase tracking-wider">Nama Lengkap</p>
              {editingName ? (
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  className="mt-1 w-full text-sm font-sans text-ink border border-meja-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              ) : (
                <p className="text-sm font-sans font-medium text-ink mt-0.5">{profile.name || '—'}</p>
              )}
            </div>
            <button
              onClick={() => editingName ? saveName() : setEditingName(true)}
              className="p-2 rounded-lg hover:bg-sand transition-colors text-ink/60 hover:text-ink"
            >
              {editingName ? <Check size={16} className="text-forest" /> : <Pencil size={15} />}
            </button>
          </div>

          {/* Phone row */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-sans text-ink/60 uppercase tracking-wider">Nomor WhatsApp</p>
              {editingPhone ? (
                <input
                  autoFocus
                  type="tel"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && savePhone()}
                  placeholder="08123456789"
                  className="mt-1 w-full text-sm font-sans text-ink border border-meja-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              ) : (
                <p className="text-sm font-sans font-medium text-ink mt-0.5">{profile.phone || '—'}</p>
              )}
            </div>
            <button
              onClick={() => editingPhone ? savePhone() : setEditingPhone(true)}
              className="p-2 rounded-lg hover:bg-sand transition-colors text-ink/60 hover:text-ink"
            >
              {editingPhone ? <Check size={16} className="text-forest" /> : <Pencil size={15} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sand rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-ink">{reservationCount}</p>
            <p className="text-[11px] font-sans text-ink/60 mt-1">total reservasi</p>
          </div>
          <div className="bg-sand rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-ink">{favoriteArea ?? '—'}</p>
            <p className="text-[11px] font-sans text-ink/60 mt-1">area tersimpan</p>
          </div>
        </div>

        {/* Saved restaurants */}
        <div>
          <h2 className="font-display font-semibold text-ink text-lg mb-3">Restoran Tersimpan</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-sand animate-pulse" />)}
            </div>
          ) : savedRestaurants.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-meja-border">
              <p className="text-sm font-sans text-ink/60">Belum ada restoran tersimpan</p>
              <p className="text-xs font-sans text-ink/60/60 mt-1">Tap ♥ di restoran favoritmu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedRestaurants.map((r) => (
                <SavedRestaurantCard key={r.id} restaurant={r} onRemove={handleRemoveSaved} />
              ))}
            </div>
          )}
        </div>

        {/* App links */}
        <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
          {APP_LINKS.map((link, i) => (
            <div key={link.label}>
              {i > 0 && <Separator />}
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-sand transition-colors">
                <span className="text-sm font-sans text-ink">{link.label}</span>
                <ChevronRight size={15} className="text-ink/60" />
              </button>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-sans text-ink/60">Versi Aplikasi</span>
            <span className="text-sm font-sans text-ink/60">1.0.0</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

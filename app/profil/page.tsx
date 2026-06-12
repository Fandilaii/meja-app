'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Pencil, Check, ChevronRight, CalendarDays, Users } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import SavedRestaurantCard from '@/components/SavedRestaurantCard'
import { getRestaurant, getReservationsByIds } from '@/lib/firestore'
import {
  getGuestProfile, saveGuestProfile, GuestProfile,
  getSavedRestaurantIds, toggleSavedRestaurant,
  getReservationIds,
} from '@/lib/localStorage'
import type { Restaurant, Reservation } from '@/types'
import { Separator } from '@/components/ui/separator'

function initials(name: string): string {
  return name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'MJ'
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-gold-light',   text: 'text-[#5C3E10]', label: 'Menunggu'      },
  confirmed: { bg: 'bg-forest-light', text: 'text-forest',    label: 'Dikonfirmasi'  },
  arrived:   { bg: 'bg-sand',         text: 'text-ink/60',    label: 'Selesai'       },
  cancelled: { bg: 'bg-terra-light',  text: 'text-[#7A2E12]', label: 'Dibatalkan'    },
}

function ReservationRow({
  reservation,
  restaurant,
}: {
  reservation: Reservation
  restaurant:  Restaurant | null
}) {
  const badge = STATUS_BADGE[reservation.status] ?? STATUS_BADGE.pending
  return (
    <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sand flex items-center justify-center font-display font-bold text-gold text-sm flex-shrink-0">
          {restaurant?.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-medium text-ink truncate">
            {restaurant?.name ?? 'Restoran'}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-sans text-ink/50">
              <CalendarDays size={10} />
              {formatDate(reservation.date)} · {reservation.timeSlot}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-sans text-ink/50">
              <Users size={10} />
              {reservation.guestCount} org
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>
      <div className="px-4 pb-3 flex items-center justify-between">
        <code className="text-[11px] font-mono text-ink/40 tracking-wider">
          {reservation.referenceCode}
        </code>
        {reservation.restaurantId && (
          <Link
            href={`/restaurant/${reservation.restaurantId}`}
            className="text-[11px] font-sans font-medium text-gold hover:underline"
          >
            Reservasi Lagi →
          </Link>
        )}
      </div>
    </div>
  )
}

const APP_LINKS = [
  { label: 'Syarat & Ketentuan' },
  { label: 'Kebijakan Privasi'  },
  { label: 'Tentang Meja'       },
]

export default function ProfilPage() {
  const [profile, setProfile]           = useState<GuestProfile>({ name: '', phone: '' })
  const [editingName, setEditingName]   = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [tempName, setTempName]         = useState('')
  const [tempPhone, setTempPhone]       = useState('')
  const [savedRestaurants, setSaved]    = useState<Restaurant[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [restaurantMap, setRestMap]     = useState<Record<string, Restaurant>>({})
  const [favoriteArea, setFavArea]      = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const p = getGuestProfile() ?? { name: '', phone: '' }
    setProfile(p)
    setTempName(p.name)
    setTempPhone(p.phone)

    async function loadAll() {
      const [savedIds, reservationIds] = [getSavedRestaurantIds(), getReservationIds()]

      const [savedRests, fetchedRes] = await Promise.all([
        Promise.all(savedIds.map((id) => getRestaurant(id))),
        reservationIds.length > 0 ? getReservationsByIds(reservationIds) : Promise.resolve([]),
      ])

      const saved = savedRests.filter(Boolean) as Restaurant[]
      setSaved(saved)
      setReservations(fetchedRes)

      // Build restaurant map for reservations
      const uniqueRestIds = [...new Set(fetchedRes.map((r) => r.restaurantId))]
      const restDocs = await Promise.all(uniqueRestIds.map((id) => getRestaurant(id)))
      const map: Record<string, Restaurant> = {}
      restDocs.forEach((r) => { if (r) map[r.id] = r })
      setRestMap(map)

      setLoading(false)
    }
    loadAll()
  }, [])

  useEffect(() => {
    if (savedRestaurants.length === 0) { setFavArea(null); return }
    const tally: Record<string, number> = {}
    savedRestaurants.forEach((r) => { tally[r.area] = (tally[r.area] ?? 0) + 1 })
    setFavArea(Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
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

  const today = todayString()
  const upcoming = reservations.filter(
    (r) => (r.status === 'pending' || r.status === 'confirmed') && r.date >= today
  ).sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot))

  const history = reservations.filter(
    (r) => r.status === 'arrived' || r.status === 'cancelled' || r.date < today
  ).sort((a, b) => b.date.localeCompare(a.date))

  const totalVisits = reservations.filter((r) => r.status === 'arrived').length
  const totalGuests = reservations
    .filter((r) => r.status === 'arrived')
    .reduce((s, r) => s + r.guestCount, 0)

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
            <p className="font-display font-bold text-2xl text-ink">{totalVisits}</p>
            <p className="text-[11px] font-sans text-ink/60 mt-1">total kunjungan</p>
          </div>
          <div className="bg-sand rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-ink">{totalGuests}</p>
            <p className="text-[11px] font-sans text-ink/60 mt-1">total tamu dibawa</p>
          </div>
        </div>

        {/* Reservation history */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-sand animate-pulse" />)}
          </div>
        ) : reservations.length > 0 ? (
          <div>
            <h2 className="font-display font-semibold text-ink text-lg mb-3">Riwayat Reservasi</h2>

            {upcoming.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-2">Mendatang</p>
                <div className="space-y-2">
                  {upcoming.map((r) => (
                    <ReservationRow key={r.id} reservation={r} restaurant={restaurantMap[r.restaurantId] ?? null} />
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div>
                <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-2">Riwayat</p>
                <div className="space-y-2">
                  {history.slice(0, 10).map((r) => (
                    <ReservationRow key={r.id} reservation={r} restaurant={restaurantMap[r.restaurantId] ?? null} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

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
              <p className="text-xs font-sans text-ink/40 mt-1">Tap ♥ di restoran favoritmu</p>
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

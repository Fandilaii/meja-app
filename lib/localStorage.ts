/**
 * Typed localStorage accessors for Meja guest-side persistence.
 * All reads/writes are SSR-safe (typeof window guard).
 * Keys are namespaced under `meja_`.
 */

export interface GuestProfile {
  name:  string
  phone: string
}

// ── Helpers ───────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== 'undefined'
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isClient()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

// ── Reservation IDs ───────────────────────────────────────────

const KEY_RESERVATION_IDS = 'meja_reservation_ids'

export function getReservationIds(): string[] {
  return readJSON<string[]>(KEY_RESERVATION_IDS, [])
}

export function addReservationId(id: string): void {
  const existing = getReservationIds()
  if (!existing.includes(id)) {
    writeJSON(KEY_RESERVATION_IDS, [...existing, id])
  }
}

// ── Guest Profile ─────────────────────────────────────────────

const KEY_GUEST_PROFILE = 'meja_guest_profile'

export function getGuestProfile(): GuestProfile | null {
  return readJSON<GuestProfile | null>(KEY_GUEST_PROFILE, null)
}

export function saveGuestProfile(profile: GuestProfile): void {
  writeJSON(KEY_GUEST_PROFILE, profile)
}

// ── Saved Restaurants ─────────────────────────────────────────

const KEY_SAVED_RESTAURANTS = 'meja_saved_restaurants'

export function getSavedRestaurantIds(): string[] {
  return readJSON<string[]>(KEY_SAVED_RESTAURANTS, [])
}

export function isSavedRestaurant(id: string): boolean {
  return getSavedRestaurantIds().includes(id)
}

/** Toggles saved state and returns the new state (true = saved). */
export function toggleSavedRestaurant(id: string): boolean {
  const current = getSavedRestaurantIds()
  const isSaved = current.includes(id)
  writeJSON(
    KEY_SAVED_RESTAURANTS,
    isSaved ? current.filter((r) => r !== id) : [...current, id]
  )
  return !isSaved
}

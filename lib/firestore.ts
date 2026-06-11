import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  documentId,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Restaurant, RestaurantTable, Reservation, WaitlistEntry } from '@/types'
import type { Area } from '@/types'

// ── Reference Code ────────────────────────────────────────────

export function generateReferenceCode(date: Date, sequence: number): string {
  const dd  = String(date.getDate()).padStart(2, '0')
  const mm  = String(date.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(2, '0')
  return `MJ-${dd}${mm}-${seq}`
}

// ── Restaurants ───────────────────────────────────────────────

function requireDb() {
  if (!db) throw new Error('Firebase not configured — set NEXT_PUBLIC_FIREBASE_* env vars')
  return db
}

export async function getRestaurants(area?: Area): Promise<Restaurant[]> {
  const ref = collection(requireDb(), 'restaurants')
  const q = area
    ? query(ref, where('isActive', '==', true), where('area', '==', area))
    : query(ref, where('isActive', '==', true))

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  })) as Restaurant[]
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const ref  = doc(requireDb(), 'restaurants', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return {
    id: snap.id,
    ...snap.data(),
    createdAt: (snap.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  } as Restaurant
}

export async function updateRestaurant(
  id: string,
  data: Partial<Omit<Restaurant, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(requireDb(), 'restaurants', id), data)
}

// ── Tables ────────────────────────────────────────────────────

export async function getRestaurantTables(restaurantId: string): Promise<RestaurantTable[]> {
  const ref  = collection(requireDb(), 'restaurants', restaurantId, 'tables')
  const snap = await getDocs(ref)
  return snap.docs.map((d) => ({
    id: d.id,
    restaurantId,
    ...d.data(),
  })) as RestaurantTable[]
}

/** Real-time listener — returns unsubscribe fn */
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: RestaurantTable[]) => void
): Unsubscribe {
  const ref = collection(requireDb(), 'restaurants', restaurantId, 'tables')
  const q   = query(ref, orderBy('tableNumber', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        restaurantId,
        ...d.data(),
      })) as RestaurantTable[]
    )
  })
}

export async function addRestaurantTable(
  restaurantId: string,
  data: { tableNumber: string; capacity: number }
): Promise<RestaurantTable> {
  const ref    = collection(requireDb(), 'restaurants', restaurantId, 'tables')
  const docRef = await addDoc(ref, { ...data, status: 'available' })
  return { id: docRef.id, restaurantId, status: 'available', ...data }
}

export async function updateTableStatus(
  restaurantId: string,
  tableId: string,
  status: RestaurantTable['status']
): Promise<void> {
  await updateDoc(doc(requireDb(), 'restaurants', restaurantId, 'tables', tableId), { status })
}

export async function deleteRestaurantTable(
  restaurantId: string,
  tableId: string
): Promise<void> {
  await deleteDoc(doc(requireDb(), 'restaurants', restaurantId, 'tables', tableId))
}

// ── Reservations ──────────────────────────────────────────────

export async function getReservationsForDate(
  restaurantId: string,
  date: string
): Promise<Reservation[]> {
  const ref = collection(requireDb(), 'reservations')
  const q   = query(
    ref,
    where('restaurantId', '==', restaurantId),
    where('date', '==', date),
    where('status', 'in', ['pending', 'confirmed', 'arrived'])
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  })) as Reservation[]
}

/** Real-time listener for today's reservations */
export function subscribeToReservationsForDate(
  restaurantId: string,
  date: string,
  callback: (reservations: Reservation[]) => void
): Unsubscribe {
  const ref = collection(requireDb(), 'reservations')
  const q   = query(
    ref,
    where('restaurantId', '==', restaurantId),
    where('date', '==', date),
    where('status', 'in', ['pending', 'confirmed', 'arrived'])
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
      })) as Reservation[]
    )
  })
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const ref  = doc(requireDb(), 'reservations', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return {
    id: snap.id,
    ...snap.data(),
    createdAt: (snap.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  } as Reservation
}

export async function getReservationsByIds(ids: string[]): Promise<Reservation[]> {
  if (ids.length === 0) return []
  const results: Reservation[] = []
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30)
    const q     = query(collection(requireDb(), 'reservations'), where(documentId(), 'in', chunk))
    const snap  = await getDocs(q)
    snap.docs.forEach((d) =>
      results.push({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
      } as Reservation)
    )
  }
  return results
}

export async function createReservation(
  data: Omit<Reservation, 'id' | 'createdAt' | 'referenceCode'>
): Promise<Reservation> {
  // count existing reservations today to generate sequence
  const existing = await getReservationsForDate(data.restaurantId, data.date)
  const seq      = existing.length + 1
  const [year, month, day] = data.date.split('-').map(Number)
  const dateObj    = new Date(year, month - 1, day)
  const refCode    = generateReferenceCode(dateObj, seq)

  const docRef = await addDoc(collection(requireDb(), 'reservations'), {
    ...data,
    referenceCode: refCode,
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...data,
    referenceCode: refCode,
    createdAt: new Date(),
  }
}

export async function updateReservationStatus(
  id: string,
  status: Reservation['status']
): Promise<void> {
  await updateDoc(doc(requireDb(), 'reservations', id), { status })
}

/** Assign a table to a reservation, releasing the previous assignment */
export async function assignTableToReservation(
  reservationId: string,
  newTableId: string,
  restaurantId: string,
  prevTableId?: string
): Promise<void> {
  if (prevTableId && prevTableId !== 'auto' && prevTableId !== newTableId) {
    await updateDoc(
      doc(requireDb(), 'restaurants', restaurantId, 'tables', prevTableId),
      { status: 'available' }
    )
  }
  await updateDoc(doc(requireDb(), 'reservations', reservationId), { tableId: newTableId })
  if (newTableId !== 'auto') {
    await updateDoc(
      doc(requireDb(), 'restaurants', restaurantId, 'tables', newTableId),
      { status: 'reserved' }
    )
  }
}

// ── Waitlist ──────────────────────────────────────────────────

export async function getWaitlist(restaurantId: string): Promise<WaitlistEntry[]> {
  const ref = collection(requireDb(), 'waitlist')
  const q   = query(
    ref,
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['waiting', 'notified']),
    orderBy('joinedAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    joinedAt:    (d.data().joinedAt as Timestamp)?.toDate?.()    ?? new Date(),
    notifiedAt:  (d.data().notifiedAt as Timestamp)?.toDate?.()  ?? null,
  })) as WaitlistEntry[]
}

export async function addToWaitlist(
  data: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'notifiedAt' | 'status'>
): Promise<WaitlistEntry> {
  const docRef = await addDoc(collection(requireDb(), 'waitlist'), {
    ...data,
    status:     'waiting',
    joinedAt:   serverTimestamp(),
    notifiedAt: null,
  })
  return {
    id: docRef.id,
    ...data,
    status:     'waiting',
    joinedAt:   new Date(),
    notifiedAt: null,
  }
}

/** Real-time listener for active waitlist entries (waiting + notified) */
export function subscribeToWaitlist(
  restaurantId: string,
  callback: (entries: WaitlistEntry[]) => void
): Unsubscribe {
  const ref = collection(requireDb(), 'waitlist')
  const q   = query(
    ref,
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['waiting', 'notified']),
    orderBy('joinedAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        joinedAt:   (d.data().joinedAt as Timestamp)?.toDate?.()   ?? new Date(),
        notifiedAt: (d.data().notifiedAt as Timestamp)?.toDate?.() ?? null,
      })) as WaitlistEntry[]
    )
  })
}

export async function seatWaitlistEntry(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'waitlist', id), { status: 'seated' })
}

export async function removeWaitlistEntry(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'waitlist', id), { status: 'left' })
}

/** Fetch ALL reservations for a restaurant (used by guest directory) */
export async function getAllReservations(restaurantId: string): Promise<Reservation[]> {
  const ref  = collection(requireDb(), 'reservations')
  const q    = query(ref, where('restaurantId', '==', restaurantId), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  })) as Reservation[]
}

// ── Guest Notes ───────────────────────────────────────────────

function guestNoteId(restaurantId: string, guestPhone: string): string {
  return `${restaurantId}_${guestPhone.replace(/\D/g, '')}`
}

/** Fetch all notes for a restaurant in one query */
export async function getAllGuestNotes(restaurantId: string): Promise<Record<string, string>> {
  const ref  = collection(requireDb(), 'guestNotes')
  const q    = query(ref, where('restaurantId', '==', restaurantId))
  const snap = await getDocs(q)
  const result: Record<string, string> = {}
  snap.docs.forEach((d) => {
    result[d.data().guestPhone as string] = d.data().note as string
  })
  return result
}

export async function saveGuestNote(
  restaurantId: string,
  guestPhone: string,
  note: string
): Promise<void> {
  const id = guestNoteId(restaurantId, guestPhone)
  await setDoc(
    doc(requireDb(), 'guestNotes', id),
    { restaurantId, guestPhone, note, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── Availability helper ───────────────────────────────────────

export function getAvailabilityStatus(
  reservedCount: number,
  totalTables: number
): 'Tersedia' | 'Hampir penuh' | 'Penuh' {
  const ratio = reservedCount / totalTables
  if (ratio >= 1)   return 'Penuh'
  if (ratio >= 0.7) return 'Hampir penuh'
  return 'Tersedia'
}

// ── Time slot helpers ─────────────────────────────────────────

export function generateTimeSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = []
  const [openH, openM]   = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  let hour = openH
  let min  = openM

  while (hour < closeH || (hour === closeH && min < closeM)) {
    slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    min += 30
    if (min >= 60) { hour += 1; min = 0 }
  }

  return slots
}

export function isSlotAvailable(
  slot: string,
  reservations: Reservation[],
  totalTables: number
): boolean {
  const count = reservations.filter((r) => r.timeSlot === slot).length
  return count < totalTables
}

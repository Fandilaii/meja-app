/**
 * Firebase Admin SDK — server-side only (API routes, cron jobs).
 * Never import this from client components.
 *
 * Required env vars (set in Vercel dashboard):
 *   FIREBASE_SERVICE_ACCOUNT_JSON  — base64-encoded service account JSON
 *     How to get it:
 *       1. Firebase Console → Project Settings → Service Accounts
 *       2. Click "Generate new private key" → download JSON
 *       3. Base64 encode: certutil -encode key.json key.b64 (Windows)
 *          or: base64 -i key.json (Mac/Linux)
 *       4. Paste the result (single line, no newlines) as the env var value
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore }            from 'firebase-admin/firestore'
import type { Reservation }                   from '@/types'

let _app: App | null  = null
let _db:  Firestore | null = null

function getAdminApp(): App {
  if (_app) return _app
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!encoded) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')
  const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
  _app = getApps().find((a) => a.name === 'admin') ?? initializeApp({ credential: cert(serviceAccount) }, 'admin')
  return _app
}

export function getAdminDb(): Firestore {
  if (_db) return _db
  _db = getFirestore(getAdminApp())
  return _db
}

export async function getTomorrowReservations(): Promise<Reservation[]> {
  const db       = getAdminDb()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr  = tomorrow.toISOString().split('T')[0]

  const snap = await db.collection('reservations')
    .where('date', '==', dateStr)
    .where('status', 'in', ['pending', 'confirmed'])
    .get()

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation))
}

export async function getRestaurantName(restaurantId: string): Promise<string> {
  const db   = getAdminDb()
  const snap = await db.collection('restaurants').doc(restaurantId).get()
  return (snap.data()?.name as string | undefined) ?? 'Restoran'
}

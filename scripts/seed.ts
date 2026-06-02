/**
 * Seed Firestore with 5 sample Jakarta restaurants + tables.
 * Usage: npx ts-node scripts/seed.ts
 *
 * Requires .env.local with NEXT_PUBLIC_FIREBASE_* variables set.
 */

import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

require('dotenv').config({ path: '.env.local' })

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db  = getFirestore(app)

const restaurants = [
  {
    name:        'Nusa Gastronomy',
    cuisine:     'Indonesian Fine Dining',
    area:        'SCBD',
    priceMin:    350000,
    priceMax:    700000,
    rating:      4.8,
    openTime:    '17:00',
    closeTime:   '23:00',
    totalTables: 18,
    imageUrl:    '',
    isActive:    true,
  },
  {
    name:        'Lara Djonggrang',
    cuisine:     'Javanese Heritage',
    area:        'Menteng',
    priceMin:    200000,
    priceMax:    450000,
    rating:      4.6,
    openTime:    '17:00',
    closeTime:   '23:00',
    totalTables: 12,
    imageUrl:    '',
    isActive:    true,
  },
  {
    name:        'Bunga Rampai',
    cuisine:     'Indonesian Colonial',
    area:        'Menteng',
    priceMin:    150000,
    priceMax:    350000,
    rating:      4.5,
    openTime:    '11:00',
    closeTime:   '22:00',
    totalTables: 14,
    imageUrl:    '',
    isActive:    true,
  },
  {
    name:        'Hakkasan Jakarta',
    cuisine:     'Cantonese Fine Dining',
    area:        'SCBD',
    priceMin:    500000,
    priceMax:    1200000,
    rating:      4.7,
    openTime:    '12:00',
    closeTime:   '23:00',
    totalTables: 20,
    imageUrl:    '',
    isActive:    true,
  },
  {
    name:        'Kaum Jakarta',
    cuisine:     'Indonesian Regional',
    area:        'Kemang',
    priceMin:    180000,
    priceMax:    400000,
    rating:      4.4,
    openTime:    '11:30',
    closeTime:   '22:30',
    totalTables: 16,
    imageUrl:    '',
    isActive:    true,
  },
]

const TABLE_CAPACITIES = [2, 2, 4, 4, 6, 6]

async function seed() {
  console.log('🌱 Seeding Firestore...')

  for (const r of restaurants) {
    const docRef = await addDoc(collection(db, 'restaurants'), {
      ...r,
      createdAt: serverTimestamp(),
    })
    console.log(`✅ Created restaurant: ${r.name} (${docRef.id})`)

    // Add 6 tables
    for (let i = 0; i < 6; i++) {
      await addDoc(collection(db, 'restaurants', docRef.id, 'tables'), {
        tableNumber: `T${i + 1}`,
        capacity:    TABLE_CAPACITIES[i],
        status:      'available',
      })
    }
    console.log(`   └── Added 6 tables (T1–T6)`)
  }

  console.log('\n🎉 Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

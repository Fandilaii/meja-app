export interface Restaurant {
  id: string
  name: string
  cuisine: string
  area: 'SCBD' | 'Kemang' | 'PIK' | 'Menteng'
  priceMin: number
  priceMax: number
  rating: number
  openTime: string
  closeTime: string
  totalTables: number
  imageUrl: string
  isActive: boolean
  createdAt: Date
}

export interface RestaurantTable {
  id: string
  restaurantId: string
  tableNumber: string
  capacity: number
  status: 'available' | 'reserved' | 'occupied'
}

export interface Reservation {
  id: string
  restaurantId: string
  tableId: string
  userId: string
  guestName: string
  guestPhone: string
  date: string
  timeSlot: string
  guestCount: number
  status: 'pending' | 'confirmed' | 'arrived' | 'cancelled'
  referenceCode: string
  createdAt: Date
}

export interface WaitlistEntry {
  id: string
  restaurantId: string
  userId: string
  guestName: string
  guestPhone: string
  guestCount: number
  joinedAt: Date
  notifiedAt: Date | null
  status: 'waiting' | 'notified' | 'seated' | 'left'
}

export interface User {
  id: string
  fullName: string
  phoneWa: string
  email: string
  createdAt: Date
}

export type AvailabilityStatus = 'Tersedia' | 'Hampir penuh' | 'Penuh'
export type Area = 'SCBD' | 'Kemang' | 'PIK' | 'Menteng'

export type FilterArea = 'Semua' | Area

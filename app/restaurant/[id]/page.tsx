import type { Metadata } from 'next'
import RestaurantDetailClient from './RestaurantDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const { getRestaurant } = await import('@/lib/firestore')
    const restaurant = await getRestaurant(id)

    if (restaurant) {
      return {
        title: `Reservasi di ${restaurant.name} — Meja`,
        description: `Pesan meja di ${restaurant.name}, ${restaurant.area}. Masakan ${restaurant.cuisine}. Rating ${restaurant.rating}/5. Buka ${restaurant.openTime}–${restaurant.closeTime}.`,
        openGraph: {
          title: `${restaurant.name} — Meja`,
          description: `Reservasi online di ${restaurant.name}, ${restaurant.area}`,
          ...(restaurant.imageUrl ? { images: [restaurant.imageUrl] } : {}),
        },
      }
    }
  } catch {
    // Firebase client SDK may not work in all SSR contexts; fall back to generic title
  }

  return { title: 'Reservasi Restoran — Meja' }
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { id } = await params
  return <RestaurantDetailClient id={id} />
}

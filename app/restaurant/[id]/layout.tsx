import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId) throw new Error('no project id')

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/restaurants/${id}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('not found')

    const doc = await res.json()
    const name    = doc.fields?.name?.stringValue    ?? 'Restoran'
    const area    = doc.fields?.area?.stringValue    ?? 'Jakarta'
    const cuisine = doc.fields?.cuisine?.stringValue ?? ''

    return {
      title:       `Reservasi di ${name} — Meja`,
      description: `Pesan meja di ${name}, ${area}${cuisine ? ` · ${cuisine}` : ''}. Reservasi online mudah dan cepat.`,
      openGraph: {
        title:       `${name} — Reservasi via Meja`,
        description: `Pesan meja di ${name}, ${area}. Reservasi sekarang di Meja.`,
      },
    }
  } catch {
    return {
      title:       'Reservasi Restoran — Meja',
      description: 'Pesan meja di restoran terbaik Jakarta.',
    }
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

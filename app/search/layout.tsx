import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cari Restoran — Meja',
  description: 'Temukan restoran terbaik di Jakarta berdasarkan area, jenis masakan, harga, dan rating.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

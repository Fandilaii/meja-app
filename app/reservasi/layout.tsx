import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservasi Saya — Meja',
  description: 'Lihat dan kelola semua reservasi restoranmu.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

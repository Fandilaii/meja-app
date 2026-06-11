import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil — Meja',
  description: 'Kelola profil dan preferensi akun Meja-mu.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

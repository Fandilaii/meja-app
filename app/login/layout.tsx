import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk — Meja Dashboard',
  description: 'Masuk ke dashboard pengelolaan restoran Meja.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

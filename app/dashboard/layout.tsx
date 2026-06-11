import type { Metadata } from 'next'
import AuthGuard from '@/components/dashboard/AuthGuard'
import Sidebar   from '@/components/dashboard/Sidebar'

export const metadata: Metadata = {
  title: 'Dashboard — Meja',
  description: 'Kelola reservasi, meja, dan tamu restoranmu.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-cream">
        <Sidebar />
        <main className="flex-1 ml-[200px] min-w-0">{children}</main>
      </div>
    </AuthGuard>
  )
}

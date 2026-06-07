'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { onAuthStateChange } from '@/lib/auth'
import type { User } from 'firebase/auth'

interface Props {
  children: React.ReactNode
}

export default function AuthGuard({ children }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user,    setUser]    = useState<User | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChange((u) => {
      setUser(u)
      setChecked(true)
      if (!u) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      }
    })
    return unsub
  }, [router, pathname])

  // Full-screen ink loader while Firebase resolves the auth state
  if (!checked) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (!user) return null // redirect in-flight

  return <>{children}</>
}

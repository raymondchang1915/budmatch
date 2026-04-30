'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token_hash = params.get('token_hash')
    const type = params.get('type') as any

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) {
          router.push('/auth?error=confirmation_failed')
        } else {
          router.push('/?confirmed=true')
        }
      })
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Confirming your account...</p>
    </main>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setIsAdmin(false); return }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('email', data.user.email)
        .single()
      setIsAdmin(profile?.is_admin === true)
    })
  }, [])

  return isAdmin
}

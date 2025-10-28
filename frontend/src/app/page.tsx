/**
 * ルートアクセス時のリダイレクト
 * - 未ログイン: /login
 * - ログイン済み: /dashboard
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function RootRedirect() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? '/dashboard' : '/login')
}


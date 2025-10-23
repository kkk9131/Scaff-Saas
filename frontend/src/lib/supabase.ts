/**
 * Supabaseクライアントの設定
 *
 * このファイルはクライアント側で使用するSupabaseクライアントを提供します。
 * シングルトンパターンで実装され、アプリケーション全体で同じインスタンスを共有します。
 */

import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'

/**
 * Supabaseクライアントのシングルトンインスタンス
 * アプリケーション全体でこのインスタンスを使用すること
 *
 * 使用例:
 * import { supabase } from '@/lib/supabase'
 * const { data } = await supabase.from('table').select('*')
 */
export const supabase = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * 最近のアクティビティを取得するカスタムフック
 * Supabaseのprojectsテーブルから最近更新されたプロジェクトを取得し、
 * アクティビティ情報に変換して返す
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RecentActivity, ActivityType } from '@/types/activity'

/**
 * 最近のアクティビティデータを取得するフック
 *
 * @returns {Object} - アクティビティデータと状態
 * @returns {RecentActivity[]} activities - 最近のアクティビティ一覧（最大6件）
 * @returns {boolean} loading - データ取得中かどうか
 * @returns {Error | null} error - エラー情報（エラーがない場合はnull）
 */
export function useRecentActivities() {
  // アクティビティデータの状態管理
  const [activities, setActivities] = useState<RecentActivity[]>([])
  // ローディング状態の管理
  const [loading, setLoading] = useState(true)
  // エラー状態の管理
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    /**
     * Supabaseからプロジェクトデータを取得してアクティビティに変換
     */
    async function fetchActivities() {
      try {
        setLoading(true)
        setError(null)

        // Supabaseからプロジェクトデータを取得
        // updated_atで降順ソート、最大6件取得
        const { data: projects, error: fetchError } = await supabase
          .from('projects')
          .select('id, name, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(6)

        if (fetchError) {
          throw fetchError
        }

        // プロジェクトデータをアクティビティ形式に変換
        const recentActivities: RecentActivity[] = (projects || []).map((project) => {
          // アクティビティタイプを判定
          // ステータスが'completed'の場合は完了アクティビティ
          // それ以外は作成アクティビティ
          let activityType: ActivityType = 'created'
          let timestamp = project.created_at

          if (project.status === 'completed') {
            activityType = 'completed'
            timestamp = project.updated_at
          }

          return {
            id: project.id,
            project_name: project.name,
            activity_type: activityType,
            timestamp: timestamp,
          }
        })

        setActivities(recentActivities)
      } catch (err) {
        console.error('アクティビティの取得に失敗しました:', err)
        setError(err instanceof Error ? err : new Error('不明なエラーが発生しました'))
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, []) // 空の依存配列：マウント時のみ実行

  return {
    activities,
    loading,
    error,
  }
}

/**
 * 最近のアクティビティウィジェット
 * ダッシュボードに表示する最近のプロジェクトアクティビティ一覧
 */

'use client'

import { PlusCircle, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRecentActivities } from '@/lib/hooks/useRecentActivities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ActivityType } from '@/types/activity'

/**
 * アクティビティアイコンコンポーネント
 * アクティビティタイプに応じたアイコンを表示
 *
 * @param type - アクティビティタイプ
 */
function ActivityIcon({ type }: { type: ActivityType }) {
  // アクティビティタイプに応じてアイコンを切り替え
  if (type === 'created') {
    return (
      <PlusCircle
        className="h-5 w-5 text-[#06B6D4]"
        aria-label="プロジェクト作成"
      />
    )
  }

  return (
    <CheckCircle
      className="h-5 w-5 text-[#22C55E]"
      aria-label="プロジェクト完了"
    />
  )
}

/**
 * アクティビティタイプのラベルを取得
 *
 * @param type - アクティビティタイプ
 * @returns アクティビティのラベル文字列
 */
function getActivityLabel(type: ActivityType): string {
  return type === 'created' ? 'プロジェクト作成' : 'プロジェクト完了'
}

/**
 * 最近のアクティビティウィジェット
 * 最近のプロジェクト活動を時系列で表示
 */
export function RecentActivityWidget() {
  // カスタムフックからアクティビティデータを取得
  const { activities, loading, error } = useRecentActivities()

  // ガラスモーフィズム風カードの共通クラス（dashboard/page.tsxと統一）
  const glassCardClass =
    'group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-xl'

  // ローディング中の表示
  if (loading) {
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">
            最近のアクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            {/* ローディングスピナー */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // エラー時の表示
  if (error) {
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">
            最近のアクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              アクティビティの読み込みに失敗しました
            </p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // アクティビティが空の場合
  if (activities.length === 0) {
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">
            最近のアクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              まだアクティビティがありません
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // アクティビティ一覧の表示
  return (
    <Card className={glassCardClass}>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-slate-100">
          最近のアクティビティ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="group/item flex items-start gap-3 rounded-lg border border-white/20 dark:border-slate-700/40 bg-white/40 dark:bg-slate-900/40 p-3 transition-all duration-200 hover:bg-white/60 hover:shadow-md dark:hover:bg-slate-900/60"
            >
              {/* アクティビティアイコン */}
              <div className="mt-0.5">
                <ActivityIcon type={activity.activity_type} />
              </div>

              {/* アクティビティ情報 */}
              <div className="flex-1 min-w-0">
                {/* プロジェクト名 */}
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                  {activity.project_name}
                </p>

                {/* アクティビティタイプと時間 */}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{getActivityLabel(activity.activity_type)}</span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <time dateTime={activity.timestamp}>
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

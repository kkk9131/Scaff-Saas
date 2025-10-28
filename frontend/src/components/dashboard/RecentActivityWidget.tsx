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
      <PlusCircle className="h-5 w-5 text-[#06B6D4]" aria-label="プロジェクト作成" />
    )
  }

  return (
    <CheckCircle className="h-5 w-5 text-[#22C55E]" aria-label="プロジェクト完了" />
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
/**
 * 最近のアクティビティウィジェット
 *
 * Props:
 * - embedded: true の場合はカードラッパーを描画せず、
 *   親コンテナ（例: BentoCard）内に直接リストのみを描画します。
 */
export function RecentActivityWidget({ embedded = false }: { embedded?: boolean }) {
  // カスタムフックからアクティビティデータを取得
  const { activities, loading, error } = useRecentActivities()

  // ガラスモーフィズム風カードの共通クラス（dashboard/page.tsxと統一）
  const glassCardClass =
    // ライト: 完全不透明の柔らかい白（bg-card） / ダーク: 落ち着いたダークガラス
    'group relative overflow-hidden rounded-2xl border border-white/30 bg-card dark:border-slate-700/60 dark:bg-slate-950/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-2xl'

  // ローディング中の表示
  if (loading) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
        </div>
      )
    }
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">最近のアクティビティ</CardTitle>
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
    if (embedded) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">アクティビティの読み込みに失敗しました</p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      )
    }
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">
            最近のアクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">アクティビティの読み込みに失敗しました</p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // アクティビティが空の場合
  if (activities.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">まだアクティビティがありません</p>
        </div>
      )
    }
    return (
      <Card className={glassCardClass}>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-slate-100">最近のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">まだアクティビティがありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // アクティビティ一覧の表示
  // クイックアクションの質感と揃える
  const qaBaseClass =
    'group relative overflow-hidden rounded-2xl border border-white/30 bg-card dark:border-slate-700/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl'
  const hoverOverlayBase =
    'before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100'
  // Quick Action と同系のグラデーションをタイプ別に割り当て
  const overlayGradientCreated = 'before:bg-gradient-to-br before:from-[#06B6D4]/0 before:via-[#6366F1]/0 before:to-[#8B5CF6]/45'
  const overlayGradientCompleted = 'before:bg-gradient-to-br before:from-[#22C55E]/0 before:via-[#0EA5E9]/0 before:to-[#14B8A6]/45'
  const overlayGradientByType = (t: ActivityType) =>
    t === 'created' ? overlayGradientCreated : overlayGradientCompleted

  // Quick Action のアイコン包みと同等（サイズは16）
  const iconWrapperClass =
    'relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/40 dark:border-slate-700/50 backdrop-blur-xl shadow-md shadow-sky-500/20 dark:shadow-indigo-900/40'
  const iconBgCreated = 'bg-gradient-to-br from-[#06B6D4]/25 via-[#6366F1]/30 to-[#8B5CF6]/40'
  const iconBgCompleted = 'bg-gradient-to-br from-[#22C55E]/25 via-[#0EA5E9]/30 to-[#14B8A6]/35'
  const iconBgByType = (t: ActivityType) => (t === 'created' ? iconBgCreated : iconBgCompleted)

  const list = (
    <div className="activity-list space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`activity-item ${qaBaseClass} p-6 ${hoverOverlayBase} ${overlayGradientByType(activity.activity_type)}`}
        >
          <div className="relative z-10 flex items-start gap-3">
            {/* アイコンはQuick Actionと同じ見た目のラッパーに配置 */}
            <div className={`${iconWrapperClass} ${iconBgByType(activity.activity_type)}`}>
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
        </div>
      ))}
    </div>
  )

  if (embedded) return list

  return (
    <Card className={glassCardClass}>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-slate-100">最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  )
}

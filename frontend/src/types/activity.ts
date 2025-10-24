/**
 * アクティビティ型定義
 * プロジェクトの最近のアクティビティを表現する型
 */

/**
 * アクティビティの種類
 * - created: プロジェクト作成
 * - completed: プロジェクト完了
 */
export type ActivityType = 'created' | 'completed'

/**
 * 最近のアクティビティ情報
 */
export interface RecentActivity {
  /** アクティビティID（プロジェクトID） */
  id: string

  /** プロジェクト名 */
  project_name: string

  /** アクティビティの種類 */
  activity_type: ActivityType

  /** アクティビティ発生日時（ISO 8601形式） */
  timestamp: string
}

/**
 * プロジェクト型定義
 *
 * バックエンドのプロジェクトモデルと対応する型定義
 */

/**
 * プロジェクトステータス
 */
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived'

/**
 * プロジェクトの基本情報
 */
export interface Project {
  id: string
  user_id: string
  name: string
  description?: string | null
  status: ProjectStatus
  customer_name?: string | null
  site_address?: string | null
  start_date?: string | null // ISO 8601形式の日付文字列
  end_date?: string | null   // ISO 8601形式の日付文字列
  metadata?: Record<string, any> | null
  created_at: string // ISO 8601形式のタイムスタンプ
  updated_at: string // ISO 8601形式のタイムスタンプ
}

/**
 * プロジェクト作成リクエスト
 */
export interface ProjectCreateRequest {
  name: string
  description?: string | null
  status?: ProjectStatus
  customer_name?: string | null
  site_address?: string | null
  start_date?: string | null
  end_date?: string | null
  metadata?: Record<string, any> | null
  user_id?: string // バックエンドで上書きされるため、フロントエンドからは不要
}

/**
 * プロジェクト更新リクエスト
 */
export interface ProjectUpdateRequest {
  name?: string
  description?: string | null
  status?: ProjectStatus
  customer_name?: string | null
  site_address?: string | null
  start_date?: string | null
  end_date?: string | null
  metadata?: Record<string, any> | null
}

/**
 * プロジェクト一覧レスポンス
 */
export interface ProjectListResponse {
  projects: Project[]
  total: number
  page: number
  page_size: number
}

/**
 * プロジェクト複製リクエスト
 */
export interface ProjectDuplicateRequest {
  new_name?: string | null
}

/**
 * ステータスラベルマッピング
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '未着手',
  active: '進行中',
  completed: '完了',
  archived: 'アーカイブ',
}

/**
 * ステータスアイコンマッピング
 */
export const PROJECT_STATUS_ICONS: Record<ProjectStatus, string> = {
  draft: '📝',
  active: '🚀',
  completed: '✅',
  archived: '📦',
}

/**
 * ステータスカラーマッピング（Tailwind CSS）
 */
export const PROJECT_STATUS_COLORS: Record<
  ProjectStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  active: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600',
  },
  archived: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  },
}

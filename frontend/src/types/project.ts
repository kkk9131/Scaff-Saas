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
  metadata?: Record<string, unknown> | null
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
  metadata?: Record<string, unknown> | null
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
  metadata?: Record<string, unknown> | null
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
    bg: 'bg-indigo-100/80 dark:bg-indigo-900/30',
    text: 'text-indigo-900 dark:text-indigo-300',
    border: 'border-indigo-600 dark:border-indigo-600',
  },
  active: {
    bg: 'bg-cyan-100/80 dark:bg-cyan-900/30',
    text: 'text-cyan-900 dark:text-cyan-300',
    border: 'border-cyan-600 dark:border-cyan-600',
  },
  completed: {
    bg: 'bg-emerald-100/70 dark:bg-emerald-900/30',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-600 dark:border-emerald-600',
  },
  archived: {
    bg: 'bg-gray-100/80 dark:bg-gray-900/30',
    text: 'text-gray-900 dark:text-gray-300',
    border: 'border-gray-600 dark:border-gray-600',
  },
}

/**
 * プロジェクト関連の型定義
 */

/**
 * プロジェクトのステータス
 */
export type ProjectStatus =
  | 'planning'      // 計画中
  | 'in_progress'   // 進行中
  | 'on_hold'       // 保留中
  | 'completed'     // 完了
  | 'archived';     // アーカイブ済み

/**
 * プロジェクトの基本情報
 */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  customer_name?: string;
  site_address?: string;
  created_at: string;
  updated_at: string;
}

/**
 * プロジェクト作成時の入力データ
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  customer_name?: string;
  site_address?: string;
  status?: ProjectStatus;
}

/**
 * プロジェクト更新時の入力データ
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  customer_name?: string;
  site_address?: string;
}

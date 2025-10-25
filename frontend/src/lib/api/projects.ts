/**
 * プロジェクトAPI関数
 *
 * バックエンドのプロジェクト管理APIとの通信を管理
 */

import { apiClient, ApiResponse } from '@/lib/api-client'
import {
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectListResponse,
  ProjectDuplicateRequest,
  ProjectStatus,
} from '@/types/project'

/**
 * プロジェクト一覧を取得
 *
 * @param page - ページ番号（1から開始）
 * @param pageSize - 1ページあたりのアイテム数
 * @param status - ステータスフィルター（オプション）
 */
export async function getProjects(
  page: number = 1,
  pageSize: number = 20,
  status?: ProjectStatus
): Promise<ApiResponse<ProjectListResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  })

  if (status) {
    params.append('status', status)
  }

  return apiClient.get<ProjectListResponse>(
    `/api/projects?${params.toString()}`,
    true // 認証必須
  )
}

/**
 * プロジェクト詳細を取得
 *
 * @param projectId - プロジェクトID
 */
export async function getProject(
  projectId: string
): Promise<ApiResponse<Project>> {
  return apiClient.get<Project>(`/api/projects/${projectId}`, true)
}

/**
 * 新規プロジェクトを作成
 *
 * @param projectData - プロジェクト作成データ
 */
export async function createProject(
  projectData: ProjectCreateRequest
): Promise<ApiResponse<Project>> {
  return apiClient.post<Project>('/api/projects', projectData, true)
}

/**
 * プロジェクトを更新
 *
 * @param projectId - プロジェクトID
 * @param projectData - 更新データ
 */
export async function updateProject(
  projectId: string,
  projectData: ProjectUpdateRequest
): Promise<ApiResponse<Project>> {
  return apiClient.put<Project>(
    `/api/projects/${projectId}`,
    projectData,
    true
  )
}

/**
 * プロジェクトを削除
 *
 * @param projectId - プロジェクトID
 */
export async function deleteProject(
  projectId: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete<{ message: string }>(
    `/api/projects/${projectId}`,
    true
  )
}

/**
 * プロジェクトを複製
 *
 * @param projectId - 複製元プロジェクトID
 * @param duplicateRequest - 複製設定（新しい名前など）
 */
export async function duplicateProject(
  projectId: string,
  duplicateRequest: ProjectDuplicateRequest = {}
): Promise<ApiResponse<Project>> {
  return apiClient.post<Project>(
    `/api/projects/${projectId}/duplicate`,
    duplicateRequest,
    true
  )
}

/**
 * プロジェクトのステータスを変更
 *
 * @param projectId - プロジェクトID
 * @param status - 新しいステータス
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<ApiResponse<Project>> {
  return updateProject(projectId, { status })
}

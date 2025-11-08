/**
 * 図面（作図JSON）API
 *
 * バックエンドの作図保存APIと通信し、最新の図面を取得します。
 */

import { apiClient, type ApiResponse } from '@/lib/api-client'

/**
 * 保存された図面レコード型
 */
export interface DrawingRecord {
  /** 図面ID */
  id: string
  /** プロジェクトID */
  project_id: string
  /** 作図データ（Konva/ストア出力のJSON互換） */
  design_json: unknown
  /** 作成日時 */
  created_at?: string
  /** 更新日時 */
  updated_at?: string
}

/**
 * プロジェクトに紐づく最新図面を取得（404はデータなしとして扱う）
 *
 * @param projectId プロジェクトID
 * @returns ApiResponse<DrawingRecord | null>
 */
export async function getLatestDrawing(
  projectId: string
): Promise<ApiResponse<DrawingRecord | null>> {
  const resp = await apiClient.get<DrawingRecord>(`/api/drawings/${projectId}`, false)

  // 404の場合は図面なしとして扱う
  if (resp.error && resp.error.statusCode === 404) {
    return { data: null }
  }
  return resp as ApiResponse<DrawingRecord | null>
}

/**
 * 作図データをプロジェクトに保存
 *
 * @param projectId プロジェクトID
 * @param designJson 作図データ（Konva/ストア出力のJSON）
 * @returns ApiResponse<DrawingRecord>
 */
export async function saveDrawing(
  projectId: string,
  designJson: unknown
): Promise<ApiResponse<DrawingRecord>> {
  return apiClient.post<DrawingRecord>(
    '/api/drawings',
    {
      project_id: projectId,
      design_json: designJson,
    },
    true // requireAuth: true で認証ヘッダーを自動付与
  )
}

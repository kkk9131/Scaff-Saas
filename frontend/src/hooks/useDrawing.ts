/**
 * 作図関連のReact Queryカスタムフック
 * 作図データの取得、保存、削除機能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DrawingElement } from '@/stores/drawingStore';

// 作図データの型定義
export interface DrawingData {
  id: string;
  project_id: string;
  elements: DrawingElement[];
  canvas_settings: {
    scale: number;
    position: { x: number; y: number };
  };
  created_at: string;
  updated_at: string;
}

// 作図保存時の入力データ型
export interface SaveDrawingInput {
  project_id: string;
  elements: DrawingElement[];
  canvas_settings: {
    scale: number;
    position: { x: number; y: number };
  };
}

/**
 * プロジェクトに紐づく作図データを取得するフック
 */
export function useDrawing(projectId: string) {
  return useQuery({
    queryKey: ['drawings', projectId],
    queryFn: async (): Promise<DrawingData | null> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/drawings/${projectId}`);
      // if (response.status === 404) return null;
      // return response.json();

      // ダミーデータ（開発用）
      return {
        id: `drawing-${projectId}`,
        project_id: projectId,
        elements: [],
        canvas_settings: {
          scale: 1,
          position: { x: 0, y: 0 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!projectId, // projectIdが存在する場合のみクエリを実行
  });
}

/**
 * 作図データを保存するミューテーション
 */
export function useSaveDrawing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveDrawingInput): Promise<DrawingData> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/drawings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      return {
        id: `drawing-${input.project_id}`,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      // 該当プロジェクトの作図データのキャッシュを更新
      queryClient.setQueryData(['drawings', data.project_id], data);
    },
  });
}

/**
 * 作図データを更新するミューテーション
 */
export function useUpdateDrawing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      project_id: string;
      elements: DrawingElement[];
      canvas_settings: {
        scale: number;
        position: { x: number; y: number };
      };
    }): Promise<DrawingData> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/drawings/${input.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      return {
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      // 該当プロジェクトの作図データのキャッシュを更新
      queryClient.setQueryData(['drawings', data.project_id], data);
    },
  });
}

/**
 * 作図データを削除するミューテーション
 */
export function useDeleteDrawing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch(`/api/drawings/${projectId}`, {
      //   method: 'DELETE',
      // });

      // ダミー処理（開発用）
      console.log('作図データを削除:', projectId);
    },
    onSuccess: (_, projectId) => {
      // 該当プロジェクトの作図データのキャッシュを削除
      queryClient.removeQueries({ queryKey: ['drawings', projectId] });
    },
  });
}

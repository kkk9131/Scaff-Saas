/**
 * プロジェクト関連のReact Queryカスタムフック
 * プロジェクト一覧の取得、作成、更新、削除機能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@/stores/projectStore';

// プロジェクト作成時の入力データ型
export interface CreateProjectInput {
  name: string;
  description?: string;
  customer_name?: string;
  site_address?: string;
}

// プロジェクト更新時の入力データ型
export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  customer_name?: string;
  site_address?: string;
  status?: Project['status'];
}

/**
 * プロジェクト一覧を取得するフック
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/projects');
      // return response.json();

      // ダミーデータ（開発用）
      return [
        {
          id: '1',
          name: 'サンプルプロジェクト',
          description: 'これはサンプルのプロジェクトです',
          customer_name: '株式会社サンプル',
          site_address: '東京都渋谷区',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
        },
      ];
    },
  });
}

/**
 * 特定のプロジェクトを取得するフック
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async (): Promise<Project> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/projects/${id}`);
      // return response.json();

      // ダミーデータ（開発用）
      return {
        id,
        name: 'サンプルプロジェクト',
        description: 'これはサンプルのプロジェクトです',
        customer_name: '株式会社サンプル',
        site_address: '東京都渋谷区',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
      };
    },
    enabled: !!id, // idが存在する場合のみクエリを実行
  });
}

/**
 * プロジェクトを作成するミューテーション
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<Project> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/projects', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      return {
        id: `project-${Date.now()}`,
        ...input,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
      };
    },
    onSuccess: () => {
      // プロジェクト一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * プロジェクトを更新するミューテーション
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput): Promise<Project> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/projects/${input.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      return {
        id: input.id,
        name: input.name || 'プロジェクト',
        description: input.description,
        customer_name: input.customer_name,
        site_address: input.site_address,
        status: input.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
      };
    },
    onSuccess: (data) => {
      // 該当プロジェクトとプロジェクト一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * プロジェクトを削除するミューテーション
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch(`/api/projects/${id}`, {
      //   method: 'DELETE',
      // });

      // ダミー処理（開発用）
      console.log('プロジェクトを削除:', id);
    },
    onSuccess: (_, id) => {
      // 該当プロジェクトとプロジェクト一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

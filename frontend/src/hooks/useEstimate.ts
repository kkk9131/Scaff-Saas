/**
 * 見積関連のReact Queryカスタムフック
 * 見積データの取得、作成、更新、削除機能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 見積データの型定義
export interface EstimateItem {
  id: string;
  name: string;
  category: '足場' | '養生' | '運搬' | 'その他';
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Estimate {
  id: string;
  project_id: string;
  items: EstimateItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// 見積作成時の入力データ型
export interface CreateEstimateInput {
  project_id: string;
  items: Omit<EstimateItem, 'id' | 'total_price'>[];
  tax_rate?: number;
}

// 見積更新時の入力データ型
export interface UpdateEstimateInput {
  id: string;
  items: Omit<EstimateItem, 'id' | 'total_price'>[];
  tax_rate?: number;
}

/**
 * プロジェクトに紐づく見積データを取得するフック
 */
export function useEstimate(projectId: string) {
  return useQuery({
    queryKey: ['estimates', projectId],
    queryFn: async (): Promise<Estimate | null> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/estimates/${projectId}`);
      // if (response.status === 404) return null;
      // return response.json();

      // ダミーデータ（開発用）
      return {
        id: `estimate-${projectId}`,
        project_id: projectId,
        items: [
          {
            id: '1',
            name: '単管足場',
            category: '足場',
            quantity: 100,
            unit: 'm²',
            unit_price: 1000,
            total_price: 100000,
            notes: '',
          },
        ],
        subtotal: 100000,
        tax_rate: 0.1,
        tax_amount: 10000,
        total_amount: 110000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!projectId, // projectIdが存在する場合のみクエリを実行
  });
}

/**
 * 見積一覧を取得するフック
 */
export function useEstimates() {
  return useQuery({
    queryKey: ['estimates'],
    queryFn: async (): Promise<Estimate[]> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/estimates');
      // return response.json();

      // ダミーデータ（開発用）
      return [];
    },
  });
}

/**
 * 見積を作成するミューテーション
 */
export function useCreateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEstimateInput): Promise<Estimate> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/estimates', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      const taxRate = input.tax_rate ?? 0.1;
      const itemsWithTotals = input.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        total_price: item.quantity * item.unit_price,
      }));
      const subtotal = itemsWithTotals.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
      const taxAmount = Math.floor(subtotal * taxRate);

      return {
        id: `estimate-${Date.now()}`,
        project_id: input.project_id,
        items: itemsWithTotals,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      // 該当プロジェクトの見積データと見積一覧のキャッシュを無効化
      queryClient.setQueryData(['estimates', data.project_id], data);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

/**
 * 見積を更新するミューテーション
 */
export function useUpdateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEstimateInput): Promise<Estimate> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/estimates/${input.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // ダミーレスポンス（開発用）
      const taxRate = input.tax_rate ?? 0.1;
      const itemsWithTotals = input.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        total_price: item.quantity * item.unit_price,
      }));
      const subtotal = itemsWithTotals.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
      const taxAmount = Math.floor(subtotal * taxRate);

      return {
        id: input.id,
        project_id: 'project-1', // TODO: 実際のproject_idを取得
        items: itemsWithTotals,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      // 該当プロジェクトの見積データと見積一覧のキャッシュを無効化
      queryClient.setQueryData(['estimates', data.project_id], data);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

/**
 * 見積を削除するミューテーション
 */
export function useDeleteEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch(`/api/estimates/${id}`, {
      //   method: 'DELETE',
      // });

      // TODO: API実装後に削除リクエストへ置き換える
      void id; // 変数を維持してリンター警告を回避
    },
    onSuccess: () => {
      // 見積一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

/**
 * プロジェクト統計取得フック
 * Supabaseからプロジェクトの統計情報（総数、ステータス別カウント）を取得
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * プロジェクトステータスの型定義
 */
export type ProjectStatus = 'active' | 'completed' | 'draft' | 'pending';

/**
 * プロジェクト統計データの型定義
 */
export interface ProjectStats {
  total: number; // 総プロジェクト数
  active: number; // 進行中のプロジェクト数
  completed: number; // 完了プロジェクト数
  draft: number; // 下書きプロジェクト数
  pending: number; // 未着手プロジェクト数
}

/**
 * プロジェクト統計取得フックの戻り値型
 */
interface UseProjectStatsReturn {
  stats: ProjectStats | null; // 統計データ（取得前はnull）
  isLoading: boolean; // ローディング状態
  error: Error | null; // エラー情報
  refetch: () => Promise<void>; // 再取得関数
}

/**
 * プロジェクト統計を取得するカスタムフック
 *
 * 使用例:
 * ```tsx
 * const { stats, isLoading, error } = useProjectStats();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage />;
 *
 * return <div>総プロジェクト数: {stats.total}</div>;
 * ```
 */
export const useProjectStats = (): UseProjectStatsReturn => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Supabaseからプロジェクト統計を取得する関数
   */
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 全プロジェクトを取得（ステータスのみ）
      const { data: projects, error: fetchError } = await supabase
        .from('projects')
        .select('status');

      if (fetchError) {
        throw new Error(`統計の取得に失敗しました: ${fetchError.message}`);
      }

      // ステータス別にカウント
      const statsData: ProjectStats = {
        total: projects?.length || 0,
        active: 0,
        completed: 0,
        draft: 0,
        pending: 0,
      };

      // 各プロジェクトのステータスをカウント
      projects?.forEach((project) => {
        const status = project.status as ProjectStatus;
        if (status in statsData) {
          statsData[status]++;
        }
      });

      setStats(statsData);
    } catch (err) {
      console.error('プロジェクト統計の取得エラー:', err);
      setError(err instanceof Error ? err : new Error('不明なエラーが発生しました'));
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時に統計を取得
  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};

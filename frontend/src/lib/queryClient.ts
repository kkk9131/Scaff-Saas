import { QueryClient } from '@tanstack/react-query';

/**
 * React Queryのクライアント設定
 *
 * - staleTime: 5分間はキャッシュを新鮮として扱う
 * - gcTime: 10分間はキャッシュを保持する
 * - retry: 3回まで自動リトライ
 * - refetchOnWindowFocus: ウィンドウフォーカス時の自動リフェッチを無効化
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 10, // 10分
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

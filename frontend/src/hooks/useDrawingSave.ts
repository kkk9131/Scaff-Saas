// 最小スタブ: 将来の自動保存実装用フック
import { useEffect } from 'react';

export function useDrawingSave(_opts?: { intervalMs?: number; actionThreshold?: number }) {
  void _opts;
  useEffect(() => {
    // ここでは何もしない（ビルドエラー回避のためのスタブ）
  }, []);
}

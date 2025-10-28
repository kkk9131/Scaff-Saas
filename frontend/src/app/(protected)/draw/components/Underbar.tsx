/**
 * Underbar.tsx
 * 作図画面下部のステータスバーコンポーネント
 *
 * 機能:
 * - マウス座標の表示
 * - 拡大率の表示
 * - 非表示ボタン
 */

'use client';

import { useDrawingStore } from '@/stores/drawingStore';
import { Move, ZoomIn, X } from 'lucide-react';

/**
 * Underbarコンポーネント
 * キャンバスの状態情報を表示する
 */
export default function Underbar() {
  const {
    mousePosition,
    canvasScale,
    underbarVisible,
    toggleUnderbar,
  } = useDrawingStore();

  // 非表示の場合は何も表示しない
  if (!underbarVisible) return null;

  return (
    <footer className="glass-scope fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-all duration-300">
      <div className="relative flex items-center gap-4 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200">
        {/* マウス座標 */}
        <div className="flex items-center gap-2">
          <Move size={14} className="text-cyan-400" />
          <span className="font-mono text-xs">
            X: <span className="font-semibold">{mousePosition.x}</span> |
            Y: <span className="font-semibold">{mousePosition.y}</span>
          </span>
        </div>

        {/* 区切り線 */}
        <div className="h-3 w-px bg-white/20 dark:bg-slate-700/50" />

        {/* 拡大率 */}
        <div className="flex items-center gap-1.5">
          <ZoomIn size={14} className="text-cyan-400" />
          <span className="font-mono text-xs">
            <span className="font-semibold">
              {Math.round(canvasScale * 100)}
            </span>
            %
          </span>
        </div>

        {/* 区切り線 */}
        <div className="h-3 w-px bg-white/20 dark:bg-slate-700/50" />

        {/* 非表示ボタン */}
        <button
          onClick={toggleUnderbar}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
          title="ステータスバーを非表示"
          aria-label="ステータスバーを非表示"
        >
          <X size={14} />
        </button>
      </div>
    </footer>
  );
}

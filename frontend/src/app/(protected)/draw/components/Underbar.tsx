/**
 * Underbar.tsx
 * 作図画面下部のステータスバーコンポーネント
 *
 * 機能:
 * - モディファイアキー（Shift / Alt / Space）の押下状態表示
 * - 各キーのホバー時に説明ツールチップ表示
 * - 拡大率の表示
 * - 非表示ボタン
 */

'use client';

import { useEffect, useState } from 'react';
import { useDrawingStore } from '@/stores/drawingStore';
import { Keyboard, ArrowUp, MousePointer2, ZoomIn, X } from 'lucide-react';

/**
 * Underbarコンポーネント
 * キャンバスの状態情報を表示する
 */
export default function Underbar() {
  const {
    canvasScale,
    underbarVisible,
    toggleUnderbar,
  } = useDrawingStore();

  // モディファイアキーの押下状態をローカルで管理
  const [shiftDown, setShiftDown] = useState(false);
  const [altDown, setAltDown] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);

  /**
   * グローバルなキーダウン/アップを監視して状態を更新
   * - Shift: ブラケットW/S切替（トグル操作の目印として押下状態を視覚化）
   * - Alt: 方向反転（押下中のみ有効のため視覚化）
   * - Space: パンモード（押下中のみ有効のため視覚化）
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(true);
      if (e.key === 'Alt') setAltDown(true);
      if (e.code === 'Space') setSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(false);
      if (e.key === 'Alt') setAltDown(false);
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 非表示の場合は何も表示しない
  if (!underbarVisible) return null;

  return (
    <footer className="glass-scope fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-all duration-300">
      <div className="relative flex items-center gap-4 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200">
        {/* モディファイアキーの状態表示（ホバー時ツールチップ） */}
        <div className="flex items-center gap-2">
          <Keyboard size={14} className="text-cyan-400" />
          <div className="flex items-center gap-1.5">
            {/* Shift */}
            <div className={`group relative rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              shiftDown ? 'border-cyan-400 text-cyan-400' : 'border-white/30 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-1">
                <ArrowUp size={12} />
                <span>Shift</span>
              </div>
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border-slate-300 bg-white text-black dark:border-slate-700 dark:bg-black dark:text-white">
                ブラケットW/S切替（押下でトグル）
              </div>
            </div>

            {/* Alt */}
            <div className={`group relative rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              altDown ? 'border-cyan-400 text-cyan-400' : 'border-white/30 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Alt</span>
              </div>
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border-slate-300 bg-white text-black dark:border-slate-700 dark:bg-black dark:text-white">
                方向反転（押下中のみ有効）
              </div>
            </div>

            {/* Space */}
            <div className={`group relative rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              spaceDown ? 'border-cyan-400 text-cyan-400' : 'border-white/30 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-1">
                <MousePointer2 size={12} />
                <span>Space</span>
              </div>
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border-slate-300 bg-white text-black dark:border-slate-700 dark:bg-black dark:text-white">
                パンモード（押下中のみ有効）
              </div>
            </div>
          </div>
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

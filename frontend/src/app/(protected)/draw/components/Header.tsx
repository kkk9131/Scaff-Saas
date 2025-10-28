/**
 * Header.tsx
 * 作図画面のヘッダーコンポーネント
 *
 * 機能:
 * - ダッシュボードと同じ透過スタイルのヘッダー
 * - ステータスバーの表示/非表示トグル
 * - ライト/ダークモード切り替え
 */

'use client';

import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Save, Eye, EyeOff, Sun, Moon } from 'lucide-react';

/**
 * Headerコンポーネント
 * 作図画面上部のナビゲーションとコントロール
 */
export default function Header() {
  const { underbarVisible, toggleUnderbar, undo, redo } = useDrawingStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-scope fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50">
      <div className="relative flex items-center gap-2 px-6 py-3">
        {/* コントロールボタン */}
        <div className="flex items-center gap-2">
          {/* 元に戻す */}
          <button
            onClick={undo}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            title="元に戻す (Ctrl+Z)"
            aria-label="元に戻す"
          >
            <Undo2 size={18} />
          </button>

          {/* やり直す */}
          <button
            onClick={redo}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            title="やり直す (Ctrl+Y)"
            aria-label="やり直す"
          >
            <Redo2 size={18} />
          </button>

          {/* 保存 */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            title="保存 (Ctrl+S)"
            aria-label="保存"
          >
            <Save size={18} />
          </button>

          {/* 区切り線 */}
          <div className="h-6 w-px bg-white/20 dark:bg-slate-700/50 mx-2" />

          {/* ステータスバー表示切替 */}
          <button
            onClick={toggleUnderbar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            title={
              underbarVisible
                ? 'ステータスバーを非表示'
                : 'ステータスバーを表示'
            }
            aria-label={
              underbarVisible
                ? 'ステータスバーを非表示'
                : 'ステータスバーを表示'
            }
          >
            {underbarVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {/* テーマ切り替えボタン */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

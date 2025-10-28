/**
 * ModeTabs.tsx
 * 作図モード切替タブコンポーネント
 *
 * 機能:
 * - 4つのモード切り替え（draw/edit/memo/view）
 * - ショートカットキー（1/2/3/4）対応
 * - アクティブモードの視覚化
 */

'use client';

import { useEffect } from 'react';
import { useDrawingModeStore, DrawingMode, MODES } from '@/stores/drawingModeStore';
import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ModeTabsコンポーネント
 * 作図モード切り替えタブUI
 */
export default function ModeTabs() {
  const { currentMode, setMode } = useDrawingModeStore();
  const { modeTabsVisible, toggleModeTabs } = useDrawingStore();
  const { theme } = useTheme();

  // ショートカットキー（1/2/3/4）のグローバルリスナー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Input、Textarea、ContentEditable内での入力は無視
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ctrl、Alt、Meta キーが押されている場合は無視
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // ショートカットキーに対応するモードを取得
      const keyToMode: Record<string, DrawingMode> = {
        '1': 'draw',
        '2': 'edit',
        '3': 'memo',
        '4': 'view',
      };

      const mode = keyToMode[event.key];
      if (mode) {
        event.preventDefault();
        setMode(mode);
      }
    };

    // グローバルキーダウンリスナーを登録
    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setMode]);

  // モードタブをクリック
  const handleModeClick = (mode: DrawingMode) => {
    setMode(mode);
  };

  // モードの配列
  const modeList: DrawingMode[] = ['draw', 'edit', 'memo', 'view'];

  // 折りたたみ状態の場合
  if (!modeTabsVisible) {
    return (
      <button
        onClick={toggleModeTabs}
        className="glass-scope fixed top-20 left-4 z-20 rounded-xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 p-2 transition-all hover:bg-white/10 before:absolute before:inset-0 before:rounded-xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
        title="モードタブを表示"
        aria-label="モードタブを表示"
      >
        <ChevronRight className="text-slate-700 dark:text-slate-300" size={20} />
      </button>
    );
  }

  return (
    <div className="glass-scope fixed top-20 left-4 z-20 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50">
      {/* 折りたたみボタン */}
      <div className="relative flex justify-end p-2 border-b border-white/20 dark:border-slate-700/50">
        <button
          onClick={toggleModeTabs}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
          title="モードタブを非表示"
          aria-label="モードタブを非表示"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="relative flex flex-col gap-1 p-2">
        {modeList.map((mode) => {
          const modeInfo = MODES[mode];
          const isActive = currentMode === mode;

          return (
            <button
              key={mode}
              onClick={() => handleModeClick(mode)}
              className={`
                group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-slate-900 dark:text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              `}
              title={`${modeInfo.name} (ショートカット: ${modeInfo.shortcutKey})`}
              aria-label={`${modeInfo.name} - ${modeInfo.description}`}
            >
              {/* アクティブ時の左側インジケーター */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-500 to-indigo-500" />
              )}

              {/* アイコン */}
              <span className="text-xl">{modeInfo.icon}</span>

              {/* モード名とショートカット */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{modeInfo.name}</span>
                <span className="text-xs opacity-60">{modeInfo.shortcutKey}</span>
              </div>

              {/* ホバー時のグロー効果 */}
              {!isActive && (
                <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-sky-400/10 to-indigo-400/10" />
              )}
            </button>
          );
        })}
      </div>

      {/* 説明テキスト */}
      <div className="relative border-t border-white/20 dark:border-slate-700/50 px-4 py-2">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {MODES[currentMode].description}
        </p>
      </div>
    </div>
  );
}

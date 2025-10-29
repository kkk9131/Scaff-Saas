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

import { useEffect, type ReactNode } from 'react';
import { useDrawingModeStore, DrawingMode, MODES } from '@/stores/drawingModeStore';
import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, PencilRuler, Wrench, StickyNote, Eye } from 'lucide-react';

/**
 * ModeTabsコンポーネント
 * 作図モード切り替えタブUI
 */
export default function ModeTabs() {
  const { currentMode, setMode } = useDrawingModeStore();
  const { modeTabsVisible, toggleModeTabs, leftSidebarOpen } = useDrawingStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // 絵文字ではなくアイコン（lucide-react）を使用
  const MODE_ICONS: Record<DrawingMode, ReactNode> = {
    draw: <PencilRuler size={18} />,
    edit: <Wrench size={18} />,
    memo: <StickyNote size={18} />,
    view: <Eye size={18} />,
  };

  // 折りたたみ状態の場合
  // サイドバー開閉に応じて左位置を可変に（重なり回避）
  const leftClass = leftSidebarOpen ? 'left-24' : 'left-4';

  if (!modeTabsVisible) {
    return (
      <button
        onClick={toggleModeTabs}
        /*
         * サイドバー開時に重ならないよう、左位置を動的に（left-24）
         * 縦位置はサイドバー(top-20)より少し下の top-40 に配置
         */
        className={`glass-scope fixed top-40 ${leftClass} z-20 rounded-xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 p-2 transition-all hover:bg-white/10 before:absolute before:inset-0 before:rounded-xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50`}
        title="モードタブを表示"
        aria-label="モードタブを表示"
      >
        <ChevronRight className="text-slate-700 dark:text-slate-300" size={20} />
      </button>
    );
  }

  return (
    <div className={`glass-scope fixed top-20 ${leftClass} z-20 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50`}>
      
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

          // グローオーバーレイはビルドエラー回避のため一旦無効化（必要なら別実装で復活）

          // ボタンのクラスを事前計算
          const baseBtnClass = 'group relative flex items-center justify-center rounded-xl p-3 transition-all duration-200';
          const stateClass = isActive
            ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-500 dark:text-sky-300 shadow-md shadow-sky-500/20'
            : 'text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white';
          const btnClassName = baseBtnClass + ' ' + stateClass;

          // ツールチップのクラス（テーマに合わせて明暗を完全指定）
          const tooltipClass =
            'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 ' +
            (isDark
              ? 'border-slate-700 bg-black text-white'
              : 'border-slate-300 bg-white text-black');

          return (
            <button
              key={mode}
              onClick={() => handleModeClick(mode)}
              className={btnClassName}
              title={`${modeInfo.name} (ショートカット: ${modeInfo.shortcutKey})`}
              aria-label={`${modeInfo.name}`}
            >
              
              {isActive ? (
                <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-500 to-indigo-500" />
              ) : null}

              
              <span className="text-xl flex items-center justify-center">
                {MODE_ICONS[mode]}
              </span>

              <div className={tooltipClass} role="tooltip">
                {modeInfo.name}（{modeInfo.shortcutKey}）
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}

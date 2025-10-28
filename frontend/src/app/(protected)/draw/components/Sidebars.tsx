/**
 * Sidebars.tsx
 * 作図画面の左右サイドバーコンポーネント
 *
 * 機能:
 * - 左サイドバー: ツール選択、グリッド設定
 * - 右サイドバー: AIチャットプレースホルダー
 */

'use client';

import { useDrawingStore, type DrawingTool } from '@/stores/drawingStore';
import {
  MousePointer,
  Minus,
  Square,
  Circle,
  Type,
  Eraser,
  Grid3x3,
  Magnet,
  Eye,
  EyeOff,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * 左サイドバーコンポーネント
 * ツール選択とグリッド設定を提供
 */
function LeftSidebar() {
  const {
    currentTool,
    setTool,
    gridSize,
    setGridSize,
    snapToGrid,
    toggleSnapToGrid,
    showGrid,
    toggleShowGrid,
    leftSidebarOpen,
    toggleLeftSidebar,
  } = useDrawingStore();

  // ツール定義
  const tools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer size={20} />, label: '選択' },
    { id: 'line', icon: <Minus size={20} />, label: '直線' },
    { id: 'rect', icon: <Square size={20} />, label: '矩形' },
    { id: 'circle', icon: <Circle size={20} />, label: '円' },
    { id: 'text', icon: <Type size={20} />, label: 'テキスト' },
    { id: 'eraser', icon: <Eraser size={20} />, label: '消しゴム' },
  ];

  return (
    <aside
      className={`glass-scope fixed left-4 top-20 z-10 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-all duration-300 ${
        leftSidebarOpen ? 'w-16' : 'w-12'
      }`}
    >
      <div className="relative flex flex-col gap-2 p-3">
        {/* 折りたたみボタン */}
        <button
          onClick={toggleLeftSidebar}
          className="flex h-8 w-full items-center justify-center rounded-lg text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all mb-2"
          title={leftSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
          aria-label={leftSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${
              leftSidebarOpen ? '' : 'rotate-180'
            }`}
          />
        </button>

        {/* サイドバーが開いている時のみコンテンツ表示 */}
        {leftSidebarOpen && (
          <>
            {/* ツールボタン */}
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setTool(tool.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  currentTool === tool.id
                    ? 'bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-indigo-500/20 text-cyan-400 shadow-md'
                    : 'text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
                title={tool.label}
                aria-label={tool.label}
              >
                {tool.icon}
              </button>
            ))}

            {/* 区切り線 */}
            <div className="my-2 h-px bg-white/20 dark:bg-slate-700/50" />

            {/* グリッドサイズ切替 */}
            <button
              onClick={() => setGridSize(gridSize === 150 ? 300 : 150)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold transition-all text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              title={`グリッドサイズ: ${gridSize}mm`}
              aria-label={`グリッドサイズ: ${gridSize}mm`}
            >
              <div className="flex flex-col items-center">
                <Grid3x3 size={16} />
                <span className="text-[10px] mt-0.5">{gridSize}</span>
              </div>
            </button>

            {/* スナップON/OFF */}
            <button
              onClick={toggleSnapToGrid}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                snapToGrid
                  ? 'bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-indigo-500/20 text-cyan-400'
                  : 'text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              title={`スナップ: ${snapToGrid ? 'ON' : 'OFF'}`}
              aria-label={`スナップ: ${snapToGrid ? 'ON' : 'OFF'}`}
            >
              <Magnet size={20} />
            </button>

            {/* グリッド表示ON/OFF */}
            <button
              onClick={toggleShowGrid}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              title={`グリッド表示: ${showGrid ? 'ON' : 'OFF'}`}
              aria-label={`グリッド表示: ${showGrid ? 'ON' : 'OFF'}`}
            >
              {showGrid ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * 右サイドバーコンポーネント
 * AIチャット領域（プレースホルダー）
 */
function RightSidebar() {
  const { rightSidebarOpen, toggleRightSidebar } = useDrawingStore();

  return (
    <aside
      className={`glass-scope fixed right-4 top-20 bottom-20 z-10 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-all duration-300 ${
        rightSidebarOpen ? 'w-80' : 'w-12'
      }`}
    >
      <div className="relative flex h-full flex-col p-4">
        {/* 折りたたみボタン */}
        <button
          onClick={toggleRightSidebar}
          className="flex h-8 w-full items-center justify-center rounded-lg text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all mb-4"
          title={rightSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
          aria-label={
            rightSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'
          }
        >
          <ChevronRight
            size={18}
            className={`transition-transform duration-300 ${
              rightSidebarOpen ? '' : 'rotate-180'
            }`}
          />
        </button>

        {/* サイドバーが開いている時のみコンテンツ表示 */}
        {rightSidebarOpen && (
          <>
            {/* ヘッダー */}
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AIアシスタント</h3>
            </div>

            {/* プレースホルダー */}
            <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/20">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AIチャット機能は準備中です
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * Sidebarsコンポーネント
 * 左右のサイドバーを統合
 */
export default function Sidebars() {
  return (
    <>
      <LeftSidebar />
      <RightSidebar />
    </>
  );
}

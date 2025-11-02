/**
 * Sidebars.tsx
 * 作図画面の左右サイドバーコンポーネント
 *
 * 機能（MVP要件準拠）:
 * - 左サイドバー: 作図設定（スナップ、グリッド間隔、グリッド表示、ブラケットW/S、方向反転、色パレット）
 *   - すべてアイコン（またはスウォッチ）＋ホバー説明カード
 * - 右サイドバー: AIチャットプレースホルダー
 */

'use client';

import { useDrawingStore } from '@/stores/drawingStore';
import { useDrawingModeStore } from '@/stores/drawingModeStore';
import type { ScaffoldPartType } from '@/types/scaffold';
import {
  Grid3x3,
  Magnet,
  Eye,
  EyeOff,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * 左サイドバーコンポーネント
 * ツール選択とグリッド設定を提供
 */
function LeftSidebar() {
  const {
    gridSize,
    setGridSize,
    snapToGrid,
    toggleSnapToGrid,
    showGrid,
    toggleShowGrid,
    bracketSize,
    setBracketSize,
    directionReversed,
    toggleDirectionReversed,
    currentColor,
    setCurrentColor,
    leftSidebarOpen,
    toggleLeftSidebar,
    editTargetType,
    setEditTargetType,
  } = useDrawingStore();
  const { currentMode } = useDrawingModeStore();

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltipCls = `pointer-events-none absolute left-full top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
    isDark ? 'border-slate-700 bg-black text-white' : 'border-slate-300 bg-white text-black'
  }`;

  // カラースウォッチのユーティリティ
  const Swatch = ({ color, label }: { color: 'white'|'red'|'blue'|'green'; label: string }) => (
    <button
      onClick={() => setCurrentColor(color)}
      className={`group relative h-5 w-5 rounded-full border transition-all ${
        currentColor === color
          ? 'ring-1 ring-cyan-400 border-transparent'
          : 'border-white/40 dark:border-slate-700/60'
      }`}
      style={{ backgroundColor: color === 'white' ? '#ffffff' : color === 'red' ? '#EF4444' : color === 'blue' ? '#3B82F6' : '#10B981' }}
      aria-label={`色: ${label}`}
      title={`色: ${label}`}
    >
      {/* 白は見やすいよう薄いアウトライン */}
      {color === 'white' ? (
        <span className="absolute inset-0 rounded-full border border-slate-300/70" />
      ) : null}
      <div className={tooltipCls} role="tooltip">色: {label}</div>
    </button>
  );

  /**
   * 編集対象の部材ボタン
   * - 編集モード時のみ表示
   * - 6種（柱/布材/ブラケット/アンチ/階段/梁枠）
   */
  const EditTargetButton = ({
    type,
    glyph,
  }: {
    type: ScaffoldPartType;
    /** 小さな表示文字（1～2文字） */
    glyph: string;
  }) => (
    <button
      onClick={() => setEditTargetType(type)}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all select-none ${
        editTargetType === type
          ? 'bg-gradient-to-br from-cyan-400/20 via-sky-400/20 to-indigo-500/20 outline outline-2 outline-cyan-400 text-sky-300'
          : 'text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
      }`}
      aria-label={`編集対象: ${type}`}
      title={`編集対象: ${type}`}
    >
      <span>{glyph}</span>
      <div className={tooltipCls} role="tooltip">編集対象: {type}</div>
    </button>
  );

  return (
    <aside
      className={`glass-scope fixed left-4 top-20 bottom-20 z-10 overflow-hidden rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-all duration-300 ${
        leftSidebarOpen ? 'w-16' : 'w-12'
      }`}
    >
      <div className="relative flex h-full flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden overscroll-contain">
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

        {leftSidebarOpen && (
          <>
            {/* ブラケット W/S 切替 */}
            <button
              onClick={() => setBracketSize(bracketSize === 'W' ? 'S' : 'W')}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                bracketSize === 'W'
                  ? 'text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  : 'text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              aria-label={`ブラケット: ${bracketSize}`}
              title={`ブラケット: ${bracketSize}`}
            >
              <span className="font-bold text-xs select-none">{bracketSize}</span>
              <div className={tooltipCls} role="tooltip">ブラケットサイズ（W:600 / S:355）</div>
            </button>

            {/* スナップON/OFF */}
            <button
              onClick={toggleSnapToGrid}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                snapToGrid
                  ? 'bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-indigo-500/20 text-cyan-400'
                  : 'text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              aria-label={`スナップ: ${snapToGrid ? 'ON' : 'OFF'}`}
              title={`スナップ: ${snapToGrid ? 'ON' : 'OFF'}`}
            >
              <Magnet size={20} />
              <div className={tooltipCls} role="tooltip">グリッドにスナップ（ON/OFF）</div>
            </button>

            {/* グリッドサイズ 150/300 */}
            <button
              onClick={() => setGridSize(gridSize === 150 ? 300 : 150)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold transition-all text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              aria-label={`グリッド: ${gridSize}mm`}
              title={`グリッド: ${gridSize}mm`}
            >
              <div className="flex flex-col items-center">
                <Grid3x3 size={16} />
                <span className="text-[10px] mt-0.5">{gridSize}</span>
              </div>
              <div className={tooltipCls} role="tooltip">グリッド間隔（150/300mm）</div>
            </button>

            {/* グリッド表示ON/OFF */}
            <button
              onClick={toggleShowGrid}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              aria-label={`グリッド表示: ${showGrid ? 'ON' : 'OFF'}`}
              title={`グリッド表示: ${showGrid ? 'ON' : 'OFF'}`}
            >
              {showGrid ? <Eye size={20} /> : <EyeOff size={20} />}
              <div className={tooltipCls} role="tooltip">グリッド表示（ON/OFF）</div>
            </button>

            {/* 方向反転（Alt連動）インジケータ/トグル */}
            <button
              onClick={toggleDirectionReversed}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                directionReversed
                  ? 'bg-gradient-to-br from-rose-400/20 via-amber-400/20 to-indigo-500/20 text-rose-400'
                  : 'text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              aria-label={`方向反転: ${directionReversed ? 'ON' : 'OFF'}`}
              title={`方向反転: ${directionReversed ? 'ON' : 'OFF'}`}
            >
              <ArrowLeftRight size={18} />
              <div className={tooltipCls} role="tooltip">方向反転（Alt押下でも切替）</div>
            </button>

            {/* 区切り */}
            <div className="my-2 h-px bg-white/20 dark:bg-slate-700/50" />

            {/* 色パレット（white/red/blue/green） */}
            <div className="grid grid-cols-2 gap-1.5">
              <Swatch color="white" label="White" />
              <Swatch color="red" label="Red" />
              <Swatch color="blue" label="Blue" />
              <Swatch color="green" label="Green" />
            </div>

            {/* 編集モード時のみ: 編集対象の部材選択 */}
            {currentMode === 'edit' && (
              <>
                {/* 区切り */}
                <div className="my-2 h-px bg-white/20 dark:bg-slate-700/50" />
                {/* セクション見出し（視覚的な説明） */}
                <div className="mb-1 text-[10px] font-semibold tracking-wider text-slate-600 dark:text-slate-400 text-center">編集対象</div>
                {/* 7種の部材タイプ選択（2列） */}
                <div className="grid grid-cols-1 gap-2">
                  {/* 柱 / 布材 */}
                  <EditTargetButton type="柱" glyph="柱" />
                  <EditTargetButton type="布材" glyph="布" />
                  {/* ブラケット / アンチ */}
                  <EditTargetButton type="ブラケット" glyph="ブ" />
                  <EditTargetButton type="アンチ" glyph="ア" />
                  {/* はね / 階段 / 梁枠 */}
                  <EditTargetButton type="ハネ" glyph="羽" />
                  <EditTargetButton type="階段" glyph="階" />
                  <EditTargetButton type="梁枠" glyph="梁" />
                </div>
              </>
            )}
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

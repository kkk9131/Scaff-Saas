/**
 * /draw - 作図ページ
 * 足場の2D図面作成画面
 *
 * 機能:
 * - Konva.jsによる2Dキャンバス作図
 * - ズーム・パン機能
 * - グリッド表示（150mm / 300mm切り替え）
 * - ツール選択（選択、直線、矩形、円、テキスト、消しゴム）
 * - 折りたたみ可能なサイドバー
 * - AIチャット統合（プレースホルダー）
 */

'use client';

import { useTheme } from '@/contexts/ThemeContext';
import Header from './components/Header';
import CanvasStage from './components/CanvasStage';
import Sidebars from './components/Sidebars';
import Underbar from './components/Underbar';
import DraggablePanel from './components/DraggablePanel';

/**
 * 作図ページコンポーネント
 * すべての作図関連コンポーネントを統合
 */
export default function DrawPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <main
      className={`relative h-screen w-screen overflow-hidden transition-colors duration-500 ${
        isDark ? 'aurora-bg' : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
      }`}
    >
      {/* ライトモード時のみ装飾グローを表示（ダッシュボードと同じスタイル） */}
      {!isDark && (
        <>
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl bg-sky-300/40" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl bg-rose-200/40" />
          <div className="pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl bg-cyan-200/40" />
        </>
      )}

      <div className="relative z-10 h-full w-full">
        {/* ヘッダー */}
        <Header />

        {/* メインキャンバス */}
        <CanvasStage />

        {/* サイドバー（左: ツール選択 / 右: AIチャット） */}
        <Sidebars />

        {/* 下部ステータスバー */}
        <Underbar />

        {/* ドラッグ可能な数量表パネル */}
        <DraggablePanel />
      </div>
    </main>
  );
}

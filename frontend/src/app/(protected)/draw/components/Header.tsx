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

import { useState, useEffect, useCallback } from 'react';
import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Save, Eye, EyeOff, Sun, Moon, RotateCcw, FileJson, Image as ImageIcon } from 'lucide-react';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import PngPreviewModal from './PngPreviewModal';

/**
 * Headerコンポーネント
 * 作図画面上部のナビゲーションとコントロール
 */
export default function Header() {
  const { underbarVisible, toggleUnderbar, undo, redo, resetDrawing, exportToJSON } = useDrawingStore();
  const { theme, toggleTheme } = useTheme();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isPngPreviewOpen, setIsPngPreviewOpen] = useState(false);
  const isDark = theme === 'dark';
  const tooltipCls = `pointer-events-none absolute left-full top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
    isDark ? 'border-slate-700 bg-black text-white' : 'border-slate-300 bg-white text-black'
  }`;

  // リセット確認処理
  const handleResetConfirm = () => {
    resetDrawing();
    setIsResetModalOpen(false);
  };

  // 保存モーダルを開く
  const handleSaveClick = useCallback(() => {
    setIsSaveModalOpen(true);
  }, []);

  // JSON保存処理
  const handleSaveJSON = useCallback(() => {
    try {
      const jsonData = exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scaffold-drawing-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  }, [exportToJSON]);

  // PNG保存処理
  const handleSavePNG = useCallback(() => {
    setIsSaveModalOpen(false);
    setIsPngPreviewOpen(true);
  }, []);

  // PNGエクスポート完了処理
  const handlePngExportComplete = useCallback(() => {
    setIsPngPreviewOpen(false);
  }, []);

  // Ctrl+S キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveClick]);

  return (
    <>
      <header className="glass-scope fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50">
        <div className="relative flex items-center gap-2 px-6 py-3">
          {/* コントロールボタン */}
          <div className="flex items-center gap-2">
            {/* リセットボタン */}
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="作図をリセット"
            >
              <RotateCcw size={18} />
              <div className={tooltipCls} role="tooltip">作図をリセット</div>
            </button>

            {/* 元に戻す */}
            <button
              onClick={undo}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="元に戻す (Ctrl+Z)"
            >
              <Undo2 size={18} />
              <div className={tooltipCls} role="tooltip">元に戻す (Ctrl+Z)</div>
            </button>

            {/* やり直す */}
            <button
              onClick={redo}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="やり直す (Ctrl+Y)"
            >
              <Redo2 size={18} />
              <div className={tooltipCls} role="tooltip">やり直す (Ctrl+Y)</div>
            </button>

            {/* 保存 */}
            <button
              onClick={handleSaveClick}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="保存 (Ctrl+S)"
            >
              <Save size={18} />
              <div className={tooltipCls} role="tooltip">保存 (Ctrl+S)</div>
            </button>

            {/* 区切り線 */}
            <div className="h-6 w-px bg-white/20 dark:bg-slate-700/50 mx-2" />

            {/* ステータスバー表示切替 */}
            <button
              onClick={toggleUnderbar}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label={underbarVisible ? 'ステータスバーを非表示' : 'ステータスバーを表示'}
            >
              {underbarVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              <div className={tooltipCls} role="tooltip">{underbarVisible ? 'ステータスバーを非表示' : 'ステータスバーを表示'}</div>
            </button>

            {/* テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <div className={tooltipCls} role="tooltip">{theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}</div>
            </button>
        </div>
      </div>
    </header>

    {/* リセット確認モーダル */}
    <ConfirmModal
      isOpen={isResetModalOpen}
      onClose={() => setIsResetModalOpen(false)}
      onConfirm={handleResetConfirm}
      title="作図をリセット"
      description="すべての作図データ（足場、メモなど）が削除されます。この操作は取り消せません。リセットしてもよろしいですか？"
      confirmText="リセットする"
      cancelText="キャンセル"
      variant="destructive"
      className="reset-modal-card"
    />

    {/* 保存方法選択モーダル */}
    <Modal
      isOpen={isSaveModalOpen}
      onClose={() => setIsSaveModalOpen(false)}
      title="保存形式を選択"
      description="保存したい形式を選択してください"
      size="sm"
      className="save-modal-card"
      contentClassName="p-4"
      footer={
        <button
          onClick={() => setIsSaveModalOpen(false)}
          className="px-4 py-2 text-sm bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20 rounded-lg border transition-colors"
        >
          キャンセル
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {/* JSON保存カード */}
        <button
          onClick={handleSaveJSON}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/40 shadow-sm transition-all',
            'hover:border-primary/50 hover:bg-primary/5',
            'dark:hover:bg-primary/10',
            'dark:border-slate-700/50 dark:bg-slate-800/60',
            'cursor-pointer',
            'save-format-card'
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <FileJson size={20} className="text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-0.5 text-slate-900 dark:text-slate-100">JSON形式</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              作図データをJSON形式で保存します
            </p>
          </div>
        </button>

        {/* PNG保存カード */}
        <button
          onClick={handleSavePNG}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/40 shadow-sm transition-all',
            'hover:border-primary/50 hover:bg-primary/5',
            'dark:hover:bg-primary/10',
            'dark:border-slate-700/50 dark:bg-slate-800/60',
            'cursor-pointer',
            'opacity-60 cursor-not-allowed',
            'save-format-card'
          )}
          disabled
          aria-label="PNG保存（準備中）"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ImageIcon size={20} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-0.5 text-slate-900 dark:text-slate-100">PNG形式</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              画像として保存します
              <br />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">（準備中）</span>
            </p>
          </div>
        </button>
      </div>
    </Modal>

    {/* PNGプレビューモーダル */}
    <PngPreviewModal
      isOpen={isPngPreviewOpen}
      onClose={() => setIsPngPreviewOpen(false)}
      onExport={handlePngExportComplete}
    />
    </>
  );
}

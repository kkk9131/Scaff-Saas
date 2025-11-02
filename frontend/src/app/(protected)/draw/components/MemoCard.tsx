/**
 * MemoCard.tsx
 * メモ編集カードコンポーネント
 *
 * 機能:
 * - メモのテキスト編集
 * - メモの削除
 * - 既存のカードUIと統一されたスタイル
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { StickyNote, X, Trash2 } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export interface MemoCardProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象のメモID */
  memoId: string;
  /** 閉じる */
  onClose: () => void;
}

/**
 * メモ編集カード
 */
export default function MemoCard({ screenPosition, memoId, onClose }: MemoCardProps) {
  const { memos, updateMemo, removeMemo } = useDrawingStore();
  const memo = React.useMemo(() => memos.find((m) => m.id === memoId), [memos, memoId]);

  const [text, setText] = React.useState<string>(memo?.text || '');

  // メモが変更された場合は状態を更新
  React.useEffect(() => {
    if (memo) {
      setText(memo.text);
    }
  }, [memo]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const handleSave = () => {
    if (!memo) return;
    updateMemo(memoId, { text });
    onClose();
  };

  const handleDelete = () => {
    if (!memo) return;
    removeMemo(memoId);
    onClose();
  };

  if (!memo) {
    return null;
  }

  return (
    <div
      style={style}
      className="glass-scope memo-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="メモ編集カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">メモ編集</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
            aria-label="削除"
            title="削除"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="relative p-3">
        {/* テキストエリア */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メモを入力してください..."
          className="w-full min-h-[120px] rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-500 resize-y"
          aria-label="メモテキスト"
        />

        {/* フッター操作 */}
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#3B82F6] !text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.55)] hover:from-[#4F46E5] hover:via-[#0EA5E9] hover:to-[#2563EB] dark:bg-[#7C3AED] dark:hover:bg-[#8B5CF6]"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}


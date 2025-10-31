/**
 * AntiLevelCard.tsx
 * アンチの青色発光部分クリックで表示する段数調整カード
 *
 * 機能:
 * - 段数の増減
 * - 既存の数量表カードと同じガラス調ヘッダーUIに統一
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Layers, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export interface AntiLevelCardProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象のグループID */
  groupId: string;
  /** 対象のアンチpart ID */
  partId: string;
  /** 閉じる */
  onClose: () => void;
}

/**
 * アンチの段数調整カード
 */
export default function AntiLevelCard({ screenPosition, groupId, partId, onClose }: AntiLevelCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const part = React.useMemo(() => group?.parts.find((p) => p.id === partId), [group, partId]);

  const initialLevel = Number(part?.meta?.levels ?? 1);
  // 現在選択中のアンチ寸法（mm）
  const lengthMm = Number(part?.meta?.length ?? 0);

  const [level, setLevel] = React.useState<number>(isNaN(initialLevel) || initialLevel < 1 ? 1 : initialLevel);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const save = () => {
    if (!group) return;
    const nextParts = group.parts.map((p) =>
      p.id === partId
        ? {
            ...p,
            meta: {
              ...(p.meta || {}),
              levels: Math.max(1, level), // 段数は最低1段
            },
          }
        : p
    );
    updateScaffoldGroup(group.id, { parts: nextParts });
    onClose();
  };

  return (
    <div
      style={style}
      className="glass-scope anti-level-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="アンチの段数調整カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">アンチの段数調整</h3>
          {/* 選択中の寸法表示（例: 1800mm） */}
          {lengthMm > 0 && (
            <span className="ml-1 inline-flex items-center rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-300">
              {`${lengthMm}mm`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
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
        <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">段数</div>
          <div className="flex items-center gap-0.5 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              aria-label="段数を1減らす"
              onClick={() => setLevel((v) => Math.max(1, v - 1))}
            >
              <Minus size={12} />
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-7 w-16 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              value={String(level)}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value || 1));
                setLevel(val);
              }}
              aria-label="段数"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              aria-label="段数を1増やす"
              onClick={() => setLevel((v) => v + 1)}
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>

        {/* 操作 */}
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(14,165,233,0.25)] hover:bg-sky-50 hover:!text-sky-700 hover:!border-sky-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-[#06B6D4]/20"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={save}
            className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#3B82F6] !text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.55)] hover:from-[#4F46E5] hover:via-[#0EA5E9] hover:to-[#2563EB] dark:bg-[#7C3AED] dark:hover:bg-[#8B5CF6]"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}


/**
 * ClothQuantityCard.tsx
 * 布材の黄色発光部分クリックで表示する数量調整カード
 *
 * 機能:
 * - 数量の増減
 * - ツボ（将来拡張）数量の増減
 * - 既存の数量表カードと同じガラス調ヘッダーUIに統一
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export interface ClothQuantityCardProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象のグループID */
  groupId: string;
  /** 対象の布材part ID */
  partId: string;
  /** 閉じる */
  onClose: () => void;
}

/**
 * 布材の数量調整カード
 */
export default function ClothQuantityCard({ screenPosition, groupId, partId, onClose }: ClothQuantityCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const part = React.useMemo(() => group?.parts.find((p) => p.id === partId), [group, partId]);

  const initialQty = Number(part?.meta?.quantity ?? 0);
  const initialTsubo = Number(part?.meta?.tsubo ?? 0);
  // 現在選択中の布材寸法（mm）
  const lengthMm = Number(part?.meta?.length ?? 0);

  const [qty, setQty] = React.useState<number>(isNaN(initialQty) ? 0 : initialQty);
  const [tsubo, setTsubo] = React.useState<number>(isNaN(initialTsubo) ? 0 : initialTsubo);

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
              quantity: Math.max(0, qty),
              quantityConfirmed: true,
              tsubo: Math.max(0, tsubo),
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
      className="glass-scope cloth-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="布材の数量調整カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Table size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">布材の数量調整</h3>
          {/* 選択中の寸法表示（例: 1800mm） */}
          <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
            {isNaN(lengthMm) ? '-' : `${lengthMm}mm`}
          </span>
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
        <div className="grid grid-cols-2 gap-2">
          {/* 数量 */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">数量</div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="数量を1減らす"
                onClick={() => setQty((v) => Math.max(0, v - 1))}
              >
                <Minus size={12} />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-7 w-12 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                value={String(qty)}
                onChange={(e) => setQty(Math.max(0, Number(e.target.value || 0)))}
                aria-label="数量"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="数量を1増やす"
                onClick={() => setQty((v) => v + 1)}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>

          {/* ツボ（将来拡張） */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">ツボ（将来拡張予定）</div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="ツボを1減らす"
                onClick={() => setTsubo((v) => Math.max(0, v - 1))}
              >
                <Minus size={12} />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-7 w-12 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                value={String(tsubo)}
                onChange={(e) => setTsubo(Math.max(0, Number(e.target.value || 0)))}
                aria-label="ツボ"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="ツボを1増やす"
                onClick={() => setTsubo((v) => v + 1)}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
        </div>

        {/* 操作 */}
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

/**
 * AntiQuantityCard.tsx
 * アンチの黄色発光部分クリックで表示する数量調整カード
 *
 * 機能:
 * - Wの数量の増減
 * - Sの数量の増減
 * - 既存の数量表カードと同じガラス調ヘッダーUIに統一
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export interface AntiQuantityCardProps {
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
 * アンチの数量調整カード
 */
export default function AntiQuantityCard({ screenPosition, groupId, partId, onClose }: AntiQuantityCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const part = React.useMemo(() => group?.parts.find((p) => p.id === partId), [group, partId]);

  const initialWQty = Number(part?.meta?.antiW ?? part?.meta?.quantity ?? 0);
  const initialSQty = Number(part?.meta?.antiS ?? 0);
  // 現在選択中のアンチ寸法（mm）
  const lengthMm = Number(part?.meta?.length ?? 0);

  const [wQty, setWQty] = React.useState<number>(isNaN(initialWQty) ? 0 : initialWQty);
  const [sQty, setSQty] = React.useState<number>(isNaN(initialSQty) ? 0 : initialSQty);

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
              antiW: Math.max(0, wQty),
              antiS: Math.max(0, sQty),
              quantityConfirmed: true,
              // 旧フィールド quantity は削除（WとSで分離したため）
              quantity: undefined,
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
      className="glass-scope anti-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="アンチの数量調整カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Table size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">アンチの数量調整</h3>
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
          {/* Wの数量 */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">W</div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="Wの数量を1減らす"
                onClick={() => setWQty((v) => Math.max(0, v - 1))}
              >
                <Minus size={12} />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-7 w-12 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                value={String(wQty)}
                onChange={(e) => setWQty(Math.max(0, Number(e.target.value || 0)))}
                aria-label="Wの数量"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="Wの数量を1増やす"
                onClick={() => setWQty((v) => v + 1)}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>

          {/* Sの数量 */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">S</div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="Sの数量を1減らす"
                onClick={() => setSQty((v) => Math.max(0, v - 1))}
              >
                <Minus size={12} />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-7 w-12 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                value={String(sQty)}
                onChange={(e) => setSQty(Math.max(0, Number(e.target.value || 0)))}
                aria-label="Sの数量"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="Sの数量を1増やす"
                onClick={() => setSQty((v) => v + 1)}
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
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}

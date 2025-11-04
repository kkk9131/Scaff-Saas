/**
 * BracketConfigCard.tsx
 * ブラケットの青色発光部分クリックで表示する方向と寸法選択カード
 *
 * 機能:
 * - 方向の選択（0度=右、90度=下、180度=左、270度=上）
 * - 寸法の選択（355, 600, 750, 900 mm）
 * - 既存の数量表カードと同じガラス調ヘッダーUIに統一
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Navigation, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';
import { v4 as uuidv4 } from 'uuid';
import { roundToCardinalDirection } from '@/lib/sax/directionRules';
import type { ScaffoldPart } from '@/types/scaffold';

export interface BracketConfigCardProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象のグループID */
  groupId: string;
  /** 対象のブラケットpart ID（既存編集時） */
  partId?: string;
  /** 対象の柱part ID（未作図の柱から新規作図する時） */
  pillarId?: string;
  /** 閉じる */
  onClose: () => void;
}

// 方向の選択肢
const DIRECTIONS = [
  { value: 0, label: '右', icon: '→' },
  { value: 90, label: '下', icon: '↓' },
  { value: 180, label: '左', icon: '←' },
  { value: 270, label: '上', icon: '↑' },
] as const;

// 寸法の選択肢（mm）
const SIZES = [355, 600, 750, 900] as const;

/**
 * ブラケットの方向と寸法選択カード
 */
export default function BracketConfigCard({ screenPosition, groupId, partId, pillarId, onClose }: BracketConfigCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const part = React.useMemo(() => (partId ? group?.parts.find((p) => p.id === partId) : undefined), [group, partId]);
  const pillar = React.useMemo(() => (pillarId ? group?.parts.find((p) => p.id === pillarId) : undefined), [group, pillarId]);

  const baseForInit = part ?? pillar; // 既存ブラケットが無ければ柱情報を初期値の参考に
  const initialDirection = Number(baseForInit?.meta?.direction ?? 0);
  const initialSize = Number(part?.meta?.width ?? 600);

  const [direction, setDirection] = React.useState<number>(
    isNaN(initialDirection) ? 0 : initialDirection
  );
  const [size, setSize] = React.useState<number>(isNaN(initialSize) ? 600 : initialSize);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const save = () => {
    if (!group) return;
    // 既存ブラケットが無い（pillarからの作図）場合は更新ではなく作図にフォールバック
    if (!partId) {
      drawBracket();
      return;
    }
    const nextParts = group.parts.map((p) =>
      p.id === partId
        ? {
            ...p,
            meta: {
              ...(p.meta || {}),
              direction: direction,
              width: size,
            },
          }
        : p
    );
    updateScaffoldGroup(group.id, { parts: nextParts });
    onClose();
  };

  /**
   * 作図: 選択した方向・寸法でブラケットを新規追加（同方向の重複を避ける）
   * - 同じ座標・同じ方向のブラケットが既にある場合は「追加せず、既存を更新」します。
   * - 該当が無い場合のみ新規追加します。
   */
  const drawBracket = () => {
    if (!group) return;
    // 基準（既存ブラケット or 柱）
    const base = part ?? pillar;
    if (!base) return;
    const ax = base.position.x;
    const ay = base.position.y;

    // 方向比較は基準方向（0/90/180/270）に丸めて比較
    const dirSel = roundToCardinalDirection(direction);

    // 1px 以内を同一点とみなす（キャンバス座標の誤差吸収）
    const samePoint = (x: number, y: number) => Math.abs(x - ax) < 1 && Math.abs(y - ay) < 1;

    // 既存の同一点・同方向のブラケットを探索
    const existingIdx = group.parts.findIndex(
      (p) =>
        p.type === 'ブラケット' &&
        samePoint(p.position.x, p.position.y) &&
        roundToCardinalDirection(Number(p.meta?.direction ?? 0)) === dirSel
    );

    // 600/355 の場合のみ bracketSize を付与（他サイズは未設定のまま）
    const bracketSize = size === 600 ? 'W' : size === 355 ? 'S' : undefined;

    if (existingIdx >= 0) {
      // 既存を更新（重複を作らない）
      const next = [...group.parts];
      const target = next[existingIdx];
      if (target.type !== 'ブラケット') {
        onClose();
        return;
      }
      next[existingIdx] = {
        ...target,
        meta: {
          ...(target.meta ?? {}),
          width: size,
          direction: dirSel,
          ...(bracketSize ? { bracketSize } : {}),
        },
      };
      updateScaffoldGroup(group.id, { parts: next });
      onClose();
      return;
    }

    // 新規追加
    const newBracket: ScaffoldPart = {
      id: uuidv4(),
      type: 'ブラケット' as const,
      position: { x: ax, y: ay },
      color: base.color,
      meta: {
        width: size,
        direction: dirSel,
        offsetMm: Number(base.meta?.offsetMm ?? 0),
        ...(bracketSize ? { bracketSize } : {}),
      },
    } as const;

    updateScaffoldGroup(group.id, { parts: [...group.parts, newBracket] });
    onClose();
  };

  return (
    <div
      style={style}
      className="glass-scope bracket-config-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="ブラケットの設定カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ブラケットの設定</h3>
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
        {/* 方向選択 */}
        <div className="mb-3">
          <div className="mb-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">方向</div>
          <div className="grid grid-cols-4 gap-1.5">
            {DIRECTIONS.map((dir) => (
              <Button
                key={dir.value}
                variant={direction === dir.value ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-[11px] ${
                  direction === dir.value
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200'
                }`}
                onClick={() => setDirection(dir.value)}
                aria-label={`方向を${dir.label}に変更`}
              >
                {dir.icon}
              </Button>
            ))}
          </div>
        </div>

        {/* 寸法選択 */}
        <div>
          <div className="mb-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">寸法 (mm)</div>
          <div className="grid grid-cols-4 gap-1.5">
            {SIZES.map((s) => (
              <Button
                key={s}
                variant={size === s ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-[11px] ${
                  size === s
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200'
                }`}
                onClick={() => setSize(s)}
                aria-label={`寸法を${s}mmに変更`}
              >
                {s}
              </Button>
            ))}
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
            variant="outline"
            size="sm"
            onClick={drawBracket}
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.25)] hover:bg-emerald-50 hover:!text-emerald-700 hover:!border-emerald-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-emerald-900/20"
            aria-label="選択した設定でブラケットを作図"
          >
            作図
          </Button>
          <Button
            size="sm"
            onClick={save}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            変更
          </Button>
        </div>
      </div>
    </div>
  );
}

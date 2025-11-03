/**
 * AntiAddCard.tsx
 * アンチ未接ブラケットをクリックした際に表示する「アンチ追加カード」
 *
 * 提供機能:
 * - 向き（外側/内側）
 * - 幅（W:400mm / S:240mm）
 * - スパン（1800/1500/1200/900/600）
 * - 「作図」でアンチを作図し、ドラッグ&ドロップで微調整可能（アンチ編集モード時）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { X, Plus } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_SCALE, mmToPx, calculateAngleDegrees } from '@/lib/utils/scale';

export interface AntiAddCardProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象グループID */
  groupId: string;
  /** 対象ブラケットID（このブラケット位置を基準にアンチを作図） */
  bracketId: string;
  /** 閉じる */
  onClose: () => void;
  /** 作図完了ハンドラ */
  onCreated?: () => void;
}

/**
 * 向き選択肢
 */
const ORIENTATIONS = [
  { value: 'outer' as const, label: '外側' },
  { value: 'inner' as const, label: '内側' },
];

/**
 * 幅選択肢（mm）
 */
const WIDTHS = [
  { value: 400, label: 'W: 400' },
  { value: 240, label: 'S: 240' },
] as const;

/**
 * スパン選択肢（mm）
 */
const SPANS = [1800, 1500, 1200, 900, 600] as const;

/**
 * アンチ追加カード本体
 */
export default function AntiAddCard({ screenPosition, groupId, bracketId, onClose, onCreated }: AntiAddCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const bracket = React.useMemo(() => group?.parts.find((p) => p.id === bracketId), [group, bracketId]);

  // 初期値はブラケット情報から幅を推測（W/S）
  const initialWidth = React.useMemo(() => {
    const w = Number(bracket?.meta?.width ?? 400);
    if (w >= 380) return 400;
    if (w <= 260) return 240;
    return 400;
  }, [bracket]);

  const [orientation, setOrientation] = React.useState<'outer' | 'inner'>('outer');
  const [width, setWidth] = React.useState<number>(initialWidth);
  const [span, setSpan] = React.useState<number>(1800);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  /**
   * アンチを作図する
   * - 中心は対象ブラケットのオフセット（offsetMm）
   * - 方向はスパン方向（グループライン）
   * - 法線方向は「外側/内側」に基づいて反転
   * - 作図後はカードを閉じる
   */
  const drawAnti = () => {
    if (!group || !bracket) return;
    const line = group.meta?.line;
    if (!line) return;

    // ブラケットの沿い方向オフセット（mm）
    const bOff = Number(bracket.meta?.offsetMm ?? NaN);
    if (!isFinite(bOff)) return;

    // スパン方向角度（度数法）
    const spanAngle = calculateAngleDegrees(line.start, line.end);
    const vSpan = { x: Math.cos((spanAngle * Math.PI) / 180), y: Math.sin((spanAngle * Math.PI) / 180) };

    // ライン情報（px）
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const lenPx = Math.sqrt(dx * dx + dy * dy) || 1;
    const tx = dx / lenPx;
    const ty = dy / lenPx;

    // 外向き法線（左回転）→ Alt/reversed ではない既定の外側
    let nx = -ty;
    let ny = tx;
    // 向きが「内側」の場合は反転
    if (orientation === 'inner') {
      nx = -nx;
      ny = -ny;
    }

    // アンチ中心：ブラケットの沿い方向オフセット（bOff）を中心に、法線へ既定クリアランス分だけオフセット
    // クリアランス: W→150 + 半幅(200) = 350mm, S→50 + 半幅(120) = 170mm
    const antiWidthMm = width;
    const innerClearMm = width >= 380 ? 150 : 50;
    const centerOffsetPx = mmToPx(innerClearMm + antiWidthMm / 2, DEFAULT_SCALE);

    // ライン上の中心座標（px）: 始点からbOff(mm) だけ進める
    const alongPx = mmToPx(bOff, DEFAULT_SCALE);
    const baseX = line.start.x + tx * alongPx;
    const baseY = line.start.y + ty * alongPx;

    const center = { x: baseX + nx * centerOffsetPx, y: baseY + ny * centerOffsetPx };

    // offsetMm は左端基準。中心= bOff とする場合、左端は (bOff - span/2)
    const antiOffsetMm = bOff - span / 2;

    const newPart = {
      id: uuidv4(),
      type: 'アンチ' as const,
      position: center,
      color: bracket.color,
      meta: {
        direction: spanAngle,
        length: span,
        width: antiWidthMm,
        bracketSize: width >= 380 ? 'W' : 'S',
        offsetMm: antiOffsetMm,
      },
    };

    updateScaffoldGroup(group.id, { parts: [...group.parts, newPart] });
    onCreated?.();
  };

  return (
    <div
      style={style}
      className="glass-scope anti-add-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="アンチの追加カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Plus size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">アンチを追加</h3>
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
        {/* 向き */}
        <div className="mb-3">
          <div className="mb-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">向き</div>
          <div className="grid grid-cols-2 gap-1.5">
            {ORIENTATIONS.map((o) => (
              <Button
                key={o.value}
                variant={orientation === o.value ? 'success' : 'outline'}
                size="sm"
                className={`h-8 text-[11px] ${orientation === o.value ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200'}`}
                onClick={() => setOrientation(o.value)}
                aria-label={`向きを${o.label}に変更`}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 幅 */}
        <div className="mb-3">
          <div className="mb-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">幅 (mm)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {WIDTHS.map((w) => (
              <Button
                key={w.value}
                variant={width === w.value ? 'success' : 'outline'}
                size="sm"
                className={`h-8 text-[11px] ${width === w.value ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200'}`}
                onClick={() => setWidth(w.value)}
                aria-label={`幅を${w.value}mmに変更`}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </div>

        {/* スパン */}
        <div>
          <div className="mb-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">スパン (mm)</div>
          <div className="grid grid-cols-5 gap-1.5">
            {SPANS.map((s) => (
              <Button
                key={s}
                variant={span === s ? 'success' : 'outline'}
                size="sm"
                className={`h-8 text-[11px] ${span === s ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200'}`}
                onClick={() => setSpan(s)}
                aria-label={`スパンを${s}mmに変更`}
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
            variant="success"
            size="sm"
            onClick={drawAnti}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            aria-label="選択した設定でアンチを作図"
          >
            作図
          </Button>
        </div>
      </div>
    </div>
  );
}

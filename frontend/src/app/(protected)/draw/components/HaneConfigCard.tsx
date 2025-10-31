/**
 * HaneConfigCard.tsx
 * ハネ編集時に柱クリックで表示する「方向と寸法」選択カード
 *
 * 機能:
 * - 方向の選択（0/90/180/270）
 * - 寸法の選択（900, 600, 355, 300, 150）
 * - 既存の数量表カードと同じガラス調ヘッダーUIに統一
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Wind, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';
import { mmToPx, DEFAULT_SCALE } from '@/lib/utils/scale';

export interface HaneConfigCardProps {
  screenPosition: { left: number; top: number };
  groupId: string;
  partId: string;
  onClose: () => void;
}

const DIRECTIONS = [
  { value: 0, label: '右', icon: '→' },
  { value: 90, label: '下', icon: '↓' },
  { value: 180, label: '左', icon: '←' },
  { value: 270, label: '上', icon: '↑' },
] as const;

const SIZES = [900, 600, 355, 300, 150] as const;

export default function HaneConfigCard({ screenPosition, groupId, partId, onClose }: HaneConfigCardProps) {
  const [direction, setDirection] = React.useState<number>(270); // 初期は上向き
  const [size, setSize] = React.useState<number>(600);

  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const pillar = React.useMemo(() => group?.parts.find((p) => p.id === partId), [group, partId]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const handleDraw = () => {
    if (!group || !pillar) return;
    // 始点=柱位置、選択方向・寸法でライン（布材）と終端の三角柱を追加
    const start = { x: pillar.position.x, y: pillar.position.y };
    const rad = (direction * Math.PI) / 180;
    const v = { x: Math.cos(rad), y: Math.sin(rad) };
    const lenPx = mmToPx(size, DEFAULT_SCALE);
    const end = { x: start.x + v.x * lenPx, y: start.y + v.y * lenPx };

    const addParts: any[] = [];
    // ライン部分は布材で表現（寸法=選択サイズ、方向=選択方向）
    addParts.push({
      id: crypto.randomUUID(),
      type: '布材',
      position: { ...start },
      color: pillar.color,
      meta: { length: size, direction }
    });
    // 終端に三角マーカー（柱）
    addParts.push({
      id: crypto.randomUUID(),
      type: '柱',
      position: { ...end },
      color: pillar.color,
      marker: 'triangle',
      meta: { markerDirection: direction }
    });

    updateScaffoldGroup(group.id, { parts: [...group.parts, ...addParts] });
    onClose();
  };

  return (
    <div
      style={style}
      className="glass-scope hane-config-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="ハネの設定カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Wind size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ハネの設定</h3>
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
          <div className="grid grid-cols-5 gap-1.5">
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
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(14,165,233,0.25)] hover:bg-sky-50 hover:!text-sky-700 hover:!border-sky-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-[#06B6D4]/20"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleDraw}
            className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#3B82F6] !text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.55)] hover:from-[#4F46E5] hover:via-[#0EA5E9] hover:to-[#2563EB] dark:bg-[#7C3AED] dark:hover:bg-[#8B5CF6]"
          >
            作図
          </Button>
        </div>
      </div>
    </div>
  );
}

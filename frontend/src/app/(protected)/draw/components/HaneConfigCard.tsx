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

export type HaneConfigCardProps =
  | {
      /** 単体編集 */
      kind?: 'single';
      screenPosition: { left: number; top: number };
      groupId: string;
      partId: string;
      onClose: () => void;
    }
  | {
      /** 一括編集（選択された柱を対象） */
      kind: 'bulk';
      screenPosition: { left: number; top: number };
      onClose: () => void;
    };

const DIRECTIONS = [
  { value: 0, label: '右', icon: '→' },
  { value: 90, label: '下', icon: '↓' },
  { value: 180, label: '左', icon: '←' },
  { value: 270, label: '上', icon: '↑' },
] as const;

const SIZES = [900, 600, 355, 300, 150] as const;

export default function HaneConfigCard(props: HaneConfigCardProps) {
  const [direction, setDirection] = React.useState<number>(270); // 初期は上向き
  const [size, setSize] = React.useState<number>(600);

  const { scaffoldGroups, updateScaffoldGroup, selectedScaffoldPartKeys, clearScaffoldSelection } = useDrawingStore();
  const kind: 'single' | 'bulk' = props.kind ?? 'single';
  const group = kind === 'single' ? React.useMemo(() => scaffoldGroups.find((g) => g.id === (props as any).groupId), [scaffoldGroups, (props as any).groupId]) : undefined;
  const pillar = kind === 'single' ? React.useMemo(() => group?.parts.find((p) => p.id === (props as any).partId), [group, (props as any).partId]) : undefined;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${props.screenPosition.left}px`,
    top: `${props.screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const handleDraw = () => {
    if (kind === 'single') {
      const { groupId, onClose } = props as any;
      if (!group || !pillar) return;
      const start = { x: pillar.position.x, y: pillar.position.y };
      const rad = (direction * Math.PI) / 180;
      const v = { x: Math.cos(rad), y: Math.sin(rad) };
      const lenPx = mmToPx(size, DEFAULT_SCALE);
      const end = { x: start.x + v.x * lenPx, y: start.y + v.y * lenPx };
      const addParts: any[] = [];
      addParts.push({ id: crypto.randomUUID(), type: '布材', position: { ...start }, color: pillar.color, meta: { length: size, direction } });
      addParts.push({ id: crypto.randomUUID(), type: '柱', position: { ...end }, color: pillar.color, marker: 'triangle', meta: { markerDirection: direction } });
      updateScaffoldGroup(groupId, { parts: [...group.parts, ...addParts] });
      (props as any).onClose();
      return;
    }
    // bulk: 選択中の柱すべてに対して作図
    const pillars = selectedScaffoldPartKeys
      .map((key) => {
        const [gid, pid] = key.split(':');
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        return g && p && p.type === '柱' ? { group: g, pillar: p } : null;
      })
      .filter((x): x is { group: any; pillar: any } => Boolean(x));
    if (pillars.length === 0) return;
    const rad = (direction * Math.PI) / 180;
    const v = { x: Math.cos(rad), y: Math.sin(rad) };
    const lenPx = mmToPx(size, DEFAULT_SCALE);
    // グループごとにまとめて更新
    const grouped: Record<string, { group: any; items: any[] }> = {};
    for (const it of pillars) {
      const gid = it.group.id as string;
      if (!grouped[gid]) grouped[gid] = { group: it.group, items: [] };
      grouped[gid].items.push(it);
    }
    for (const gid of Object.keys(grouped)) {
      const { group, items } = grouped[gid];
      let parts = [...group.parts];
      for (const it of items) {
        const start = { x: it.pillar.position.x, y: it.pillar.position.y };
        const end = { x: start.x + v.x * lenPx, y: start.y + v.y * lenPx };
        parts = [
          ...parts,
          { id: crypto.randomUUID(), type: '布材', position: { ...start }, color: it.pillar.color, meta: { length: size, direction } },
          { id: crypto.randomUUID(), type: '柱', position: { ...end }, color: it.pillar.color, marker: 'triangle', meta: { markerDirection: direction } },
        ];
      }
      updateScaffoldGroup(gid, { parts });
    }
    clearScaffoldSelection();
    props.onClose();
  };

  // Enterで作図、Escで閉じる
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        handleDraw();
      } else if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        props.onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDraw, props]);

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
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{kind === 'bulk' ? 'ハネの一括設定' : 'ハネの設定'}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={props.onClose}
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
            onClick={props.onClose}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
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

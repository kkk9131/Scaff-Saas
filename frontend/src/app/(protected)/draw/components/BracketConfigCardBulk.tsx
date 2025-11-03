/**
 * BracketConfigCardBulk.tsx
 * ブラケットの方向と寸法選択カード（複数選択・一括適用）
 *
 * 使い方（ユーザー目線）:
 * - 編集モード「ブラケット」＋選択モードで、青色発光中の柱を複数クリックして選択
 * - Enterキー、または一括メニュー>数量から本カードを開く
 * - 方向と寸法を選び「作図」で選択箇所すべてに同設定のブラケットを作図
 *   （同一点・同方向に既存ブラケットがあれば新規作成せず上書き）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Navigation, X, Check, Users } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';
import { roundToCardinalDirection } from '@/lib/sax/directionRules';
import { v4 as uuidv4 } from 'uuid';

export interface BracketConfigCardBulkProps {
  /** 左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
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
 * ブラケットの方向と寸法選択カード（複数選択）
 * 選択中の柱（青色発光）に対して一括でブラケットを作図/更新する
 */
export default function BracketConfigCardBulk({ screenPosition, onClose }: BracketConfigCardBulkProps) {
  const {
    scaffoldGroups,
    updateScaffoldGroup,
    selectedScaffoldPartKeys,
    clearScaffoldSelection,
  } = useDrawingStore();

  // 選択中の柱のみを対象に抽出
  const selectedPillars = React.useMemo(
    () =>
      selectedScaffoldPartKeys
        .map((key) => {
          const [gid, pid] = key.split(':');
          const g = scaffoldGroups.find((gg) => gg.id === gid);
          const p = g?.parts.find((pp) => pp.id === pid);
          return g && p && p.type === '柱' ? { group: g, pillar: p } : null;
        })
        .filter((x): x is { group: any; pillar: any } => Boolean(x)),
    [selectedScaffoldPartKeys, scaffoldGroups]
  );

  // 初期値: 先頭の柱位置に既存ブラケットがあればそれを採用
  const initial = React.useMemo(() => {
    if (selectedPillars.length === 0) return { direction: 0, size: 600 };
    const { group, pillar } = selectedPillars[0];
    const related = group.parts.find(
      (pp: any) =>
        pp.type === 'ブラケット' &&
        Math.abs(pp.position.x - pillar.position.x) < 1 &&
        Math.abs(pp.position.y - pillar.position.y) < 1
    );
    const dir = Number(related?.meta?.direction ?? 0);
    const width = Number(related?.meta?.width ?? 600);
    return {
      direction: isNaN(dir) ? 0 : dir,
      size: isNaN(width) ? 600 : width,
    };
  }, [selectedPillars]);

  const [direction, setDirection] = React.useState<number>(initial.direction);
  const [size, setSize] = React.useState<number>(initial.size);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 380,
  };

  /**
   * 共通: 同一点（1px以内）判定
   */
  const samePoint = (ax: number, ay: number, bx: number, by: number) => Math.abs(ax - bx) < 1 && Math.abs(ay - by) < 1;

  /**
   * 作図（新規 or 更新）: 選択した方向・寸法で一括作図
   * - 同一点・同方向に既存があれば更新、なければ新規追加
   */
  const drawBulk = () => {
    if (selectedPillars.length === 0) return;
    const dirSel = roundToCardinalDirection(direction);
    const bracketSize = size === 600 ? 'W' : size === 355 ? 'S' : undefined;

    // グループごとにまとめて更新
    const grouped: Record<string, { group: any; pillars: any[] }> = {};
    for (const item of selectedPillars) {
      const gid = item.group.id as string;
      if (!grouped[gid]) grouped[gid] = { group: item.group, pillars: [] };
      grouped[gid].pillars.push(item.pillar);
    }

    for (const gid of Object.keys(grouped)) {
      const { group, pillars } = grouped[gid];
      let nextParts = [...group.parts];
      for (const pillar of pillars) {
        const ax = pillar.position.x;
        const ay = pillar.position.y;
        const existingIdx = nextParts.findIndex(
          (pp: any) =>
            pp.type === 'ブラケット' &&
            samePoint(pp.position.x, pp.position.y, ax, ay) &&
            roundToCardinalDirection(Number(pp.meta?.direction ?? 0)) === dirSel
        );
        if (existingIdx >= 0) {
          // 既存を更新
          const target = nextParts[existingIdx];
          nextParts[existingIdx] = {
            ...target,
            meta: {
              ...(target.meta || {}),
              width: size,
              direction: dirSel,
              ...(bracketSize ? { bracketSize } : {}),
            },
          } as any;
        } else {
          // 新規追加
          const newBracket = {
            id: uuidv4(),
            type: 'ブラケット' as const,
            position: { x: ax, y: ay },
            color: pillar.color,
            meta: {
              width: size,
              direction: dirSel,
              offsetMm: Number(pillar.meta?.offsetMm ?? 0),
              ...(bracketSize ? { bracketSize } : {}),
            },
          } as const;
          nextParts = [...nextParts, newBracket];
        }
      }
      updateScaffoldGroup(gid, { parts: nextParts });
    }

    clearScaffoldSelection();
    onClose();
  };

  /**
   * 変更（更新のみ）: 同一点・同方向の既存ブラケットがある場合のみ更新（新規追加はしない）
   */
  const saveBulk = () => {
    if (selectedPillars.length === 0) return;
    const dirSel = roundToCardinalDirection(direction);
    const bracketSize = size === 600 ? 'W' : size === 355 ? 'S' : undefined;

    const grouped: Record<string, { group: any; pillars: any[] }> = {};
    for (const item of selectedPillars) {
      const gid = item.group.id as string;
      if (!grouped[gid]) grouped[gid] = { group: item.group, pillars: [] };
      grouped[gid].pillars.push(item.pillar);
    }
    for (const gid of Object.keys(grouped)) {
      const { group, pillars } = grouped[gid];
      let changed = false;
      const nextParts = group.parts.map((pp: any) => {
        if (pp.type !== 'ブラケット') return pp;
        const hit = pillars.some((pillar) => samePoint(pp.position.x, pp.position.y, pillar.position.x, pillar.position.y));
        if (!hit) return pp;
        if (roundToCardinalDirection(Number(pp.meta?.direction ?? 0)) !== dirSel) return pp;
        changed = true;
        return {
          ...pp,
          meta: {
            ...(pp.meta || {}),
            width: size,
            direction: dirSel,
            ...(bracketSize ? { bracketSize } : {}),
          },
        } as any;
      });
      if (changed) updateScaffoldGroup(gid, { parts: nextParts });
    }

    clearScaffoldSelection();
    onClose();
  };

  // Enterで作図、Escで閉じる
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        drawBulk();
      } else if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawBulk, onClose]);

  const count = selectedPillars.length;

  return (
    <div
      style={style}
      className="glass-scope bracket-config-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="ブラケットの一括設定カード"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ブラケットの一括設定</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Users size={14} className="text-sky-400" />
          <span>対象 {count} 箇所</span>
          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
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
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
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
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
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
            onClick={saveBulk}
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.25)] hover:bg-emerald-50 hover:!text-emerald-700 hover:!border-emerald-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-emerald-900/20"
            aria-label="選択した設定で既存ブラケットを更新"
          >
            変更
          </Button>
          <Button
            size="sm"
            onClick={drawBulk}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            作図
          </Button>
        </div>
      </div>
    </div>
  );
}


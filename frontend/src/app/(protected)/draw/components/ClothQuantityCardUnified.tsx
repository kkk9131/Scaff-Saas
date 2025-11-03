/**
 * ClothQuantityCardUnified.tsx
 * 布材の数量調整カード（単体/一括対応）
 *
 * - kind='single': 既存の ClothQuantityCard と同等（数量・ツボ）
 * - kind='bulk': 選択対象または全布材へ数量/ツボを 上書き/加算 で適用
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, Layers, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export type ClothQuantityCardUnifiedProps =
  | {
      kind: 'single';
      screenPosition: { left: number; top: number };
      groupId: string;
      partId: string;
      onClose: () => void;
    }
  | {
      kind: 'bulk';
      screenPosition: { left: number; top: number };
      scope: 'selected' | 'all';
      onClose: () => void;
    };

export default function ClothQuantityCardUnified(props: ClothQuantityCardUnifiedProps) {
  const { scaffoldGroups, updateScaffoldGroup, selectedScaffoldPartKeys, clearScaffoldSelection } = useDrawingStore();

  const isBulk = props.kind === 'bulk';
  const headerTitle = isBulk ? '布材の一括数量調整' : '布材の数量調整';

  // 初期値（単体時のみ）
  const initial = React.useMemo(() => {
    if (props.kind === 'single') {
      const g = scaffoldGroups.find((gg) => gg.id === props.groupId);
      const p = g?.parts.find((pp) => pp.id === props.partId);
      return {
        qty: Number(p?.meta?.quantity ?? 0),
        tsubo: Number(p?.meta?.tsubo ?? 0),
        lengthMm: Number(p?.meta?.length ?? 0),
      };
    }
    return { qty: 0, tsubo: 0, lengthMm: 0 };
  }, [props, scaffoldGroups]);

  const [qty, setQty] = React.useState<number>(isNaN(initial.qty) ? 0 : initial.qty);
  const [tsubo, setTsubo] = React.useState<number>(isNaN(initial.tsubo) ? 0 : initial.tsubo);
  const [mode, setMode] = React.useState<'replace' | 'add'>('replace');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${props.screenPosition.left}px`,
    top: `${props.screenPosition.top}px`,
    zIndex: 40,
    width: 380,
  };

  const selectedCount = selectedScaffoldPartKeys.filter((k) => {
    const [gid, pid] = k.split(':');
    const g = scaffoldGroups.find((gg) => gg.id === gid);
    const p = g?.parts.find((pp) => pp.id === pid);
    return p?.type === '布材';
  }).length;

  const handleSave = () => {
    if (props.kind === 'single') {
      const g = scaffoldGroups.find((gg) => gg.id === (props as any).groupId);
      if (!g) return;
      const pid = (props as any).partId as string;
      const nextParts = g.parts.map((p) =>
        p.id === pid
          ? ({
              ...p,
              meta: {
                ...(p.meta || {}),
                quantity: Math.max(0, qty),
                tsubo: Math.max(0, tsubo),
                quantityConfirmed: true,
              },
            } as any)
          : p
      );
      updateScaffoldGroup(g.id, { parts: nextParts });
      props.onClose();
      return;
    }

    // bulk
    const applyToPart = (p: any) => {
      if (p.type !== '布材') return p;
      const baseQty = Number(p.meta?.quantity ?? 0);
      const baseTsubo = Number(p.meta?.tsubo ?? 0);
      const nextQty = mode === 'add' ? Math.max(0, baseQty + Math.max(0, qty)) : Math.max(0, qty);
      const nextTsubo = mode === 'add' ? Math.max(0, baseTsubo + Math.max(0, tsubo)) : Math.max(0, tsubo);
      return {
        ...p,
        meta: {
          ...(p.meta || {}),
          quantity: isNaN(qty) ? baseQty : nextQty,
          tsubo: isNaN(tsubo) ? baseTsubo : nextTsubo,
          quantityConfirmed: true,
        },
      };
    };

    if (props.scope === 'selected') {
      // グループ別にまとめて更新
      const grouped: Record<string, string[]> = {};
      for (const key of selectedScaffoldPartKeys) {
        const [gid, pid] = key.split(':');
        if (!grouped[gid]) grouped[gid] = [];
        grouped[gid].push(pid);
      }
      for (const gid of Object.keys(grouped)) {
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        if (!g) continue;
        const target = new Set(grouped[gid]);
        const nextParts = g.parts.map((p) => (target.has(p.id) ? applyToPart(p) : p));
        updateScaffoldGroup(gid, { parts: nextParts });
      }
      clearScaffoldSelection();
      props.onClose();
      return;
    }

    // scope === 'all'
    for (const g of scaffoldGroups) {
      const nextParts = g.parts.map((p) => applyToPart(p));
      updateScaffoldGroup(g.id, { parts: nextParts });
    }
    clearScaffoldSelection();
    props.onClose();
  };

  // Enterキーで保存
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  return (
    <div
      style={style}
      className="glass-scope cloth-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label={isBulk ? '布材の一括数量調整カード' : '布材の数量調整カード'}
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          {isBulk ? (
            <Layers size={18} className="text-cyan-400" />
          ) : (
            <Table size={18} className="text-cyan-400" />
          )}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{headerTitle}</h3>
          {isBulk && (
            <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
              {props.kind === 'bulk' && props.scope === 'all' ? '対象 全布材' : `対象 ${selectedCount} 箇所`}
            </span>
          )}
          {props.kind === 'single' && initial.lengthMm > 0 && (
            <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
              {`${initial.lengthMm}mm`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isBulk && (
            <button
              onClick={() => {
                clearScaffoldSelection();
                props.onClose();
              }}
              className="flex h-8 items-center justify-center rounded-lg px-2 text-[11px] text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
              title="選択解除"
              aria-label="選択解除"
            >
              選択解除
            </button>
          )}
          <button
            onClick={props.onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
            title="閉じる"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="relative p-3">
        {isBulk && (
          <div className="mb-2 flex items-center gap-2">
            <button
              className={`h-7 rounded-md px-2 text-[11px] border ${
                mode === 'replace'
                  ? 'border-cyan-400 text-cyan-600 bg-cyan-50/50 dark:bg-cyan-500/10'
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200 border-white/40 dark:border-slate-700/50'
              }`}
              onClick={() => setMode('replace')}
              aria-label="上書きモード"
            >
              上書き
            </button>
            <button
              className={`h-7 rounded-md px-2 text-[11px] border ${
                mode === 'add'
                  ? 'border-cyan-400 text-cyan-600 bg-cyan-50/50 dark:bg-cyan-500/10'
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-200 border-white/40 dark:border-slate-700/50'
              }`}
              onClick={() => setMode('add')}
              aria-label="加算モード"
            >
              加算
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* 数量 */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">数量</div>
            <div className="flex items-center gap-0.5">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="数量を1減らす" onClick={() => setQty((v) => Math.max(0, v - 1))}>
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
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="数量を1増やす" onClick={() => setQty((v) => v + 1)}>
                <Plus size={12} />
              </Button>
            </div>
          </div>

          {/* ツボ（将来拡張） */}
          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">ツボ（将来拡張）</div>
            <div className="flex items-center gap-0.5">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="ツボを1減らす" onClick={() => setTsubo((v) => Math.max(0, v - 1))}>
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
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="ツボを1増やす" onClick={() => setTsubo((v) => v + 1)}>
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
            onClick={props.onClose}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}


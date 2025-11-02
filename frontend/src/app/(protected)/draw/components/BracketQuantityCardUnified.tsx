/**
 * BracketQuantityCardUnified.tsx
 * ブラケットの数量調整カード（単体/一括対応）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, Layers, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export type BracketQuantityCardUnifiedProps =
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

export default function BracketQuantityCardUnified(props: BracketQuantityCardUnifiedProps) {
  const { scaffoldGroups, updateScaffoldGroup, selectedScaffoldPartKeys, clearScaffoldSelection } = useDrawingStore();
  const isBulk = props.kind === 'bulk';
  const headerTitle = isBulk ? 'ブラケットの一括数量調整' : 'ブラケットの数量調整';

  const initial = React.useMemo(() => {
    if (props.kind === 'single') {
      const g = scaffoldGroups.find((gg) => gg.id === props.groupId);
      const p = g?.parts.find((pp) => pp.id === props.partId);
      return {
        qty: Number(p?.meta?.quantity ?? 0),
        bracketSize: p?.meta?.bracketSize ?? '-',
      };
    }
    return { qty: 0, bracketSize: '-' };
  }, [props, scaffoldGroups]);

  const [qty, setQty] = React.useState<number>(isNaN(initial.qty) ? 0 : initial.qty);
  const [mode, setMode] = React.useState<'replace' | 'add'>('replace');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${props.screenPosition.left}px`,
    top: `${props.screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const selectedCount = selectedScaffoldPartKeys.filter((k) => {
    const [gid, pid] = k.split(':');
    const g = scaffoldGroups.find((gg) => gg.id === gid);
    const p = g?.parts.find((pp) => pp.id === pid);
    return p?.type === 'ブラケット';
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
              meta: { ...(p.meta || {}), quantity: Math.max(0, qty), quantityConfirmed: true },
            } as any)
          : p
      );
      updateScaffoldGroup(g.id, { parts: nextParts });
      props.onClose();
      return;
    }

    const applyTo = (p: any) => {
      if (p.type !== 'ブラケット') return p;
      const base = Number(p.meta?.quantity ?? 0);
      const next = mode === 'add' ? Math.max(0, base + Math.max(0, qty)) : Math.max(0, qty);
      return { ...p, meta: { ...(p.meta || {}), quantity: isNaN(qty) ? base : next, quantityConfirmed: true } };
    };

    if (props.scope === 'selected') {
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
        const nextParts = g.parts.map((p) => (target.has(p.id) ? applyTo(p) : p));
        updateScaffoldGroup(gid, { parts: nextParts });
      }
      clearScaffoldSelection();
      props.onClose();
      return;
    }

    // all
    for (const g of scaffoldGroups) {
      const nextParts = g.parts.map((p) => applyTo(p));
      updateScaffoldGroup(g.id, { parts: nextParts });
    }
    clearScaffoldSelection();
    props.onClose();
  };

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
      className="glass-scope bracket-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label={isBulk ? 'ブラケットの一括数量調整カード' : 'ブラケットの数量調整カード'}
    >
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          {isBulk ? <Layers size={18} className="text-cyan-400" /> : <Table size={18} className="text-cyan-400" />}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{headerTitle}</h3>
          {isBulk ? (
            <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
              {props.scope === 'all' ? '対象 全ブラケット' : `対象 ${selectedCount} 箇所`}
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
              {String(initial.bracketSize)}
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
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

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

        <div className="grid grid-cols-1 gap-2">
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
        </div>

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
            className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#3B82F6] !text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.55)] hover:from-[#4F46E5] hover:via-[#0EA5E9] hover:to-[#2563EB] dark:bg-[#7C3AED] dark:hover:bg-[#8B5CF6]"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}


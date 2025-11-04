/**
 * BracketQuantityCardUnified.tsx
 * ブラケットの数量調整カード（単体/一括対応）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, Layers, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';
import type { ScaffoldPart } from '@/types/scaffold';

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
  const { kind, onClose, screenPosition } = props;
  const isBulk = kind === 'bulk';
  const headerTitle = isBulk ? 'ブラケットの一括数量調整' : 'ブラケットの数量調整';

  const singleGroupId = kind === 'single' ? props.groupId : null;
  const singlePartId = kind === 'single' ? props.partId : null;
  const bulkScope = kind === 'bulk' ? props.scope : null;

  const initial = React.useMemo(() => {
    if (singleGroupId && singlePartId) {
      const group = scaffoldGroups.find((gg) => gg.id === singleGroupId);
      const part = group?.parts.find((candidate) => candidate.id === singlePartId);
      const target = part && part.type === 'ブラケット' ? part : null;
      return {
        qty: Number(target?.meta?.quantity ?? 0),
        bracketSize: target?.meta?.bracketSize ?? '-',
      };
    }
    return { qty: 0, bracketSize: '-' };
  }, [scaffoldGroups, singleGroupId, singlePartId]);

  const [qty, setQty] = React.useState<number>(isNaN(initial.qty) ? 0 : initial.qty);
  const [mode, setMode] = React.useState<'replace' | 'add'>('replace');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  const selectedCount = selectedScaffoldPartKeys.filter((k) => {
    const [gid, pid] = k.split(':');
    const g = scaffoldGroups.find((gg) => gg.id === gid);
    const p = g?.parts.find((pp) => pp.id === pid);
    return p?.type === 'ブラケット';
  }).length;

  const applySingle = React.useCallback(() => {
    if (!singleGroupId || !singlePartId) return;
    const group = scaffoldGroups.find((gg) => gg.id === singleGroupId);
    if (!group) return;
    const nextParts = group.parts.map((part) => {
      if (part.id !== singlePartId || part.type !== 'ブラケット') return part;
      return {
        ...part,
        meta: {
          ...(part.meta ?? {}),
          quantity: Math.max(0, qty),
          quantityConfirmed: true,
        },
      };
    });
    updateScaffoldGroup(group.id, { parts: nextParts });
    onClose();
  }, [singleGroupId, singlePartId, scaffoldGroups, qty, updateScaffoldGroup, onClose]);

  const applyBulk = React.useCallback(() => {
    if (kind !== 'bulk' || !bulkScope) return;
    const applyTo = (part: ScaffoldPart): ScaffoldPart => {
      if (part.type !== 'ブラケット') return part;
      const base = Number(part.meta?.quantity ?? 0);
      const next = mode === 'add' ? Math.max(0, base + Math.max(0, qty)) : Math.max(0, qty);
      const quantityValue = Number.isNaN(qty) ? base : next;
      return {
        ...part,
        meta: {
          ...(part.meta ?? {}),
          quantity: quantityValue,
          quantityConfirmed: true,
        },
      };
    };

    if (bulkScope === 'selected') {
      const grouped = selectedScaffoldPartKeys.reduce<Record<string, Set<string>>>((acc, key) => {
        const [gid, pid] = key.split(':');
        if (!acc[gid]) acc[gid] = new Set();
        acc[gid]!.add(pid);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([gid, ids]) => {
        const group = scaffoldGroups.find((candidate) => candidate.id === gid);
        if (!group) return;
        const nextParts = group.parts.map((part) => (ids.has(part.id) ? applyTo(part) : part));
        updateScaffoldGroup(gid, { parts: nextParts });
      });
      clearScaffoldSelection();
      onClose();
      return;
    }

    scaffoldGroups.forEach((group) => {
      const nextParts = group.parts.map((part) => applyTo(part));
      updateScaffoldGroup(group.id, { parts: nextParts });
    });
    clearScaffoldSelection();
    onClose();
  }, [
    bulkScope,
    clearScaffoldSelection,
    mode,
    kind,
    onClose,
    scaffoldGroups,
    selectedScaffoldPartKeys,
    qty,
    updateScaffoldGroup,
  ]);

  const handleSave = React.useCallback(() => {
    if (kind === 'single') {
      applySingle();
    } else {
      applyBulk();
    }
  }, [applyBulk, applySingle, kind]);

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
      className="glass-scope bracket-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label={isBulk ? 'ブラケットの一括数量調整カード' : 'ブラケットの数量調整カード'}
    >
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          {isBulk ? <Layers size={18} className="text-cyan-400" /> : <Table size={18} className="text-cyan-400" />}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{headerTitle}</h3>
          {isBulk ? (
            <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
              {bulkScope === 'all' ? '対象 全ブラケット' : `対象 ${selectedCount} 箇所`}
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
                onClose();
              }}
              className="flex h-8 items-center justify-center rounded-lg px-2 text-[11px] text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
              title="選択解除"
              aria-label="選択解除"
            >
              選択解除
            </button>
          )}
          <button
            onClick={onClose}
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
            onClick={onClose}
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

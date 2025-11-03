/**
 * AntiLevelCardUnified.tsx
 * アンチの段数調整カード（単体/一括対応）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Layers, X } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawingStore';

export type AntiLevelCardUnifiedProps =
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

export default function AntiLevelCardUnified(props: AntiLevelCardUnifiedProps) {
  const { scaffoldGroups, updateScaffoldGroup, selectedScaffoldPartKeys, clearScaffoldSelection } = useDrawingStore();
  const isBulk = props.kind === 'bulk';
  const headerTitle = isBulk ? 'アンチの一括段数調整' : 'アンチの段数調整';

  const initial = React.useMemo(() => {
    if (props.kind === 'single') {
      const g = scaffoldGroups.find((gg) => gg.id === props.groupId);
      const p = g?.parts.find((pp) => pp.id === props.partId);
      return {
        levels: Math.max(1, Number(p?.meta?.levels ?? 1)),
        length: Number(p?.meta?.length ?? 0),
      };
    }
    return { levels: 1, length: 0 };
  }, [props, scaffoldGroups]);

  const [level, setLevel] = React.useState<number>(isNaN(initial.levels) || initial.levels < 1 ? 1 : initial.levels);

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
    return p?.type === 'アンチ';
  }).length;

  const applySingle = () => {
    const g = scaffoldGroups.find((gg) => gg.id === (props as any).groupId);
    if (!g) return;
    const pid = (props as any).partId as string;
    const next = g.parts.map((p) =>
      p.id === pid ? ({ ...p, meta: { ...(p.meta || {}), levels: Math.max(1, level) } } as any) : p
    );
    updateScaffoldGroup(g.id, { parts: next });
    props.onClose();
  };

  const applyBulk = () => {
    const applyTo = (p: any) => {
      if (p.type !== 'アンチ') return p;
      return { ...p, meta: { ...(p.meta || {}), levels: Math.max(1, level) } };
    };

    if ((props as any).scope === 'selected') {
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

  const handleSave = () => {
    if (props.kind === 'single') applySingle(); else applyBulk();
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
      className="glass-scope anti-level-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label={isBulk ? 'アンチの一括段数調整カード' : 'アンチの段数調整カード'}
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{headerTitle}</h3>
          {isBulk ? (
            <span className="ml-1 inline-flex items-center rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-300">
              {(props as any).scope === 'all' ? '対象 全アンチ' : `対象 ${selectedCount} 箇所`}
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-300">
              {initial.length > 0 ? `${initial.length}mm` : '-'}
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

      {/* コンテンツ */}
      <div className="relative p-3">
        <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">段数</div>
          <div className="flex items-center gap-0.5 justify-center">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="段数を1減らす" onClick={() => setLevel((v) => Math.max(1, v - 1))}>
              <Minus size={12} />
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-7 w-16 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              value={String(level)}
              onChange={(e) => setLevel(Math.max(1, Number(e.target.value || 1)))}
              aria-label="段数"
            />
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 flex-shrink-0" aria-label="段数を1増やす" onClick={() => setLevel((v) => v + 1)}>
              <Plus size={12} />
            </Button>
          </div>
        </div>

        {/* 操作 */}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={props.onClose} className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20">
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}


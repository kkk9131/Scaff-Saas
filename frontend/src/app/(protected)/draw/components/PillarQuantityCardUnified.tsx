/**
 * PillarQuantityCardUnified.tsx
 * 単体/一括（選択・全体）に対応する統合版「柱の数量調整カード」
 *
 * 目的:
 * - これまで分かれていた PillarQuantityCard（単体） と BulkPillarQuantityCard（一括） を統合し、
 *   1つのカードで単体/複数/全体の数量更新を行えるようにする。
 *
 * 機能:
 * - 柱タイプ別（A/C/D/E/G/DG/EG/C-47/KD）の数量入力
 * - 一括時は「上書き/加算」モード切替に対応
 * - Enterキーで保存
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Layers, Minus, Plus, Table, X } from 'lucide-react';
import type { PillarType, ScaffoldPart } from '@/types/scaffold';
import { useDrawingStore } from '@/stores/drawingStore';

const PILLAR_TYPES: PillarType[] = ['A', 'C', 'D', 'E', 'G', 'DG', 'EG', 'C-47', 'KD'];

/**
 * プロパティ型定義（単体 or 一括）
 */
export type PillarQuantityCardUnifiedProps =
  | {
      /** 単体編集 */
      kind: 'single';
      /** カード左上のスクリーン座標（px） */
      screenPosition: { left: number; top: number };
      /** 対象のグループID */
      groupId: string;
      /** 対象の部材（柱）ID */
      partId: string;
      /** 閉じるハンドラ */
      onClose: () => void;
    }
  | {
      /** 一括編集 */
      kind: 'bulk';
      /** カード左上のスクリーン座標（px） */
      screenPosition: { left: number; top: number };
      /** スコープ: 選択済み or 全柱 */
      scope: 'selected' | 'all';
      /** 閉じるハンドラ */
      onClose: () => void;
    };

/**
 * 柱の数量調整カード（統合版）
 */
export default function PillarQuantityCardUnified(props: PillarQuantityCardUnifiedProps) {
  const {
    scaffoldGroups,
    updateScaffoldGroup,
    selectedScaffoldPartKeys,
    clearScaffoldSelection,
  } = useDrawingStore();

  const isSingle = props.kind !== 'bulk';
  const singleGroupId = isSingle ? props.groupId : undefined;
  const singlePartId = isSingle ? props.partId : undefined;
  const scope = !isSingle ? props.scope : undefined;
  const onClose = props.onClose;

  // 初期値（単体時は当該パーツから、 一括時は空）
  const initialCounts: Partial<Record<PillarType, number>> = React.useMemo(() => {
    if (!isSingle || !singleGroupId || !singlePartId) {
      return {};
    }
    const group = scaffoldGroups.find((candidate) => candidate.id === singleGroupId);
    const part = group?.parts.find((candidate) => candidate.id === singlePartId);
    if (!part) return {};
    const base: Partial<Record<PillarType, number>> = { ...(part.meta?.pillarCounts ?? {}) };
    // 旧フィールド（単一）しかない場合はそれを初期値へ反映
    const legacyType = part.meta?.pillarType as PillarType | undefined;
    const legacyQty = part.meta?.quantity;
    if (legacyType && (base[legacyType] ?? 0) === 0 && (legacyQty ?? 0) > 0) {
      base[legacyType] = legacyQty;
    }
    return base;
  }, [isSingle, singleGroupId, singlePartId, scaffoldGroups]);

  // 入力状態（複数種別の本数）
  const [counts, setCounts] = React.useState<Partial<Record<PillarType, number>>>(initialCounts);

  React.useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts]);

  // 一括時の適用モード
  const [mode, setMode] = React.useState<'replace' | 'add'>('replace');

  const mergePillarMeta = React.useCallback(
    (meta: ScaffoldPart['meta'] | undefined, latestCounts: Partial<Record<PillarType, number>>): ScaffoldPart['meta'] => {
      const mutableBase = { ...(meta ?? {}) } as Record<string, unknown>;
      delete mutableBase.pillarType;
      delete mutableBase.quantity;
      return {
        ...(mutableBase as ScaffoldPart['meta']),
        pillarCounts: latestCounts,
        quantityConfirmed: true,
      };
    },
    []
  );

  // 保存処理
  const handleSave = React.useCallback(() => {
    // 正規化（0や未指定は除外）
    const normalized = PILLAR_TYPES.reduce<Partial<Record<PillarType, number>>>((acc, type) => {
      const value = Number(counts[type] ?? 0);
      if (!Number.isNaN(value) && value > 0) {
        acc[type] = value;
      }
      return acc;
    }, {});

    if (isSingle) {
      if (!singleGroupId || !singlePartId) return;
      const group = scaffoldGroups.find((candidate) => candidate.id === singleGroupId);
      if (!group) return;
      const nextParts = group.parts.map((part) => {
        if (!(part.type === '柱' && part.id === singlePartId)) return part;
        const nextMeta = mergePillarMeta(part.meta, normalized);
        return { ...part, meta: nextMeta };
      });
      updateScaffoldGroup(group.id, { parts: nextParts });
      onClose();
      return;
    }

    if (scope === 'selected') {
      const grouped = selectedScaffoldPartKeys.reduce<Record<string, Set<string>>>((acc, key) => {
        const [gid, pid] = key.split(':');
        if (!acc[gid]) {
          acc[gid] = new Set<string>();
        }
        acc[gid].add(pid);
        return acc;
      }, {});
      Object.entries(grouped).forEach(([gid, targetIds]) => {
        const group = scaffoldGroups.find((candidate) => candidate.id === gid);
        if (!group) return;
        const nextParts = group.parts.map((part) => {
          if (!(part.type === '柱' && targetIds.has(part.id))) return part;
          const baseCounts = part.meta?.pillarCounts ?? {};
          const mergedCounts: Partial<Record<PillarType, number>> = mode === 'replace' ? {} : { ...baseCounts };
          PILLAR_TYPES.forEach((type) => {
            const addValue = Number(normalized[type] ?? 0);
            if (addValue <= 0) return;
            if (mode === 'add') {
              mergedCounts[type] = Math.max(0, Number(mergedCounts[type] ?? 0) + addValue);
            } else {
              mergedCounts[type] = addValue;
            }
          });
          const nextMeta = mergePillarMeta(part.meta, mergedCounts);
          return { ...part, meta: nextMeta };
        });
        updateScaffoldGroup(gid, { parts: nextParts });
      });
      clearScaffoldSelection();
      onClose();
      return;
    }

    scaffoldGroups.forEach((group) => {
      const nextParts = group.parts.map((part) => {
        if (part.type !== '柱') return part;
        const baseCounts = part.meta?.pillarCounts ?? {};
        const mergedCounts: Partial<Record<PillarType, number>> = mode === 'replace' ? {} : { ...baseCounts };
        PILLAR_TYPES.forEach((type) => {
          const addValue = Number(normalized[type] ?? 0);
          if (addValue <= 0) return;
          if (mode === 'add') {
            mergedCounts[type] = Math.max(0, Number(mergedCounts[type] ?? 0) + addValue);
          } else {
            mergedCounts[type] = addValue;
          }
        });
        const nextMeta = mergePillarMeta(part.meta, mergedCounts);
        return { ...part, meta: nextMeta };
      });
      updateScaffoldGroup(group.id, { parts: nextParts });
    });
    clearScaffoldSelection();
    onClose();
  }, [
    counts,
    isSingle,
    singleGroupId,
    singlePartId,
    scaffoldGroups,
    mergePillarMeta,
    updateScaffoldGroup,
    onClose,
    scope,
    selectedScaffoldPartKeys,
    clearScaffoldSelection,
    mode,
  ]);

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

  // スクリーン座標での配置スタイル
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${props.screenPosition.left}px`,
    top: `${props.screenPosition.top}px`,
    zIndex: 40,
    width: 380,
  };

  const isBulk = !isSingle;
  const headerTitle = isBulk ? '柱の一括数量調整' : '柱の数量調整';

  // 一括対象の表示テキスト
  const selectedCount = selectedScaffoldPartKeys.length;
  const scopeChip = isBulk && (
    <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
      {scope === 'all' ? '対象 全柱' : `対象 ${selectedCount} 箇所`}
    </span>
  );

  return (
    <div
      style={style}
      className="glass-scope pillar-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-emerald-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-emerald-400/0 before:via-emerald-300/0 before:to-emerald-400/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label={isBulk ? '柱の一括数量調整カード' : '柱の数量調整カード'}
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
          {scopeChip}
        </div>
        <div className="flex items-center gap-1">
          {isBulk && (
            <button
              onClick={() => {
                // 一括時は選択解除ボタンを表示
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
            title="閉じる"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="relative p-3">
        {/* 一括時: 反映モード切替 */}
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

        {/* 数量グリッド */}
        <div className="grid grid-cols-3 gap-2">
          {PILLAR_TYPES.map((t) => {
            const v = Number(counts[t] ?? 0);
            return (
              <div
                key={t}
                className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60"
              >
                <div className="mb-1 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {t}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`${t} を1減らす`}
                    onClick={() => setCounts((s) => ({ ...s, [t]: Math.max(0, (Number(s[t] ?? 0) || 0) - 1) }))}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    <Minus size={12} />
                  </Button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="h-7 w-12 flex-1 min-w-0 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-center text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    value={String(isNaN(v) ? '' : v)}
                    onChange={(e) => {
                      const nv = Math.max(0, Number(e.target.value || 0));
                      setCounts((s) => ({ ...s, [t]: nv }));
                    }}
                    aria-label={`${t} の本数`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`${t} を1増やす`}
                    onClick={() => setCounts((s) => ({ ...s, [t]: (Number(s[t] ?? 0) || 0) + 1 }))}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター操作 */}
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

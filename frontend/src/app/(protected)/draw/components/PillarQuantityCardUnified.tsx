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
import type { PillarType } from '@/types/scaffold';
import { useDrawingStore } from '@/stores/drawingStore';

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

  // 共通: 編集対象の柱タイプ一覧
  const PILLAR_TYPES: PillarType[] = ['A', 'C', 'D', 'E', 'G', 'DG', 'EG', 'C-47', 'KD'];

  // 初期値（単体時は当該パーツから、 一括時は空）
  const initialCounts: Partial<Record<PillarType, number>> = React.useMemo(() => {
    if (props.kind === 'single') {
      const group = scaffoldGroups.find((g) => g.id === props.groupId);
      const part = group?.parts.find((p) => p.id === props.partId);
      const base: Partial<Record<PillarType, number>> = { ...(part?.meta?.pillarCounts || {}) };
      // 旧フィールド（単一）しかない場合はそれを初期値へ反映
      const legacyType = part?.meta?.pillarType as PillarType | undefined;
      const legacyQty = part?.meta?.quantity;
      if (legacyType && (base[legacyType] ?? 0) === 0 && (legacyQty ?? 0) > 0) {
        base[legacyType] = legacyQty;
      }
      return base;
    }
    return {};
  }, [props, scaffoldGroups]);

  // 入力状態（複数種別の本数）
  const [counts, setCounts] = React.useState<Partial<Record<PillarType, number>>>(initialCounts);
  // 一括時の適用モード
  const [mode, setMode] = React.useState<'replace' | 'add'>('replace');

  // 保存処理
  const handleSave = React.useCallback(() => {
    // 正規化（0や未指定は除外）
    const normalized: Partial<Record<PillarType, number>> = {};
    for (const t of PILLAR_TYPES) {
      const v = Number(counts[t] ?? 0);
      if (!isNaN(v) && v > 0) normalized[t] = v;
    }

    if (props.kind === 'single') {
      const group = scaffoldGroups.find((g) => g.id === props.groupId);
      if (!group) return;
      const nextParts = group.parts.map((p) => {
        if (!(p.type === '柱' && p.id === props.partId)) return p;
        const nextMeta: any = { ...(p.meta || {}), pillarCounts: normalized, quantityConfirmed: true };
        delete nextMeta.pillarType; // 旧フィールドの混在を避ける
        delete nextMeta.quantity;
        return { ...p, meta: nextMeta };
      });
      updateScaffoldGroup(group.id, { parts: nextParts });
      props.onClose();
      return;
    }

    // 以降は一括: scope に応じて対象を更新
    if (props.scope === 'selected') {
      // グループごとに選択IDを束ねる
      const grouped: Record<string, string[]> = {};
      for (const key of selectedScaffoldPartKeys) {
        const [gid, pid] = key.split(':');
        if (!grouped[gid]) grouped[gid] = [];
        grouped[gid].push(pid);
      }
      for (const gid of Object.keys(grouped)) {
        const group = scaffoldGroups.find((g) => g.id === gid);
        if (!group) continue;
        const targetIds = new Set(grouped[gid]);
        const nextParts = group.parts.map((p) => {
          if (!(p.type === '柱' && targetIds.has(p.id))) return p;
          const base = p.meta?.pillarCounts || {};
          const merged: Partial<Record<PillarType, number>> = mode === 'replace' ? {} : { ...base };
          for (const t of PILLAR_TYPES) {
            const add = Number(normalized[t] ?? 0);
            if (add <= 0) continue;
            if (mode === 'add') {
              merged[t] = Math.max(0, Number(merged[t] ?? 0) + add);
            } else {
              merged[t] = add; // 置換
            }
          }
          const nextMeta: any = { ...(p.meta || {}), pillarCounts: merged, quantityConfirmed: true };
          delete nextMeta.pillarType;
          delete nextMeta.quantity;
          return { ...p, meta: nextMeta };
        });
        updateScaffoldGroup(gid, { parts: nextParts });
      }
      clearScaffoldSelection();
      props.onClose();
      return;
    }

    // scope === 'all'：全グループの柱が対象
    for (const group of scaffoldGroups) {
      const nextParts = group.parts.map((p) => {
        if (p.type !== '柱') return p;
        const base = p.meta?.pillarCounts || {};
        const merged: Partial<Record<PillarType, number>> = mode === 'replace' ? {} : { ...base };
        for (const t of PILLAR_TYPES) {
          const add = Number(normalized[t] ?? 0);
          if (add <= 0) continue;
          if (mode === 'add') {
            merged[t] = Math.max(0, Number(merged[t] ?? 0) + add);
          } else {
            merged[t] = add; // 置換
          }
        }
        const nextMeta: any = { ...(p.meta || {}), pillarCounts: merged, quantityConfirmed: true };
        delete nextMeta.pillarType;
        delete nextMeta.quantity;
        return { ...p, meta: nextMeta };
      });
      updateScaffoldGroup(group.id, { parts: nextParts });
    }
    clearScaffoldSelection();
    props.onClose();
  }, [PILLAR_TYPES, counts, props, scaffoldGroups, selectedScaffoldPartKeys, updateScaffoldGroup, clearScaffoldSelection, mode]);

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

  const isBulk = props.kind === 'bulk';
  const headerTitle = isBulk ? '柱の一括数量調整' : '柱の数量調整';

  // 一括対象の表示テキスト
  const selectedCount = selectedScaffoldPartKeys.length;
  const scopeChip = isBulk && (
    <span className="ml-1 inline-flex items-center rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300">
      {props.kind === 'bulk' && props.scope === 'all' ? '対象 全柱' : `対象 ${selectedCount} 箇所`}
    </span>
  );

  return (
    <div
      style={style}
      className="glass-scope pillar-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
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

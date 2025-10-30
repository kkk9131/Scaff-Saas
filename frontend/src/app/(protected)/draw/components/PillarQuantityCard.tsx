/**
 * PillarQuantityCard.tsx
 * 柱の黄色発光部分をクリックした際に表示する数量調整カード
 *
 * 機能:
 * - 柱の「種別（A,C,D,E,G,DG,EG,C-47,KD）」と「数量」を入力
 * - 既存のUIトークン（Card/Button/Input）に統一
 * - キャンバス座標→スクリーン座標で絶対配置（Stageコンテナ内のオーバーレイ）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Minus, Plus, Table, X } from 'lucide-react';
import type { PillarType } from '@/types/scaffold';
import { useDrawingStore } from '@/stores/drawingStore';

/**
 * プロパティ型定義
 */
export interface PillarQuantityCardProps {
  /** カード左上のスクリーン座標（px） */
  screenPosition: { left: number; top: number };
  /** 対象のグループID */
  groupId: string;
  /** 対象の部材（柱）ID */
  partId: string;
  /** 閉じるハンドラ */
  onClose: () => void;
}

/**
 * 柱の数量調整カード
 * 既存UIに合わせ、Cardコンポーネントで軽量ポップカードを表示
 */
export default function PillarQuantityCard({ screenPosition, groupId, partId, onClose }: PillarQuantityCardProps) {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();

  // 対象部材の既存値を取得
  const group = React.useMemo(() => scaffoldGroups.find((g) => g.id === groupId), [scaffoldGroups, groupId]);
  const part = React.useMemo(() => group?.parts.find((p) => p.id === partId), [group, partId]);

  // 旧フィールドから新フィールドへの初期値補完
  const PILLAR_TYPES: PillarType[] = ['A','C','D','E','G','DG','EG','C-47','KD'];
  const initialCounts: Partial<Record<PillarType, number>> = React.useMemo(() => {
    const base: Partial<Record<PillarType, number>> = { ...(part?.meta?.pillarCounts || {}) };
    // 旧フィールド（単一）しかない場合はそれを初期値へ反映
    const legacyType = part?.meta?.pillarType as PillarType | undefined;
    const legacyQty = part?.meta?.quantity;
    if (legacyType && (base[legacyType] ?? 0) === 0 && (legacyQty ?? 0) > 0) {
      base[legacyType] = legacyQty;
    }
    return base;
  }, [part]);

  // 入力状態（複数種別の本数）
  const [counts, setCounts] = React.useState<Partial<Record<PillarType, number>>>(initialCounts);

  // 保存
  const handleSave = () => {
    if (!group) return;
    // 0や未入力を除いたオブジェクトへ整形
    const normalized: Partial<Record<PillarType, number>> = {};
    for (const t of PILLAR_TYPES) {
      const v = Number(counts[t] ?? 0);
      if (!isNaN(v) && v > 0) normalized[t] = v;
    }
    const nextParts = group.parts.map((p) => {
      if (p.id !== partId) return p;
      const nextMeta = {
        ...(p.meta || {}),
        pillarCounts: normalized,
      } as any;
      // 旧フィールドは混乱を避けるためクリア
      delete nextMeta.pillarType;
      delete nextMeta.quantity;
      return { ...p, meta: nextMeta };
    });
    updateScaffoldGroup(group.id, { parts: nextParts });
    onClose();
  };

  // スクリーン座標での配置スタイル
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width: 360,
  };

  return (
    <div
      style={style}
      className="glass-scope pillar-quantity-card fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
      aria-label="柱の数量調整カード"
    >
      {/* ヘッダー（数量表カードと統一） */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Table size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">柱の数量調整</h3>
        </div>
        <div className="flex items-center gap-1">
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

      {/* コンテンツ（数量表セクションと統一テイスト） */}
      <div className="relative p-3">
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
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(14,165,233,0.25)] hover:bg-sky-50 hover:!text-sky-700 hover:!border-sky-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-[#06B6D4]/20"
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

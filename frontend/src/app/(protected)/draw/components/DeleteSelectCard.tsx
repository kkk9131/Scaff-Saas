/**
 * DeleteSelectCard.tsx
 * 削除対象が重複する場合に表示する選択カード（布材/ブラケットなど）
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export interface DeleteCandidate {
  id: string;
  type: '布材' | 'ブラケット' | '柱' | 'アンチ' | '階段' | '梁枠';
  label?: string;
}

export default function DeleteSelectCard({
  screenPosition,
  candidates,
  onSelect,
  onClose,
}: {
  screenPosition: { left: number; top: number };
  candidates: DeleteCandidate[];
  onSelect: (candidate: DeleteCandidate) => void;
  onClose: () => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 50,
    width: 220,
  };

  return (
    <div
      style={style}
      className="glass-scope fixed z-50 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 p-3 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-label="削除対象の選択"
    >
      <div className="mb-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200">削除対象を選択</div>
      <div className="flex flex-col gap-2">
        {candidates.map((c) => (
          <Button
            key={c.id}
            variant={c.type === 'ブラケット' ? 'warning' : 'destructive'}
            size="sm"
            onClick={() => onSelect(c)}
            className="justify-start"
          >
            {c.label ?? `${c.type} を削除`}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>キャンセル</Button>
      </div>
    </div>
  );
}


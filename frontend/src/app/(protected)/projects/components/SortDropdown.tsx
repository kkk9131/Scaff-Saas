'use client';

import * as React from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * ソート対象キー
 */
export type ProjectSortKey = 'updated_at' | 'created_at' | 'name';

/**
 * ソートドロップダウンのプロパティ
 */
export interface SortDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 現在選択中のソートキー
   */
  sortKey: ProjectSortKey;
  /**
   * 昇順 or 降順
   */
  sortOrder: 'asc' | 'desc';
  /**
   * ソートキー変更時のハンドラー
   */
  onSortKeyChange: (key: ProjectSortKey) => void;
  /**
   * ソート順変更時のハンドラー
   */
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const sortOptions: { value: ProjectSortKey; label: string }[] = [
  { value: 'updated_at', label: '更新日時' },
  { value: 'created_at', label: '作成日時' },
  { value: 'name', label: 'プロジェクト名' },
];

/**
 * プロジェクト一覧のソート条件を切り替えるドロップダウン
 *
 * - ダッシュボードで使っているカードスタイルに合わせた見た目を採用
 * - ソート順はボタンでワンタップ切り替え可能にしてUXを向上
 */
export function SortDropdown({
  sortKey,
  sortOrder,
  onSortKeyChange,
  onSortOrderChange,
  className,
  ...props
}: SortDropdownProps) {
  const handleSortKeyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSortKeyChange(event.target.value as ProjectSortKey);
  };

  const toggleOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div
      className={cn(
        // QA調：完全透過＋ガラス＋グラデトップコート
        'glass-scope group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/40 bg-transparent p-4 shadow-lg shadow-sky-500/10 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-transparent dark:shadow-indigo-900/40',
        'before:absolute before:inset-0 before:rounded-2xl before:opacity-90 before:pointer-events-none before:bg-gradient-to-br before:from-[#06B6D4]/0 before:via-[#22D3EE]/0 before:to-[#0EA5E9]/30',
        className
      )}
      {...props}
    >
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        ソート
      </h2>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="project-sort-key">
          並び替え基準
        </label>
        <div className="relative">
          <select
            id="project-sort-key"
            value={sortKey}
            onChange={handleSortKeyChange}
            className={cn(
              'flex h-12 w-full appearance-none rounded-xl border border-white/40 bg-transparent px-4 py-3 text-base text-slate-900 shadow-[0_8px_26px_-18px_rgba(14,165,233,0.45)] transition-all duration-200 hover:border-sky-300 hover:shadow-[0_10px_30px_-18px_rgba(14,165,233,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              'dark:border-slate-700 dark:bg-transparent dark:text-slate-100 dark:shadow-[0_12px_32px_-22px_rgba(15,23,42,0.8)] dark:hover:border-slate-500 dark:hover:shadow-[0_12px_36px_-22px_rgba(15,23,42,0.85)] dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900'
            )}
            aria-label="プロジェクトの並び替え基準"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 dark:text-slate-500">
            ▾
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={toggleOrder}
        className="flex items-center justify-between rounded-xl border border-white/40 bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-sky-500/10 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-500/20 dark:border-slate-700/60 dark:bg-transparent dark:text-slate-100 dark:shadow-slate-900/40 dark:hover:shadow-indigo-900/50"
        aria-label={`並び順を${sortOrder === 'asc' ? '降順' : '昇順'}へ変更`}
      >
        <span>並び順: {sortOrder === 'asc' ? '昇順' : '降順'}</span>
        {sortOrder === 'asc' ? (
          <ArrowUpNarrowWide className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ArrowDownWideNarrow className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

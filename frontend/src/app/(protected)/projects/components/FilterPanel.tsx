'use client';

import * as React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  PROJECT_STATUS_ICONS,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/types/project';

/**
 * 日付範囲を表す型
 */
export interface DateRange {
  /**
   * フィルター開始日（ISO 8601形式の文字列）
   */
  startDate?: string | null;
  /**
   * フィルター終了日（ISO 8601形式の文字列）
   */
  endDate?: string | null;
}

/**
 * プロジェクトフィルターパネルのプロパティ
 */
export interface FilterPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 選択中のステータス一覧
   */
  selectedStatuses: ProjectStatus[];
  /**
   * ステータス変更時のハンドラー
   */
  onSelectedStatusesChange: (statuses: ProjectStatus[]) => void;
  /**
   * 選択中の日付範囲
   */
  dateRange: DateRange;
  /**
   * 日付範囲変更時のハンドラー
   */
  onDateRangeChange: (range: DateRange) => void;
  /**
   * フィルターをリセットするハンドラー
   */
  onReset?: () => void;
}

const statusOrder: ProjectStatus[] = ['draft', 'active', 'completed', 'archived'];

/**
 * プロジェクト検索用のフィルターパネル
 *
 * - ステータスの複数選択と日付範囲指定をサポート
 * - ダッシュボード既存のグラスパネル調スタイルに合わせて装飾
 */
export function FilterPanel({
  selectedStatuses,
  onSelectedStatusesChange,
  dateRange,
  onDateRangeChange,
  onReset,
  className,
  ...props
}: FilterPanelProps) {
  /**
   * ステータスチェックボックス変更時に呼び出されるハンドラー
   */
  const handleStatusToggle = (status: ProjectStatus, checked: boolean) => {
    if (checked) {
      onSelectedStatusesChange([...new Set([...selectedStatuses, status])]);
    } else {
      onSelectedStatusesChange(selectedStatuses.filter((item) => item !== status));
    }
  };

  /**
   * 日付入力の値を統一した形で親へ返す
   */
  const handleDateChange = (key: keyof DateRange, value: string) => {
    onDateRangeChange({
      ...dateRange,
      [key]: value || null,
    });
  };

  const appliedFiltersCount =
    selectedStatuses.length +
    (dateRange.startDate ? 1 : 0) +
    (dateRange.endDate ? 1 : 0);

  return (
    <div
      className={cn(
        // QA調：完全透過＋ガラス＋グラデトップコート
        'glass-scope group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/40 bg-transparent p-4 shadow-lg shadow-sky-500/10 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-transparent dark:shadow-indigo-900/40',
        'before:absolute before:inset-0 before:rounded-2xl before:opacity-90 before:pointer-events-none before:bg-gradient-to-br before:from-[#8B5CF6]/0 before:via-[#A855F7]/0 before:to-[#C084FC]/25',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            フィルター
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ステータスと期間でプロジェクトを絞り込みます。
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          リセット
          {appliedFiltersCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[#06B6D4]/10 px-2 text-[10px] font-semibold text-[#06B6D4] dark:bg-[#06B6D4]/20">
              {appliedFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* ステータス選択 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ステータス
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {statusOrder.map((status) => (
            <label
              key={status}
              // 完全透過のチップ（境界とblurのみ）
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/40 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-sky-500/10 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-500/20 dark:border-slate-700/50 dark:bg-transparent dark:text-slate-100 dark:shadow-slate-900/40 dark:hover:shadow-indigo-900/50"
            >
              <Checkbox
                checked={selectedStatuses.includes(status)}
                onCheckedChange={(checked) => handleStatusToggle(status, checked)}
                aria-label={`${PROJECT_STATUS_LABELS[status]}を含める`}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {PROJECT_STATUS_ICONS[status]}
                </span>
                <span>{PROJECT_STATUS_LABELS[status]}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 日付範囲選択 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          期間
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            type="date"
            label="開始日"
            value={dateRange.startDate ?? ''}
            onChange={(event) => handleDateChange('startDate', event.target.value)}
            leftElement={<Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            className={cn('bg-transparent border-white/40 dark:bg-transparent dark:border-slate-700/50')}
          />
          <Input
            type="date"
            label="終了日"
            value={dateRange.endDate ?? ''}
            min={dateRange.startDate ?? undefined}
            onChange={(event) => handleDateChange('endDate', event.target.value)}
            leftElement={<Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            className={cn('bg-transparent border-white/40 dark:bg-transparent dark:border-slate-700/50')}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          日付が未設定のプロジェクトは期間フィルターの対象外になります。
        </p>
      </div>
    </div>
  );
}

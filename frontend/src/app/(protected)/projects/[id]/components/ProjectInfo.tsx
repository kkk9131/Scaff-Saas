'use client';

import * as React from 'react';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { Muted } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/project';

/**
 * ガラスモーフィズム調のパネル（検索ツールカードと同質感）
 */
const panelBaseClass =
  'glass-scope group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-transparent dark:bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30';

/**
 * プロジェクト基本情報カード
 *
 * 選択したプロジェクトの概要を表示するプレゼンテーションコンポーネントです。
 */
export interface ProjectInfoProps {
  /**
   * プロジェクト本体のデータ
   */
  project: Project;

  /**
   * 追加のTailwindクラス
   */
  className?: string;
}

/**
 * ISO文字列を「YYYY/MM/DD」形式へ整形するヘルパー関数
 * 未設定の場合は「未設定」として表示します。
 */
function formatDate(value?: string | null): string {
  if (!value) return '未設定';

  const date = new Date(value);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function ProjectInfo({ project, className }: ProjectInfoProps) {
  /**
   * 表示内容を配列にまとめておくと、将来的に項目を増やしたいときも
   * ここへ1レコード追加するだけで済みます。
   */
  const basicInfo = React.useMemo(
    () => [
      {
        label: '顧客名',
        value: project.customer_name ?? '未設定',
      },
      {
        label: '現場住所',
        value: project.site_address ?? '未設定',
      },
      {
        label: '開始日',
        value: formatDate(project.start_date),
      },
      {
        label: '終了日',
        value: formatDate(project.end_date),
      },
      {
        label: '作成日時',
        value: formatDate(project.created_at),
      },
      {
        label: '最終更新',
        value: formatDate(project.updated_at),
      },
    ],
    [project]
  );

  return (
    <section className={cn(panelBaseClass, 'p-6 space-y-6', className)}>
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-3xl font-bold leading-tight text-gray-900 dark:text-slate-100">
            {project.name}
          </h2>
          <ProjectStatusBadge status={project.status} />
        </div>
        {/* プロジェクトの説明は任意項目のため、存在する場合のみ表示 */}
        {project.description && (
          <Muted>{project.description}</Muted>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {basicInfo.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-dashed border-white/40 bg-transparent backdrop-blur-sm p-4 text-gray-900 shadow-sm dark:text-slate-100 dark:border-slate-700 dark:bg-transparent"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {item.label}
            </dt>
            <dd className="mt-2 text-base">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

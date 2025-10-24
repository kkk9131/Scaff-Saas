/**
 * プロジェクト統計ウィジェットコンポーネント
 * ダッシュボードにプロジェクトの統計情報（総数、ステータス別）をカード形式で表示
 */

'use client';

import { useProjectStats } from '@/lib/hooks/useProjectStats';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner } from '@/components';
import { FolderKanban, PlayCircle, CheckCircle, FileText, Clock } from 'lucide-react';

/**
 * 統計カード1枚分のプロパティ
 */
interface StatCardProps {
  title: string; // カードのタイトル
  value: number; // 表示する数値
  icon: React.ReactNode; // アイコン
  colorClass: string; // アイコン・数値の色クラス
}

/**
 * 統計カード1枚分のコンポーネント
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div
      className="
        relative overflow-hidden rounded-xl
        bg-white/60 backdrop-blur-md
        dark:bg-slate-800/60
        border border-white/20 dark:border-slate-700/50
        shadow-lg hover:shadow-xl
        transition-all duration-300
        hover:scale-105
        p-6
      "
    >
      {/* グラデーション背景 */}
      <div
        className={`
          absolute inset-0 opacity-5
          bg-gradient-to-br ${colorClass}
        `}
      />

      {/* コンテンツ */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <div className={`${colorClass} opacity-80`}>{icon}</div>
      </div>
    </div>
  );
};

/**
 * プロジェクト統計ウィジェット
 * 総プロジェクト数と各ステータス別のカウントを表示
 */
export const ProjectStatsWidget: React.FC = () => {
  const { stats, isLoading, error } = useProjectStats();

  // ローディング中の表示
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>プロジェクト統計</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // エラー時の表示
  if (error || !stats) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>プロジェクト統計</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">統計の読み込みに失敗しました</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error?.message || 'データを取得できませんでした'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* セクションタイトル */}
      <h2 className="text-2xl font-bold text-foreground">プロジェクト統計</h2>

      {/* 統計カードグリッド */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 総プロジェクト数 */}
        <StatCard
          title="総プロジェクト数"
          value={stats.total}
          icon={<FolderKanban className="h-10 w-10" />}
          colorClass="text-blue-600 dark:text-blue-400"
        />

        {/* 進行中 */}
        <StatCard
          title="進行中"
          value={stats.active}
          icon={<PlayCircle className="h-10 w-10" />}
          colorClass="text-green-600 dark:text-green-400"
        />

        {/* 完了 */}
        <StatCard
          title="完了"
          value={stats.completed}
          icon={<CheckCircle className="h-10 w-10" />}
          colorClass="text-purple-600 dark:text-purple-400"
        />

        {/* 下書き */}
        <StatCard
          title="下書き"
          value={stats.draft}
          icon={<FileText className="h-10 w-10" />}
          colorClass="text-orange-600 dark:text-orange-400"
        />

        {/* 未着手 */}
        <StatCard
          title="未着手"
          value={stats.pending}
          icon={<Clock className="h-10 w-10" />}
          colorClass="text-gray-600 dark:text-gray-400"
        />
      </div>
    </div>
  );
};

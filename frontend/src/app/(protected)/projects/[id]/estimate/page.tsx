'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, LoadingSpinner, GradientText, Muted } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { getProject } from '@/lib/api/projects';
import { ArrowLeft, RefreshCcw, FileText, Save, X, Mail } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { EstimatePreview } from './components/EstimatePreview';
import type { Estimate } from '@/types/estimate';

/**
 * ガラスモーフィズム調のパネルスタイル
 */
const glassPanelClass =
  'glass-scope group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-transparent dark:bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30';

/**
 * 見積もりページ
 *
 * プロジェクトに紐づく見積もりを作成・表示する画面です。
 * 現在はモックデータでUIのみを表示します。
 */
export default function EstimatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  const projectId = React.useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  // プロジェクト取得
  const { data: project, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['project-estimate', projectId],
    enabled: Boolean(projectId) && !authLoading,
    queryFn: async () => {
      if (!projectId) throw new Error('プロジェクトIDが見つかりませんでした');
      const response = await getProject(projectId);
      if (response.error) throw new Error(response.error.message ?? 'プロジェクトの取得に失敗しました');
      if (!response.data) throw new Error('プロジェクト情報が空でした');
      return response.data;
    },
  });

  // モック見積もりデータ（実際のAPI呼び出しは今後実装）
  const mockEstimate: Estimate | null = React.useMemo(() => {
    if (!project) return null;
    return {
      id: `estimate-${project.id}`,
      project_id: project.id,
      estimate_number: `EST-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      title: `${project.name} - 足場工事見積書`,
      items: [
        {
          id: '1',
          name: '単管足場',
          unit: '㎡',
          quantity: 150,
          unit_price: 1200,
          amount: 180000,
          note: '標準的な単管足場',
        },
        {
          id: '2',
          name: '足場板',
          unit: '枚',
          quantity: 200,
          unit_price: 800,
          amount: 160000,
          note: '',
        },
        {
          id: '3',
          name: '手すり',
          unit: 'm',
          quantity: 80,
          unit_price: 500,
          amount: 40000,
          note: '',
        },
      ],
      subtotal: 380000,
      tax_rate: 0.1,
      tax_amount: 38000,
      total: 418000,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: '見積有効期限は30日間です。',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [project]);

  // AIチャットのメッセージ履歴（空の状態）
  const [chatMessages] = React.useState([]);

  const handleSendMessage = React.useCallback(() => {
    // モック実装のため空
  }, []);

  if (authLoading || isLoading) {
    return <LoadingSpinner fullScreen text="プロジェクトを読み込み中です..." />;
  }

  const errorMessage = error ? (error as Error).message ?? '不明なエラーが発生しました。' : null;

  return (
    <DashboardShell chatMessages={chatMessages} onSendChatMessage={handleSendMessage}>
      <div className="p-6">
        {errorMessage || !project ? (
          <div className={`${glassPanelClass} mx-auto max-w-3xl p-8 text-center`}>
            <h2 className="text-2xl font-bold text-card-foreground">
              {errorMessage ? '読み込みに失敗しました' : 'プロジェクトが見つかりません'}
            </h2>
            <Muted className="mt-4">
              {errorMessage ?? 'URLが正しいかもう一度ご確認ください。'}
            </Muted>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/projects')}
                iconLeft={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              >
                プロジェクト一覧へ戻る
              </Button>
              <Button onClick={() => refetch()} iconLeft={<RefreshCcw className="h-4 w-4" aria-hidden="true" />}>
                再試行する
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ページヘッダー */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <Muted>見積もり作成</Muted>
                <GradientText as="h2" className="text-3xl font-bold">{project.name}</GradientText>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  iconLeft={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  プロジェクト詳細へ戻る
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => refetch()}
                  isLoading={isFetching}
                  iconLeft={<RefreshCcw className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  最新情報を取得
                </Button>
              </div>
            </div>

            {/* 見積もりプレビュー */}
            <div className="max-w-4xl mx-auto">
              <EstimatePreview estimate={mockEstimate} />
              
              {/* アクションボタン（モック） */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: 見積もりを破棄する処理を実装
                  }}
                  iconLeft={<X className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  破棄
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: PDFを生成する処理を実装
                  }}
                  iconLeft={<FileText className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Gmailで送信する処理を実装
                  }}
                  iconLeft={<Mail className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  Gmail
                </Button>
                <Button
                  onClick={() => {
                    // TODO: 見積もりを保存する処理を実装
                  }}
                  iconLeft={<Save className="h-4 w-4" aria-hidden="true" />}
                  className="dark:text-gray-300 text-black"
                >
                  保存
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}


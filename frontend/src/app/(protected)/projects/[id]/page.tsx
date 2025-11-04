'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { type ChatMessage, Button, LoadingSpinner, useToast, GradientText, Muted } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { getProject } from '@/lib/api/projects';
import { getLatestDrawing, type DrawingRecord } from '@/lib/api/drawings';
import type { Project } from '@/types/project';
import { ProjectInfo } from './components/ProjectInfo';
import { ActionButtons } from './components/ActionButtons';
import { FileList, type ProjectFileItem } from './components/FileList';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';

/**
 * ガラスモーフィズム調のパネルスタイル（検索ツールのカードと同質感）
 * - 背景は完全透過（light/dark ともに bg-transparent）
 * - 枠はやや強め（white/40、darkはslate-700/60）
 * - 強めの backdrop-blur と淡いグラデーションのトップコートを付与
 */
const glassPanelClass =
  'glass-scope group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-transparent dark:bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30';

/**
 * メタデータから添付ファイルを抽出
 */
function extractProjectFiles(project?: Project): ProjectFileItem[] {
  if (!project?.metadata) return [];
  const maybeFiles = (project.metadata as { files?: unknown }).files;
  if (!Array.isArray(maybeFiles)) return [];
  return maybeFiles.map((raw, index) => {
    const file = raw as Record<string, unknown>;
    const id = String(file.id ?? `${project.id}-file-${index}`);
    const name = String(file.name ?? `ファイル${index + 1}`);
    const type = typeof file.type === 'string' ? file.type : 'other';
    const sizeCandidate =
      typeof file.size === 'number'
        ? file.size
        : typeof file.fileSize === 'number'
          ? file.fileSize
          : 0;
    const uploadedAt =
      typeof file.uploadedAt === 'string'
        ? file.uploadedAt
        : typeof file.uploaded_at === 'string'
          ? file.uploaded_at
          : project.updated_at;
    const url = typeof file.url === 'string' ? file.url : undefined;
    return { id, name, type, size: sizeCandidate, uploadedAt, url };
  });
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { loading: authLoading } = useAuth();

  const projectId = React.useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  // AIチャットのメッセージ履歴
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);

  // プロジェクト取得
  const { data: project, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['project-detail', projectId],
    enabled: Boolean(projectId) && !authLoading,
    queryFn: async () => {
      if (!projectId) throw new Error('プロジェクトIDが見つかりませんでした');
      const response = await getProject(projectId);
      if (response.error) throw new Error(response.error.message ?? 'プロジェクトの取得に失敗しました');
      if (!response.data) throw new Error('プロジェクト情報が空でした');
      return response.data;
    },
  });

  const projectFiles = React.useMemo(() => extractProjectFiles(project), [project]);

  // 最新の図面（存在しない場合は null）
  const { data: latestDrawingResp } = useQuery({
    queryKey: ['project-latest-drawing', projectId],
    enabled: Boolean(projectId) && !authLoading,
    queryFn: async () => {
      if (!projectId) throw new Error('プロジェクトIDが見つかりませんでした');
      return getLatestDrawing(projectId);
    },
  });

  const latestDrawing: DrawingRecord | null = React.useMemo(
    () => latestDrawingResp?.data ?? null,
    [latestDrawingResp]
  );


  const handleSendMessage = React.useCallback((message: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '内容を確認しました。足場設計に関するご相談があればいつでも声をかけてくださいね。',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    }, 800);
  }, []);

  const handlePreviewFile = React.useCallback((file: ProjectFileItem) => {
    toast({ title: 'プレビュー準備中', description: `${file.name} を開きます。`, type: 'info' });
    if (file.url) window.open(file.url, '_blank', 'noopener,noreferrer');
  }, [toast]);

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
                <Muted>プロジェクト詳細</Muted>
                <GradientText as="h2" className="text-3xl font-bold">{project.name}</GradientText>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/projects')}
                  iconLeft={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                >
                  一覧に戻る
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => refetch()}
                  isLoading={isFetching}
                  iconLeft={<RefreshCcw className="h-4 w-4" aria-hidden="true" />}
                >
                  最新情報を取得
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ProjectInfo project={project} className="lg:col-span-2" />

              <div className="space-y-6">
                <section className={`${glassPanelClass} p-6 space-y-4`}>
                  <h3 className="text-lg font-semibold text-card-foreground">次のステップ</h3>
                  <Muted>
                    作図で足場の配置を編集し、見積で費用試算に進めます。
                  </Muted>
                  <ActionButtons
                    projectId={project.id}
                    disabled={isFetching}
                    drawSubLabel={(() => {
                      const dt = latestDrawing?.updated_at ?? latestDrawing?.created_at
                      if (!dt) return undefined
                      const d = new Date(dt)
                      const formatted = d.toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      return `最終保存: ${formatted}`
                    })()}
                    estimateSubLabel={`最終更新: -`}
                  />
                </section>

                {/* 保存済み図面のカードは非表示（ユーザー要望により削除） */}

                <FileList files={projectFiles} onPreview={handlePreviewFile} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

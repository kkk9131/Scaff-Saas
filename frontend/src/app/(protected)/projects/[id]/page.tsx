'use client';

import * as React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar,
  ChatSidebar,
  type ChatMessage,
  ThemeToggle,
  Button,
  LoadingSpinner,
  useToast,
} from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProject } from '@/lib/api/projects';
import type { Project } from '@/types/project';
import { ProjectInfo } from './components/ProjectInfo';
import { ActionButtons } from './components/ActionButtons';
import { FileList, type ProjectFileItem } from './components/FileList';

/**
 * ガラスモーフィズム調のパネルスタイル
 * ダッシュボード全体で使用している質感に合わせるための共通クラス。
 */
const glassPanelClass =
  'relative overflow-hidden rounded-2xl border border-white/30 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-sky-500/10 dark:shadow-slate-900/50 transition-colors duration-300';

/**
 * メタデータから添付ファイルを抽出するヘルパー
 * Supabase Storageのレスポンス形式が未確定なため、柔軟に対応できるように型ガードを挟んでいます。
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

    return {
      id,
      name,
      type,
      size: sizeCandidate,
      uploadedAt,
      url,
    };
  });
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isDark } = useTheme();

  const projectId = React.useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  // サイドバーとチャットの開閉状態
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(false);

  // AIチャットのメッセージ履歴
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);

  // 背景グラデーションと発光装飾（ダッシュボードと統一）
  const backgroundGradientClass = isDark
    ? 'bg-gradient-to-br from-sky-950 via-purple-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-sky-100 to-slate-100';
  const topGlowClass = isDark ? 'bg-sky-500/40' : 'bg-sky-300/40';
  const bottomGlowClass = isDark ? 'bg-fuchsia-600/40' : 'bg-rose-200/40';
  const accentGlowClass = isDark ? 'bg-indigo-700/40' : 'bg-cyan-200/40';

  // プロジェクト取得クエリ
  const {
    data: project,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project-detail', projectId],
    enabled: Boolean(projectId) && !authLoading,
    queryFn: async () => {
      if (!projectId) {
        throw new Error('プロジェクトIDが見つかりませんでした');
      }

      const response = await getProject(projectId);

      if (response.error) {
        throw new Error(response.error.message ?? 'プロジェクトの取得に失敗しました');
      }

      if (!response.data) {
        throw new Error('プロジェクト情報が空でした');
      }

      return response.data;
    },
  });

  /**
   * 添付ファイルリスト
   * metadata.files が存在する場合のみリストを生成します。
   */
  const projectFiles = React.useMemo(() => extractProjectFiles(project), [project]);

  const handleSendMessage = React.useCallback(
    (message: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // TODO: OpenAI連携後にAPIレスポンスへ置き換える
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: '内容を確認しました。足場設計に関するご相談があればいつでも声をかけてくださいね。',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      }, 800);
    },
    []
  );

  const handlePreviewFile = React.useCallback(
    (file: ProjectFileItem) => {
      toast({
        title: 'プレビュー準備中',
        description: `${file.name} を開きます。`,
        type: 'info',
      });

      if (file.url) {
        window.open(file.url, '_blank', 'noopener,noreferrer');
      }
    },
    [toast]
  );

  const handleSignOut = React.useCallback(async () => {
    await signOut();
    router.push('/login');
  }, [router, signOut]);

  if (authLoading || isLoading) {
    return <LoadingSpinner fullScreen text="プロジェクトを読み込み中です..." />;
  }

  const errorMessage = error ? (error as Error).message ?? '不明なエラーが発生しました。' : null;

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${backgroundGradientClass}`}
    >
      <div
        className={`pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl ${topGlowClass}`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl ${bottomGlowClass}`}
      />
      <div
        className={`pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl ${accentGlowClass}`}
      />

      <div className="relative z-10">
        {/* ヘッダー */}
        <nav className="fixed top-0 left-0 right-0 z-50 border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/40 transition-colors">
          <div className="flex items-center justify-between h-16 px-4">
            {/* 左側: サイドバートグル + ロゴ */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLeftSidebarOpen((prev) => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/40 hover:shadow-inner dark:hover:bg-slate-900/60"
                aria-label="サイドバーを開閉"
              >
                <svg
                  className="h-6 w-6 text-gray-700 dark:text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/30 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-lg shadow-sky-500/20 dark:shadow-indigo-900/40">
                  <Image
                    src="/favicon.ico"
                    alt="ScaffAIのロゴ"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    priority
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">ScaffAI</h1>
              </div>
            </div>

            {/* 右側: ユーザー情報 + チャットトグル */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsRightSidebarOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:bg-[#06B6D4]/15 dark:hover:bg-[#06B6D4]/30 text-[#06B6D4]"
                aria-label="AIチャットを開閉"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="hidden md:inline font-medium">AIチャット</span>
              </button>
              <ThemeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-200">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] shadow-lg shadow-sky-500/20 transition-all duration-300 hover:shadow-sky-500/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6366F1]"
              >
                ログアウト
              </button>
            </div>
          </div>
        </nav>

        {/* 左サイドバー（ナビゲーション） */}
        <Sidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          onToggle={() => setIsLeftSidebarOpen((prev) => !prev)}
        />

        {/* メインコンテンツ */}
        <main
          className={`
            pt-16 transition-all duration-300
            ${isLeftSidebarOpen ? 'md:ml-64' : 'md:ml-20'}
            ${isRightSidebarOpen ? 'md:mr-96' : 'md:mr-0'}
          `}
        >
          <div className="p-6">
            {errorMessage || !project ? (
              <div className={`${glassPanelClass} mx-auto max-w-3xl p-8 text-center`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {errorMessage ? '読み込みに失敗しました' : 'プロジェクトが見つかりません'}
                </h2>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  {errorMessage ?? 'URLが正しいかもう一度ご確認ください。'}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/projects')}
                    iconLeft={<span aria-hidden>📁</span>}
                  >
                    プロジェクト一覧へ戻る
                  </Button>
                  <Button onClick={() => refetch()} iconLeft={<span aria-hidden>🔄</span>}>
                    再試行する
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* ページヘッダー */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">プロジェクト詳細</p>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">{project.name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/projects')}
                      iconLeft={<span aria-hidden>←</span>}
                    >
                      一覧に戻る
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => refetch()}
                      isLoading={isFetching}
                      iconLeft={<span aria-hidden>🔄</span>}
                    >
                      最新情報を取得
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <ProjectInfo project={project} className="lg:col-span-2" />

                  <div className="space-y-6">
                    <section className={`${glassPanelClass} p-6 space-y-4`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">次のステップ</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        作図で足場の配置を編集し、見積で費用試算に進めます。
                      </p>
                      <ActionButtons projectId={project.id} disabled={isFetching} />
                    </section>

                    <FileList files={projectFiles} onPreview={handlePreviewFile} />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* 右サイドバー（AIチャット） */}
        <ChatSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          onToggle={() => setIsRightSidebarOpen((prev) => !prev)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}


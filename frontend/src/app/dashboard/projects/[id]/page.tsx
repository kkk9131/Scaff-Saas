/**
 * プロジェクト詳細ページ
 *
 * 個別プロジェクトの詳細表示・編集画面
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatSidebar, ChatMessage } from '@/components/layout/ChatSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import { ConfirmModal } from '@/components/ui/Modal'
import { Project, ProjectUpdateRequest } from '@/types/project'
import { getProject, updateProject, deleteProject } from '@/lib/api/projects'
import Image from 'next/image'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const { isDark } = useTheme()

  // サイドバーの開閉状態管理
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // プロジェクトデータ管理
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 編集モード管理
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 削除確認モーダル管理
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 背景グラデーションと発光装飾
  const backgroundGradientClass = isDark
    ? 'bg-gradient-to-br from-sky-950 via-purple-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
  const topGlowClass = isDark ? 'bg-sky-500/40' : 'bg-sky-300/40'
  const bottomGlowClass = isDark ? 'bg-fuchsia-600/40' : 'bg-rose-200/40'
  const accentGlowClass = isDark ? 'bg-indigo-700/40' : 'bg-cyan-200/40'

  // ガラスモーフィズムスタイル
  const glassPanelClass =
    'relative overflow-hidden rounded-2xl border border-white/30 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-sky-500/10 dark:shadow-slate-900/50 transition-colors duration-300'

  /**
   * プロジェクト詳細を取得
   */
  const fetchProject = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getProject(projectId)

      if (response.error) {
        setError(response.error.message)
        return
      }

      if (response.data) {
        setProject(response.data)
      }
    } catch (err) {
      console.error('プロジェクト取得エラー:', err)
      setError('プロジェクトの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /**
   * プロジェクト更新処理
   */
  const handleUpdate = async (data: ProjectUpdateRequest) => {
    setIsUpdating(true)

    try {
      const response = await updateProject(projectId, data)

      if (response.error) {
        alert(`更新に失敗しました: ${response.error.message}`)
        return
      }

      if (response.data) {
        setProject(response.data)
        setIsEditMode(false)
        alert('プロジェクトを更新しました')
      }
    } catch (err) {
      console.error('プロジェクト更新エラー:', err)
      alert('プロジェクトの更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  /**
   * プロジェクト削除処理
   */
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await deleteProject(projectId)

      if (response.error) {
        alert(`削除に失敗しました: ${response.error.message}`)
        return
      }

      // 削除成功後、一覧画面に戻る
      router.push('/dashboard/projects')
    } catch (err) {
      console.error('プロジェクト削除エラー:', err)
      alert('プロジェクトの削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  /**
   * チャットメッセージ送信処理
   */
  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setChatMessages([...chatMessages, newMessage])

    // AIの応答をシミュレート
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'プロジェクトに関するご質問ですね。どのようにお手伝いできますか？',
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  /**
   * 日付フォーマット関数
   */
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '未設定'
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 初回マウント時にプロジェクトを取得
  useEffect(() => {
    if (!authLoading && user) {
      fetchProject()
    }
  }, [authLoading, user, projectId])

  // ローディング中の表示
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー時の表示
  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'プロジェクトが見つかりません'}
          </p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${backgroundGradientClass}`}
    >
      {/* 背景のグロー装飾 */}
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
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
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
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
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
          onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
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
            {/* ページヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard/projects')}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="text-sm font-medium">一覧に戻る</span>
                </button>
              </div>
            </div>

            {/* プロジェクト詳細 */}
            <div className={glassPanelClass}>
              <div className="p-6">
                {/* プロジェクトヘッダー */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                        {project.name}
                      </h2>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* アクションボタン */}
                  {!isEditMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                      >
                        ✏️ 編集
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteModalOpen(true)}
                      >
                        🗑️ 削除
                      </Button>
                    </div>
                  )}
                </div>

                {/* 編集フォーム or 詳細情報 */}
                {isEditMode ? (
                  <div className="mt-6 p-6 rounded-xl border border-white/30 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                      プロジェクト編集
                    </h3>
                    <ProjectForm
                      isEdit
                      project={project}
                      onSubmit={handleUpdate}
                      onCancel={() => setIsEditMode(false)}
                      isLoading={isUpdating}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* 顧客名 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        顧客名
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {project.customer_name || '未設定'}
                      </p>
                    </div>

                    {/* 現場住所 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        現場住所
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {project.site_address || '未設定'}
                      </p>
                    </div>

                    {/* 開始日 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        開始日
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {formatDate(project.start_date)}
                      </p>
                    </div>

                    {/* 終了日 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        終了日
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {formatDate(project.end_date)}
                      </p>
                    </div>

                    {/* 作成日 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        作成日
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {formatDate(project.created_at)}
                      </p>
                    </div>

                    {/* 最終更新日 */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        最終更新日
                      </label>
                      <p className="mt-1 text-lg text-gray-900 dark:text-slate-100">
                        {formatDate(project.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* 右サイドバー（AIチャット） */}
        <ChatSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />

        {/* 削除確認モーダル */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="プロジェクトを削除"
          description="この操作は取り消せません。本当に削除しますか？"
          confirmText="削除"
          cancelText="キャンセル"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}

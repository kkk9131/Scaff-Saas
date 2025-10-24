/**
 * ダッシュボードページ
 * ログイン後のメインページ - 3カラムレイアウト
 * 左サイドバー: ナビゲーション / 中央: ダッシュボードコンテンツ / 右サイドバー: AIチャット
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatSidebar, ChatMessage } from '@/components/layout/ChatSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { ProjectStatsWidget } from '@/components/dashboard/ProjectStatsWidget'

// モックデータ型定義
interface Project {
  id: string
  name: string
  preview: string
  date: string
  overlayGradientClass: string
  iconBackgroundClass: string
}

interface ActiveSite {
  id: string
  name: string
  location: string
  progress: number
}

interface QuickAction {
  id: string
  label: string
  icon: string
  overlayGradientClass: string
  iconBackgroundClass: string
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { isDark } = useTheme()

  // サイドバーの開閉状態管理
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)

  // チャットメッセージの状態管理
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // 背景グラデーションと発光装飾（ログイン画面と統一）
  const backgroundGradientClass = isDark
    ? 'bg-gradient-to-br from-sky-950 via-purple-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
  const topGlowClass = isDark ? 'bg-sky-500/40' : 'bg-sky-300/40'
  const bottomGlowClass = isDark ? 'bg-fuchsia-600/40' : 'bg-rose-200/40'
  const accentGlowClass = isDark ? 'bg-indigo-700/40' : 'bg-cyan-200/40'

  // ガラスモーフィズム風カードの共通クラス
  const glassCardClass =
    'group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/25 dark:hover:shadow-indigo-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
  const glassPanelClass =
    'relative overflow-hidden rounded-2xl border border-white/30 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-sky-500/10 dark:shadow-slate-900/50 transition-colors duration-300'
  const glassHoverOverlayBase =
    'before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100'
  const iconWrapperBase =
    'relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/40 dark:border-slate-700/50 backdrop-blur-xl shadow-md shadow-sky-500/20 dark:shadow-indigo-900/40'

  // モックデータ: 直近3つのプロジェクト（プレビューは絵文字で代用）
  const recentProjects: Project[] = [
    {
      id: '1',
      name: '〇〇マンション建設プロジェクト',
      preview: '🏗️',
      date: '2025-10-20',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#06B6D4]/0 before:via-[#6366F1]/0 before:to-[#8B5CF6]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#06B6D4]/25 via-[#6366F1]/30 to-[#8B5CF6]/40',
    },
    {
      id: '2',
      name: '△△ビル改修工事',
      preview: '🔧',
      date: '2025-10-18',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#F97316]/0 before:via-[#FB923C]/0 before:to-[#F59E0B]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#F97316]/25 via-[#FB923C]/30 to-[#F59E0B]/35',
    },
    {
      id: '3',
      name: '□□住宅新築案件',
      preview: '🏠',
      date: '2025-10-15',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#22C55E]/0 before:via-[#0EA5E9]/0 before:to-[#14B8A6]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#22C55E]/25 via-[#0EA5E9]/30 to-[#14B8A6]/35',
    },
  ]

  // モックデータ: クイックアクション（アイコンは絵文字のまま）
  const quickActions: QuickAction[] = [
    {
      id: 'new-project',
      label: '新規プロジェクト',
      icon: '➕',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#6366F1]/25 via-[#8B5CF6]/30 to-[#6366F1]/35',
    },
    {
      id: 'drawing',
      label: '作図開始',
      icon: '✏️',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#06B6D4]/0 before:via-[#22D3EE]/0 before:to-[#0EA5E9]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#06B6D4]/25 via-[#22D3EE]/30 to-[#0EA5E9]/35',
    },
    {
      id: 'estimate',
      label: '見積り作成',
      icon: '📄',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#8B5CF6]/0 before:via-[#A855F7]/0 before:to-[#C084FC]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#8B5CF6]/25 via-[#A855F7]/30 to-[#C084FC]/35',
    },
    {
      id: 'revenue',
      label: '売上確認',
      icon: '📈',
      overlayGradientClass:
        'before:bg-gradient-to-br before:from-[#22C55E]/0 before:via-[#10B981]/0 before:to-[#22C55E]/45',
      iconBackgroundClass: 'bg-gradient-to-br from-[#22C55E]/25 via-[#10B981]/30 to-[#22C55E]/35',
    },
  ]

  // モックデータ: 稼働中現場
  const activeSites: ActiveSite[] = [
    {
      id: '1',
      name: '〇〇マンション',
      location: '東京都渋谷区',
      progress: 75,
    },
    {
      id: '2',
      name: '△△ビル',
      location: '大阪府大阪市',
      progress: 45,
    },
    {
      id: '3',
      name: '□□住宅',
      location: '福岡県福岡市',
      progress: 90,
    },
  ]

  // モックデータ: 目標売上
  const targetRevenue = 10000000 // 1000万円
  const currentRevenue = 6500000 // 650万円
  const revenueProgress = (currentRevenue / targetRevenue) * 100

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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

    // AIの応答をシミュレート（実際のAI統合は今後実装）
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'ご質問ありがとうございます。足場設計に関するご相談ですね。詳細をお聞かせください。',
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">読み込み中...</p>
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
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {user?.email}
              </span>
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
          <div className="p-6 space-y-6">
            {/* プロジェクト統計セクション */}
            <ProjectStatsWidget />

            {/* 目標売上セクション */}
            <div className={`${glassPanelClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">目標売上</h2>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {currentRevenue.toLocaleString()}円 / {targetRevenue.toLocaleString()}円
                </span>
              </div>
              <div className="w-full bg-white/40 dark:bg-slate-800/50 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#8B5CF6] h-4 rounded-full transition-all duration-500"
                  style={{ width: `${revenueProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-medium text-right text-gray-700 dark:text-gray-200">
                {revenueProgress.toFixed(1)}% 達成
              </p>
            </div>

            {/* 直近3つのプロジェクト */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">直近のプロジェクト</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`${glassCardClass} cursor-pointer p-6 ${glassHoverOverlayBase} ${project.overlayGradientClass}`}
                  >
                    <div className="mb-4 flex justify-center">
                      <div className={`${iconWrapperBase} ${project.iconBackgroundClass}`}>
                        <span className="text-3xl drop-shadow-lg" role="img" aria-label={project.name}>
                          {project.preview}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2 text-center">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center">{project.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* クイックアクション */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">クイックアクション</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    className={`${glassCardClass} p-6 ${glassHoverOverlayBase} ${action.overlayGradientClass}`}
                    type="button"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`${iconWrapperBase} ${action.iconBackgroundClass}`}>
                        <span className="text-3xl" role="img" aria-label={action.label}>
                          {action.icon}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-slate-100">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 稼働中現場リスト */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">稼働中現場</h2>
              <div className={`${glassPanelClass} overflow-hidden`}>
                <table className="min-w-full divide-y divide-white/40 dark:divide-slate-800/60">
                  <thead className="bg-white/40 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">
                        現場名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">
                        場所
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">
                        進捗
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/30 dark:bg-slate-950/40 divide-y divide-white/40 dark:divide-slate-800/60">
                    {activeSites.map((site) => (
                      <tr
                        key={site.id}
                        className="transition-colors duration-200 hover:bg-white/55 dark:hover:bg-slate-900/60"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                            {site.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{site.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/40 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-[#10B981] via-[#22D3EE] to-[#6366F1] transition-all"
                                style={{ width: `${site.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 w-12 text-right">
                              {site.progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      </div>
    </div>
  )
}

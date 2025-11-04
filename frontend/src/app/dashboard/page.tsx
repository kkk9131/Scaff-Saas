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
import { BentoGrid, BentoCard } from '@/components/dashboard/BentoGrid'
import { Muted, GradientText, Eyebrow } from '@/components/ui'

// モックデータ型定義
// （削除）最近のプロジェクト・稼働中現場の型は不要になったため除去

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

  // ライト/ダークで見た目を切替（lightは白カード/ darkは白10%ガラス）
  const glassCardClass = isDark
    ? 'group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl'
    : 'group relative overflow-hidden rounded-2xl border border-white/30 bg-card backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl'
  const glassHoverOverlayBase =
    'before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100'
  const iconWrapperBase =
    'relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border dark:border-slate-700/50 backdrop-blur-xl shadow-md shadow-sky-500/20 dark:shadow-indigo-900/40'

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

  // （削除）最近のプロジェクト・稼働中現場・目標売上は非表示要件のためデータごと撤去

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
      className={`dashboard-scope relative min-h-screen overflow-hidden transition-colors duration-500 ${
        isDark ? 'aurora-bg text-white' : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
      }`}
    >
      {/* ライトモード時のみ、元のグラデ用グロー装飾を再表示 */}
      {!isDark && (
        <>
          <div className={`pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl bg-sky-300/40`} />
          <div className={`pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl bg-rose-200/40`} />
          <div className={`pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl bg-cyan-200/40`} />
        </>
      )}

      <div className="relative z-10">
        {/* ヘッダー */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
            isDark
              ? 'border border-white/10 bg-black/20 backdrop-blur-lg'
              : 'border border-white/30 bg-white/20 backdrop-blur-lg shadow-md shadow-sky-500/10'
          }`}
        >
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
                <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/30 bg-white/20 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                  <Image
                    src="/favicon.ico"
                    alt="ScaffAIのロゴ"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    priority
                  />
                </div>
                {/* ブランド見出しもカードと同じライトグレー/ダークは明色に揃える */}
                <h1 className="text-2xl font-bold text-card-foreground">ScaffAI</h1>
              </div>
            </div>

            {/* 右側: ユーザー情報 + チャットトグル */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] text-[#06B6D4] hover:bg-[#06B6D4]/15 dark:text-cyan-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10"
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
              {/* メールアドレスもライトグレー/ダークは明色に統一 */}
              <span className="text-sm text-card-foreground">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-card-foreground bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
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
            {/* タイトル行（GradientTextでかっこよく） */}
            <div className="mb-6">
              <GradientText as="h1" className="text-3xl md:text-4xl font-bold">
                ダッシュボード
              </GradientText>
              <Muted className="mt-1">最近のプロジェクトに素早くアクセスできます。</Muted>
            </div>

            {/* Bento Grid */}
            <BentoGrid>
              {/* クイックアクション（1列） */}
              <BentoCard
                className="force-white-card"
                header={(
                  <div>
                    <Eyebrow>Quick</Eyebrow>
                  </div>
                )}
              >
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <button key={action.id} className={`${glassCardClass} p-6 ${glassHoverOverlayBase} ${action.overlayGradientClass}`} type="button">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`${iconWrapperBase} ${action.iconBackgroundClass}`}>
                          <span className="text-3xl" role="img" aria-label={action.label}>{action.icon}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-slate-100">{action.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </BentoCard>

              {/* プロジェクト統計はMVPでは非表示（削除） */}
              {/* 最近のアクティビティ / 最近のプロジェクト / 稼働中現場 / 目標売上 はライト・ダークともに非表示 */}
            </BentoGrid>
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

'use client'

import * as React from 'react'
import Image from 'next/image'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatSidebar, type ChatMessage } from '@/components/layout/ChatSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * DashboardShellのプロパティ定義
 * ページごとに中身（children）だけを差し替えて、ヘッダー/サイドバー/チャットを共通化する。
 */
export interface DashboardShellProps {
  /** メイン領域に描画するページ固有のコンテンツ */
  children: React.ReactNode

  /** 右のAIチャットに渡すメッセージ履歴（任意） */
  chatMessages?: ChatMessage[]
  /** 右のAIチャットの送信ハンドラ（任意） */
  onSendChatMessage?: (message: string) => void
}

/**
 * ダッシュボード共通レイアウト
 * - 固定ヘッダー（トップバー）
 * - 左サイドバー（ナビゲーション）
 * - 右サイドバー（AIチャット）
 * - 背景の発光オブジェクト（ライト/ダークで出し分け）
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  chatMessages = [],
  onSendChatMessage,
}) => {
  const { isDark } = useTheme()
  const { user, signOut } = useAuth()

  // サイドバー開閉状態（共通）
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    // ルーティングは個々のページで行うためここでは行わない
  }

  return (
    <div
      className={`dashboard-scope relative min-h-screen overflow-hidden ${
        isDark ? 'aurora-bg text-white' : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
      }`}
    >
      {/* 背景の発光オブジェクト */}
      {isDark ? (
        <>
          <div className={`pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl bg-sky-500/40`} />
          <div className={`pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl bg-fuchsia-600/40`} />
          <div className={`pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl bg-indigo-700/40`} />
        </>
      ) : (
        <>
          <div className={`pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl bg-sky-300/40`} />
          <div className={`pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl bg-rose-200/40`} />
          <div className={`pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl bg-cyan-200/40`} />
        </>
      )}

      <div className="relative z-10">
        {/* ヘッダー（ダッシュボード準拠） */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
            isDark
              ? 'border border-white/10 bg-black/20 backdrop-blur-lg'
              : 'border border-white/30 bg-white/20 backdrop-blur-lg shadow-md shadow-sky-500/10'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4">
            {/* 左: サイドバートグル + ロゴ */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLeftSidebarOpen((v) => !v)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/10 backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-indigo-900/40">
                  <Image src="/favicon.ico" alt="ScaffAIのロゴ" width={32} height={32} className="h-8 w-8 object-contain" priority />
                </div>
                <h1 className="text-2xl font-bold text-card-foreground">ScaffAI</h1>
              </div>
            </div>

            {/* 右: チャットトグル + テーマ + ユーザー */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsRightSidebarOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] text-[#06B6D4] hover:bg-[#06B6D4]/15 dark:text-cyan-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10"
                aria-label="AIチャットを開閉"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="hidden md:inline font-medium">AIチャット</span>
              </button>
              <ThemeToggle />
              <span className="text-sm text-card-foreground">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-card-foreground bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </nav>

        {/* 左サイドバー */}
        <Sidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          onToggle={() => setIsLeftSidebarOpen((v) => !v)}
        />

        {/* メイン領域 */}
        <main
          className={`pt-16 transition-all duration-300 ${
            isLeftSidebarOpen ? 'md:ml-64' : 'md:ml-20'
          } ${isRightSidebarOpen ? 'md:mr-96' : 'md:mr-0'}`}
        >
          {children}
        </main>

        {/* 右サイドバー（AIチャット） */}
        <ChatSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          onToggle={() => setIsRightSidebarOpen((v) => !v)}
          messages={chatMessages}
          onSendMessage={onSendChatMessage}
        />
      </div>
    </div>
  )
}

export default DashboardShell


/**
 * ダッシュボードページ
 * ログイン後のメインページ - 3カラムレイアウト
 * 左サイドバー: ナビゲーション
 * 中央: ダッシュボードコンテンツ
 * 右サイドバー: AIチャット
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatSidebar, ChatMessage } from '@/components/layout/ChatSidebar'

// モックデータ型定義
interface Project {
  id: string
  name: string
  preview: string
  date: string
}

interface ActiveSite {
  id: string
  name: string
  location: string
  progress: number
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  // サイドバーの開閉状態管理
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)

  // チャットメッセージの状態管理
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // モックデータ: 直近3つのプロジェクト
  const recentProjects: Project[] = [
    {
      id: '1',
      name: '〇〇マンション建設プロジェクト',
      preview: '🏗️',
      date: '2025-10-20',
    },
    {
      id: '2',
      name: '△△ビル改修工事',
      preview: '🔧',
      date: '2025-10-18',
    },
    {
      id: '3',
      name: '□□住宅新築案件',
      preview: '🏠',
      date: '2025-10-15',
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
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b-2 border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 左側: サイドバートグル + ロゴ */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:bg-gray-100"
              aria-label="サイドバーを開閉"
            >
              <svg
                className="h-6 w-6 text-gray-700"
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
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ScaffAI</h1>
            </div>
          </div>

          {/* 右側: ユーザー情報 + チャットトグル */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-[#06B6D4]/10 text-[#06B6D4]"
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
            <span className="text-sm text-gray-700">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#6366F1] hover:bg-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-all"
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
          {/* 目標売上セクション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">目標売上</h2>
              <span className="text-sm text-gray-600">
                {currentRevenue.toLocaleString()}円 / {targetRevenue.toLocaleString()}円
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] h-4 rounded-full transition-all duration-500"
                style={{ width: `${revenueProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 text-right">
              {revenueProgress.toFixed(1)}% 達成
            </p>
          </div>

          {/* 直近3つのプロジェクト */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">直近のプロジェクト</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#06B6D4]"
                >
                  <div className="text-4xl mb-4 text-center">{project.preview}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-center">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 text-center">{project.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* クイックアクション */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-[#6366F1]">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#6366F1]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">新規プロジェクト</span>
                </div>
              </button>
              <button className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-[#06B6D4]">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#06B6D4]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">作図開始</span>
                </div>
              </button>
              <button className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-[#8B5CF6]">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#8B5CF6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">見積り作成</span>
                </div>
              </button>
              <button className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-[#10B981]">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#10B981]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">売上確認</span>
                </div>
              </button>
            </div>
          </div>

          {/* 稼働中現場リスト */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">稼働中現場</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      現場名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      進捗
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {site.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{site.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#10B981] h-2 rounded-full transition-all"
                              style={{ width: `${site.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
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
  )
}

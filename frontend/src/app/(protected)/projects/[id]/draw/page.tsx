/**
 * /projects/[id]/draw - プロジェクト紐付け作図ページ
 *
 * このページはプロジェクト詳細の「次のステップ」カードから遷移し、
 * 指定プロジェクトに紐づく作図（Konvaキャンバス）を行います。
 * - プロジェクト詳細情報を読み込み、ZustandのProjectStoreへセット
 * - 作図画面（Header/ModeTabs/CanvasStage/Sidebars/Underbar/数量パネル）を表示
 * - CanvasStage側の useDrawingSave が currentProject を参照して自動保存/復元を実行
 */

'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useProjectStore } from '@/stores/projectStore'
import { getProject } from '@/lib/api/projects'
import Header from '@/app/(protected)/draw/components/Header'
import ModeTabs from '@/app/(protected)/draw/components/ModeTabs'
import CanvasStage from '@/app/(protected)/draw/components/CanvasStage'
import Sidebars from '@/app/(protected)/draw/components/Sidebars'
import Underbar from '@/app/(protected)/draw/components/Underbar'
import DraggablePanel from '@/app/(protected)/draw/components/DraggablePanel'

/**
 * 作図ページコンポーネント（プロジェクトスコープ版）
 */
export default function ProjectScopedDrawPage() {
  // ルーター/パラメータ
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = React.useMemo(() => (Array.isArray(params?.id) ? params?.id?.[0] : params?.id), [params])

  // テーマ
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 認証
  const { loading: authLoading } = useAuth()

  // プロジェクトストア
  const { setCurrentProject } = useProjectStore()

  /**
   * プロジェクト取得
   * - 取得後、ZustandのProjectStoreにセット
   */
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project-draw', projectId],
    enabled: Boolean(projectId) && !authLoading,
    queryFn: async () => {
      if (!projectId) throw new Error('プロジェクトIDが見つかりませんでした')
      const response = await getProject(projectId)
      if (response.error) throw new Error(response.error.message ?? 'プロジェクトの取得に失敗しました')
      if (!response.data) throw new Error('プロジェクト情報が空でした')
      return response.data
    },
  })

  // プロジェクト反映
  React.useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
  }, [project, setCurrentProject])

  // ローディング表示
  if (authLoading || isLoading) {
    return (
      <main className="relative h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">プロジェクトを読み込み中...</p>
        </div>
      </main>
    )
  }

  // エラー時
  if (error || !project) {
    const msg = (error as Error)?.message ?? 'プロジェクトが見つかりませんでした'
    return (
      <main className="relative h-screen w-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl p-6 text-center">
          <h2 className="text-lg font-bold mb-2">読み込みエラー</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{msg}</p>
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm transition hover:bg-white/10 dark:hover:bg-slate-900/40"
            >
              プロジェクト一覧へ戻る
            </button>
          </div>
        </div>
      </main>
    )
  }

  // 作図UI（/draw と同じ構成）
  return (
    <main
      className={`relative h-screen w-screen overflow-hidden transition-colors duration-500 ${
        isDark ? 'aurora-bg' : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'
      }`}
    >
      {/* ライトモード時の装飾 */}
      {!isDark && (
        <>
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl bg-sky-300/40" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl bg-rose-200/40" />
          <div className="pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl bg-cyan-200/40" />
        </>
      )}

      <div className="relative z-10 h-full w-full">
        {/* ヘッダー/モードタブ/キャンバス/サイドバー/アンダーバー/数量表 */}
        <Header />
        <ModeTabs />
        <CanvasStage />
        <Sidebars />
        <Underbar />
        <DraggablePanel />
      </div>
    </main>
  )
}

/**
 * プロジェクト管理ページ（看板ボード型）
 *
 * プロジェクトをステータス別に表示する看板ボード形式のUI
 * 未着手・進行中・完了の3カラムレイアウト
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatSidebar, ChatMessage } from '@/components/layout/ChatSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectCreateModal } from '@/components/projects/ProjectCreateModal'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Project, ProjectStatus } from '@/types/project'
import { getProjects, deleteProject, duplicateProject, updateProjectStatus } from '@/lib/api/projects'
import Image from 'next/image'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SearchBar } from '@/app/(protected)/projects/components/SearchBar'
import {
  FilterPanel,
  type DateRange,
} from '@/app/(protected)/projects/components/FilterPanel'
import {
  SortDropdown,
  type ProjectSortKey,
} from '@/app/(protected)/projects/components/SortDropdown'
import {
  Search,
  Settings2,
  FlaskConical,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  FileText,
  Rocket,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * ドロップ可能なカラムコンポーネント
 */
interface DroppableColumnProps {
  id: ProjectStatus
  children: React.ReactNode
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className="h-full">
      {children}
    </div>
  )
}

/**
 * ドラッグ可能なプロジェクトカードコンポーネント
 */
interface SortableProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onDuplicate?: (project: Project) => void
}

function SortableProjectCard({ project, onEdit, onDelete, onDuplicate }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProjectCard
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragListeners={listeners}
      />
    </div>
  )
}

export default function ProjectsPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  const router = useRouter()

  // サイドバーの開閉状態管理
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // 検索・フィルター・ソート用の状態管理
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  })
  const [sortKey, setSortKey] = useState<ProjectSortKey>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // プロジェクトデータ管理
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  // ドラッグ&ドロップ管理
  const [activeId, setActiveId] = useState<string | null>(null)

  // プロジェクト作成モーダル管理
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // プロジェクト削除モーダル管理
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // プロジェクト複製モーダル管理
  const [duplicateTarget, setDuplicateTarget] = useState<Project | null>(null)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateLoading, setDuplicateLoading] = useState(false)

  // 通知表示
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 検索・フィルターパネルの開閉状態
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)

  // ドラッグ&ドロップセンサー設定（キーボードとマウス/タッチ対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * 通知を表示するユーティリティ
   */
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
  }

  useEffect(() => {
    if (!notification) return

    const timer = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(timer)
  }, [notification])

  // モックデータ（バックエンドエラー時に使用）
  const mockProjects: Project[] = [
    {
      id: 'mock-1',
      user_id: 'mock-user',
      name: '〇〇マンション建設プロジェクト',
      description: '5階建てマンションの足場設計',
      status: 'draft',
      customer_name: '山田建設株式会社',
      site_address: '東京都渋谷区道玄坂1-2-3',
      start_date: '2025-11-01',
      end_date: '2025-12-31',
      created_at: '2025-10-20T09:00:00Z',
      updated_at: '2025-10-23T15:30:00Z',
    },
    {
      id: 'mock-2',
      user_id: 'mock-user',
      name: '△△ビル改修工事',
      description: '外壁改修に伴う足場設計',
      status: 'active',
      customer_name: '田中工務店',
      site_address: '大阪府大阪市北区梅田2-5-10',
      start_date: '2025-10-15',
      end_date: '2025-11-30',
      created_at: '2025-10-15T10:00:00Z',
      updated_at: '2025-10-24T08:15:00Z',
    },
    {
      id: 'mock-3',
      user_id: 'mock-user',
      name: '□□住宅新築案件',
      description: '2階建て住宅の足場',
      status: 'active',
      customer_name: '佐藤建築',
      site_address: '福岡県福岡市博多区博多駅前3-1-1',
      start_date: '2025-10-10',
      end_date: '2025-11-20',
      created_at: '2025-10-10T14:00:00Z',
      updated_at: '2025-10-22T16:45:00Z',
    },
    {
      id: 'mock-4',
      user_id: 'mock-user',
      name: '◇◇商業施設建設',
      description: '大型商業施設の足場計画',
      status: 'active',
      customer_name: '鈴木組',
      site_address: '神奈川県横浜市西区みなとみらい4-3-1',
      start_date: '2025-09-01',
      end_date: '2026-03-31',
      created_at: '2025-09-01T09:00:00Z',
      updated_at: '2025-10-24T10:00:00Z',
    },
    {
      id: 'mock-5',
      user_id: 'mock-user',
      name: '☆☆倉庫増築プロジェクト',
      description: '既存倉庫の増築工事',
      status: 'completed',
      customer_name: '高橋建設',
      site_address: '愛知県名古屋市中区栄3-2-5',
      start_date: '2025-08-01',
      end_date: '2025-10-15',
      created_at: '2025-08-01T08:00:00Z',
      updated_at: '2025-10-16T17:00:00Z',
    },
    {
      id: 'mock-6',
      user_id: 'mock-user',
      name: '★★学校校舎改修',
      description: '小学校校舎の外壁改修',
      status: 'completed',
      customer_name: '伊藤工業',
      site_address: '京都府京都市左京区銀閣寺町2',
      start_date: '2025-07-01',
      end_date: '2025-09-30',
      created_at: '2025-07-01T09:00:00Z',
      updated_at: '2025-10-01T12:00:00Z',
    },
  ]

  // フィルター・検索・ソート適用後のプロジェクト一覧
  const filteredProjects = useMemo(() => {
    let baseList = [...projects]
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery.length > 0) {
      const fuseInstance = new Fuse(projects, {
        keys: [
          { name: 'name', weight: 0.45 },
          { name: 'description', weight: 0.2 },
          { name: 'customer_name', weight: 0.2 },
          { name: 'site_address', weight: 0.15 },
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 1,
      })
      baseList = fuseInstance.search(trimmedQuery).map((result) => result.item)
    }

    if (selectedStatuses.length > 0) {
      baseList = baseList.filter((project) => selectedStatuses.includes(project.status))
    }

    if (dateRange.startDate) {
      const filterStart = new Date(dateRange.startDate)
      baseList = baseList.filter((project) => {
        const target = project.start_date ?? project.created_at
        if (!target) return false
        const projectStart = new Date(target)
        return !Number.isNaN(projectStart.getTime()) && projectStart >= filterStart
      })
    }

    if (dateRange.endDate) {
      const filterEnd = new Date(dateRange.endDate)
      baseList = baseList.filter((project) => {
        const target = project.end_date ?? project.start_date ?? project.updated_at
        if (!target) return false
        const projectEnd = new Date(target)
        return !Number.isNaN(projectEnd.getTime()) && projectEnd <= filterEnd
      })
    }

    const sortedList = [...baseList].sort((a, b) => {
      switch (sortKey) {
        case 'name': {
          const comparison = a.name.localeCompare(b.name, 'ja')
          return sortOrder === 'asc' ? comparison : -comparison
        }
        case 'created_at': {
          const comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          return sortOrder === 'asc' ? comparison : -comparison
        }
        case 'updated_at':
        default: {
          const comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          return sortOrder === 'asc' ? comparison : -comparison
        }
      }
    })

    return sortedList
  }, [
    projects,
    searchQuery,
    selectedStatuses,
    dateRange.startDate,
    dateRange.endDate,
    sortKey,
    sortOrder,
  ])

  const totalProjectsCount = projects.length
  const filteredProjectsCount = filteredProjects.length
  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedStatuses.length > 0 ||
    Boolean(dateRange.startDate) ||
    Boolean(dateRange.endDate)

  // ステータス別にプロジェクトを分類（完了カラムにアーカイブ済みも含める）
  const projectsByStatus = useMemo(
    () => ({
      draft: filteredProjects.filter((project) => project.status === 'draft'),
      active: filteredProjects.filter((project) => project.status === 'active'),
      completed: filteredProjects.filter(
        (project) => project.status === 'completed' || project.status === 'archived'
      ),
    }),
    [filteredProjects]
  )

  const columns = useMemo<
    Array<{ status: ProjectStatus; label: string; Icon: LucideIcon; projects: Project[] }>
  >(
    () => [
      { status: 'draft', label: '未着手', Icon: FileText, projects: projectsByStatus.draft },
      { status: 'active', label: '進行中', Icon: Rocket, projects: projectsByStatus.active },
      {
        status: 'completed',
        label: '完了 / アーカイブ',
        Icon: CheckCircle2,
        projects: projectsByStatus.completed,
      },
    ],
    [projectsByStatus]
  )

  /**
   * 日付・ステータスフィルターを初期状態へ戻す
   */
  const handleFilterReset = () => {
    setSelectedStatuses([])
    setDateRange({ startDate: null, endDate: null })
  }

  // 背景グラデーションと発光装飾（ダッシュボードと統一）
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
   * プロジェクト一覧を取得
   */
  const fetchProjects = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getProjects(1, 100) // ページネーション未実装のため全件取得

      if (response.error) {
        // エラー時はモックデータを使用
        setProjects(mockProjects)
        setUseMockData(true)
        setError(`${response.error.message} (モックデータを表示中)`)
        return
      }

      if (response.data) {
        setProjects(response.data.projects)
        setUseMockData(false)
      }
    } catch (err) {
      // 例外発生時もモックデータを使用
      setProjects(mockProjects)
      setUseMockData(true)
      setError('バックエンドに接続できません (モックデータを表示中)')
    } finally {
      setLoading(false)
    }
  }

  /**
   * プロジェクト削除モーダルを開く
   */
  const handleRequestDelete = (project: Project) => {
    setDeleteTarget(project)
    setIsDeleteModalOpen(true)
  }

  /**
   * 削除モーダルを閉じる
   */
  const handleDeleteModalClose = () => {
    if (deleteLoading) return
    setIsDeleteModalOpen(false)
    setDeleteTarget(null)
  }

  /**
   * 削除を実行
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeleteLoading(true)

    try {
      const response = await deleteProject(deleteTarget.id)

      if (response.error) {
        showNotification('error', `削除に失敗しました: ${response.error.message}`)
        return
      }

      setProjects((projects || []).filter((p) => p.id !== deleteTarget.id))
      showNotification('success', `「${deleteTarget.name}」を削除しました`)
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      showNotification('error', 'プロジェクトの削除に失敗しました')
    } finally {
      setDeleteLoading(false)
    }
  }

  /**
   * プロジェクト複製モーダルを開く
   */
  const handleRequestDuplicate = (project: Project) => {
    setDuplicateTarget(project)
    setDuplicateName(`${project.name}のコピー`)
    setIsDuplicateModalOpen(true)
  }

  /**
   * 複製モーダルを閉じる
   */
  const handleDuplicateModalClose = () => {
    if (duplicateLoading) return
    setIsDuplicateModalOpen(false)
    setDuplicateTarget(null)
    setDuplicateName('')
  }

  /**
   * 複製を実行
   */
  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget) {
      return
    }

    const trimmedName = duplicateName.trim()
    if (!trimmedName) {
      showNotification('error', '複製後のプロジェクト名を入力してください')
      return
    }

    setDuplicateLoading(true)

    try {
      const response = await duplicateProject(duplicateTarget.id, { new_name: trimmedName })

      if (response.error) {
        showNotification('error', `複製に失敗しました: ${response.error.message}`)
        return
      }

      if (response.data) {
        setProjects([response.data, ...(projects || [])])
        showNotification('success', `「${duplicateTarget.name}」を複製しました`)
        setIsDuplicateModalOpen(false)
        setDuplicateTarget(null)
        setDuplicateName('')
      }
    } catch (err) {
      showNotification('error', 'プロジェクトの複製に失敗しました')
    } finally {
      setDuplicateLoading(false)
    }
  }

  /**
   * プロジェクト編集処理（詳細画面へ遷移）
   */
  const handleEdit = (project: Project) => {
    router.push(`/projects/${project.id}`)
  }

  /**
   * プロジェクト作成成功時のコールバック
   */
  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...(projects || [])])
    showNotification('success', `「${newProject.name}」を作成しました`)
  }

  /**
   * ドラッグ開始ハンドラー
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  /**
   * ドラッグ終了ハンドラー
   * プロジェクトのステータスを更新
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeProject = (projects || []).find((p) => p.id === active.id)
    if (!activeProject) return

    // ドロップ先がカラム（ステータス）かプロジェクトかを判定
    let targetStatus: ProjectStatus | null = null

    // まずドロップ先がステータスかチェック
    if (['draft', 'active', 'completed'].includes(over.id as string)) {
      targetStatus = over.id as ProjectStatus
    } else {
      // プロジェクト上にドロップした場合、そのプロジェクトのステータスを取得
      const overProject = (projects || []).find((p) => p.id === over.id)
      if (overProject) {
        targetStatus = overProject.status
      }
    }

    // ステータスが変わらない場合は何もしない
    if (!targetStatus || activeProject.status === targetStatus) {
      return
    }

    // モックモードの場合はローカルのみ更新
    if (useMockData) {
      setProjects(
        (projects || []).map((p) =>
          p.id === activeProject.id ? { ...p, status: targetStatus! } : p
        )
      )
      return
    }

    // バックエンドAPIでステータス更新
    const response = await updateProjectStatus(activeProject.id, targetStatus)

    if (response.error) {
      showNotification('error', `ステータス更新に失敗しました: ${response.error.message}`)
      return
    }

    if (response.data) {
      setProjects(
        (projects || []).map((p) =>
          p.id === activeProject.id ? response.data : p
        )
      )
      showNotification('success', `「${activeProject.name}」のステータスを更新しました`)
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
        content: 'プロジェクト管理に関するご質問ですね。どのようにお手伝いできますか？',
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

  // 初回マウント時にプロジェクトを取得
  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects()
    }
  }, [authLoading, user])

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
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {useMockData && (
                    <span className="flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 transition-colors dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                      モックモード
                    </span>
                  )}
                  {isFilterActive && (
                    <span className="flex items-center gap-1 rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 transition-colors dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                      <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                      フィルター適用中
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  プロジェクトボード
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  絞り込み結果 {filteredProjectsCount} 件 / 全 {totalProjectsCount} 件
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  iconLeft={<Search className="h-5 w-5" aria-hidden="true" />}
                  onClick={() => setIsSearchPanelOpen((prev) => !prev)}
                  className={`rounded-2xl transition-all duration-300 ${
                    isSearchPanelOpen
                      ? 'border-transparent bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 hover:shadow-sky-500/40 dark:shadow-indigo-900/50'
                      : 'text-slate-700 hover:border-[#06B6D4] hover:bg-[#06B6D4]/10 hover:text-[#06B6D4] dark:text-slate-100 dark:hover:bg-[#06B6D4]/20 dark:hover:text-[#06B6D4]'
                  }`}
                >
                  {isSearchPanelOpen ? '検索ツールを隠す' : '検索ツールを表示'}
                  {isFilterActive && !isSearchPanelOpen && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#06B6D4]/20 px-2 text-xs font-semibold text-[#06B6D4] dark:bg-[#06B6D4]/30">
                      ON
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  iconLeft={<Plus className="h-5 w-5" aria-hidden="true" />}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-2xl bg-gradient-to-r from-[#06B6D4] to-[#6366F1] text-white shadow-lg shadow-sky-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sky-500/40 dark:shadow-indigo-900/50"
                >
                  新規プロジェクト
                </Button>
              </div>
            </div>

            {isSearchPanelOpen && (
              <>
                <div className="mb-6 grid gap-6 lg:grid-cols-3">
                  <SearchBar
                    className="lg:col-span-2"
                    value={searchQuery}
                    onChange={(value) => setSearchQuery(value)}
                    onClear={() => setSearchQuery('')}
                  />
                  <SortDropdown
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onSortKeyChange={(key) => setSortKey(key)}
                    onSortOrderChange={(order) => setSortOrder(order)}
                  />
                </div>

                <FilterPanel
                  selectedStatuses={selectedStatuses}
                  onSelectedStatusesChange={(statuses) => setSelectedStatuses(statuses)}
                  dateRange={dateRange}
                  onDateRangeChange={(range) => setDateRange(range)}
                  onReset={handleFilterReset}
                  className="mb-8"
                />
              </>
            )}

            {/* エラー/警告表示 */}
            {error && (
              <div className={`mb-6 p-4 rounded-xl border ${
                useMockData
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  {useMockData ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                  )}
                  <span>{error}</span>
                </div>
              </div>
            )}

            {notification && (
              <div
                className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200'
                    : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {notification.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                    )}
                    <span>{notification.message}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                    onClick={() => setNotification(null)}
                    aria-label="通知を閉じる"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* 看板ボード（ドラッグ&ドロップ対応） */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {columns.map((column) => (
                  <DroppableColumn key={column.status} id={column.status}>
                    <SortableContext
                      id={column.status}
                      items={column.projects.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className={glassPanelClass}>
                        {/* カラムヘッダー */}
                        <div className="px-4 py-3 border-b border-white/30 dark:border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-sky-600 shadow-sm shadow-sky-500/10 dark:bg-slate-900/70 dark:text-sky-300 dark:shadow-indigo-900/40">
                                <column.Icon className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <h3 className="font-bold text-gray-900 dark:text-slate-100">{column.label}</h3>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300">
                              {column.projects.length}件
                            </span>
                          </div>
                        </div>

                        {/* プロジェクトカード一覧（ドラッグ可能） */}
                        <div className="p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                          {column.projects.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              該当するプロジェクトがありません
                            </div>
                          ) : (
                            column.projects.map((project) => (
                              <SortableProjectCard
                                key={project.id}
                                project={project}
                                onEdit={handleEdit}
                                onDelete={handleRequestDelete}
                                onDuplicate={handleRequestDuplicate}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                ))}
              </div>

              {/* ドラッグ中のオーバーレイ */}
              <DragOverlay>
                {activeId && (projects || []).find((p) => p.id === activeId) ? (
                  <ProjectCard
                    project={(projects || []).find((p) => p.id === activeId)!}
                    onEdit={handleEdit}
                    onDelete={handleRequestDelete}
                    onDuplicate={handleRequestDuplicate}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
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

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteModalClose}
          onConfirm={handleConfirmDelete}
          title="プロジェクトを削除"
          description={deleteTarget ? `「${deleteTarget.name}」を削除します。この操作は取り消せません。` : '選択されたプロジェクトを削除します。'}
          confirmText="削除する"
          cancelText="キャンセル"
          variant="destructive"
          isLoading={deleteLoading}
        />

        <Modal
          isOpen={isDuplicateModalOpen}
          onClose={handleDuplicateModalClose}
          title="プロジェクトを複製"
          description={duplicateTarget ? `「${duplicateTarget.name}」を基に新しいプロジェクトを作成します。` : 'プロジェクトを複製します。'}
          size="md"
          closeOnOverlayClick={!duplicateLoading}
          closeOnEsc={!duplicateLoading}
          footer={(
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleDuplicateModalClose}
                disabled={duplicateLoading}
              >
                キャンセル
              </Button>
              <Button
                variant="secondary"
                onClick={handleConfirmDuplicate}
                isLoading={duplicateLoading}
              >
                複製する
              </Button>
            </div>
          )}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              複製後のプロジェクト名を入力してください。
            </p>
            <Input
              label="複製後のプロジェクト名"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="例: プロジェクト名のコピー"
              disabled={duplicateLoading}
              fullWidth
            />
          </div>
        </Modal>

        {/* プロジェクト作成モーダル */}
        <ProjectCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      </div>
    </div>
  )
}

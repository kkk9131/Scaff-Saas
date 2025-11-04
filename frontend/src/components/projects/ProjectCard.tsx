/**
 * プロジェクトカードコンポーネント
 *
 * 看板ボードで使用するプロジェクトカード
 */

'use client'

import { Project } from '@/types/project'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Copy, Trash2, User, MapPin, Calendar, GripVertical } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  onDuplicate?: (project: Project) => void
  dragListeners?: DraggableSyntheticListeners // ドラッグ&ドロップのリスナー
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onDuplicate,
  dragListeners,
}: ProjectCardProps) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)

  // 日付フォーマット関数
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '未設定'
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 住所を短縮表示する関数
  const truncateAddress = (address?: string | null, maxLength: number = 30) => {
    if (!address) return '未設定'
    if (address.length <= maxLength) return address
    return `${address.substring(0, maxLength)}...`
  }

  // カードクリック時の処理（詳細画面へ遷移）
  const handleCardClick = () => {
    router.push(`/projects/${project.id}`)
  }

  // アクション実行時はバブリングを停止
  const handleActionClick = (
    e: React.MouseEvent,
    action: () => void
  ) => {
    e.stopPropagation()
    action()
  }

  return (
    <div
      className="project-card group relative overflow-hidden rounded-xl border border-white/30 dark:border-slate-700/60 bg-white dark:bg-slate-950/60 shadow-md shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/20 dark:hover:shadow-indigo-900/40 text-black dark:text-slate-100"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* ホバー時のグラデーションオーバーレイ */}
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-[#06B6D4]/0 via-[#6366F1]/0 to-[#8B5CF6]/20" />

      {/* カード全体のレイアウト: ドラッグハンドル + コンテンツ */}
      <div className="relative flex items-stretch">
        {/* ドラッグハンドル（左端） */}
        <div
          className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-white/80 transition-colors dark:hover:bg-slate-800/50"
          {...dragListeners}
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-600" />
        </div>

        {/* カードコンテンツ（クリック可能） */}
        <div className="flex-1 p-4 space-y-3 cursor-pointer" onClick={handleCardClick}>
        {/* ヘッダー: プロジェクト名とステータス */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-black dark:text-slate-100 text-sm leading-tight flex-1">
            {project.name}
          </h3>
          <ProjectStatusBadge status={project.status} showIcon={false} className="flex-shrink-0" />
        </div>

        {/* 顧客名 */}
        {project.customer_name && (
          <div className="flex items-center gap-2 text-xs">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{project.customer_name}</span>
          </div>
        )}

        {/* 現場住所 */}
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{truncateAddress(project.site_address)}</span>
        </div>

        {/* 期間 */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {formatDate(project.start_date)} 〜 {formatDate(project.end_date)}
          </span>
        </div>

        {/* 最終更新日 */}
        <div className="text-xs text-black dark:text-gray-400 pt-2 border-t border-white/30 dark:border-slate-700/50">
          更新: {formatDate(project.updated_at)}
        </div>

        {/* クイックアクション（ホバー時表示） */}
        {showActions && (
          <div
            className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-1 shadow-lg z-10"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* 編集ボタン */}
            {onEdit && (
              <button
                onClick={(e) => handleActionClick(e, () => onEdit(project))}
                className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-600 dark:text-blue-400"
                title="編集"
                aria-label="プロジェクトを編集"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {/* 複製ボタン */}
            {onDuplicate && (
              <button
                onClick={(e) => handleActionClick(e, () => onDuplicate(project))}
                className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-600 dark:text-green-400"
                title="複製"
                aria-label="プロジェクトを複製"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            {/* 削除ボタン */}
            {onDelete && (
              <button
                onClick={(e) => handleActionClick(e, () => onDelete(project.id))}
                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                title="削除"
                aria-label="プロジェクトを削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

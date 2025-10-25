/**
 * プロジェクトステータスバッジコンポーネント
 *
 * プロジェクトのステータスを視覚的に表示するバッジ
 */

import {
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ICONS,
  PROJECT_STATUS_COLORS,
} from '@/types/project'

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  showIcon?: boolean
  className?: string
}

export function ProjectStatusBadge({
  status,
  showIcon = true,
  className = '',
}: ProjectStatusBadgeProps) {
  // statusが不正な値またはundefinedの場合、デフォルトで'draft'を使用
  const validStatus = status && (status in PROJECT_STATUS_LABELS) ? status : 'draft'

  const label = PROJECT_STATUS_LABELS[validStatus]
  const icon = PROJECT_STATUS_ICONS[validStatus]
  const colors = PROJECT_STATUS_COLORS[validStatus]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        border transition-colors duration-200
        ${colors.bg} ${colors.text} ${colors.border}
        ${className}
      `}
    >
      {showIcon && <span role="img" aria-label={label}>{icon}</span>}
      <span>{label}</span>
    </span>
  )
}

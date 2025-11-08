/**
 * プロジェクト作成モーダルコンポーネント
 *
 * 新規プロジェクトを作成するためのモーダルダイアログ
 */

'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from './ProjectForm'
import { Project, ProjectCreateRequest } from '@/types/project'
import { createProject } from '@/lib/api/projects'
import { useTheme } from '@/contexts/ThemeContext'
import { XCircle } from 'lucide-react'

/**
 * プロジェクト作成モーダルのプロパティ
 */
interface ProjectCreateModalProps {
  /**
   * モーダルが開いているか
   */
  isOpen: boolean

  /**
   * モーダルを閉じる処理
   */
  onClose: () => void

  /**
   * プロジェクト作成成功時のコールバック
   * 作成されたプロジェクトを引数として受け取る
   */
  onSuccess?: (project: Project) => void
}

/**
 * プロジェクト作成モーダルコンポーネント
 */
export function ProjectCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: ProjectCreateModalProps) {
  const { isDark } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * ライトテーマ限定で適用する装飾クラスをメモ化
   * ダークテーマは既存デザインを崩さないように空文字を返す
   * ライトモード時は他のカード同様に白で統一
   */
  const lightModeEnhancements = useMemo(() => {
    if (isDark) {
      return {
        modal: undefined,
        header: undefined,
        content: undefined,
      }
    }

    return {
      modal: 'project-create-modal !bg-white border-white/80 shadow-[0_24px_48px_-20px_rgba(8,145,178,0.35)] backdrop-blur-xl',
      header: '!bg-white border-white/70 shadow-sm shadow-[0_6px_18px_rgba(14,165,233,0.18)] rounded-t-xl',
      content: '!bg-white',
    }
  }, [isDark])

  /**
   * プロジェクト作成処理
   */
  const handleSubmit = async (data: ProjectCreateRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await createProject(data)

      if (response.error) {
        setError(response.error.message)
        return
      }

      if (response.data) {
        // 成功時の処理（正規化済みデータをそのまま利用）
        onSuccess?.(response.data)
        onClose()
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('プロジェクト作成エラー:', err)
      }
      setError('プロジェクトの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * モーダルを閉じる処理
   */
  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }

  // ライトテーマでは視認性UP用クラスを渡し、ダークテーマは従来スタイルを維持する
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="新規プロジェクト作成"
      description="プロジェクトの基本情報を入力してください"
      size="lg"
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
      className={lightModeEnhancements.modal}
      headerClassName={lightModeEnhancements.header}
      contentClassName={lightModeEnhancements.content}
    >
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* プロジェクト作成フォーム */}
      <ProjectForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  )
}

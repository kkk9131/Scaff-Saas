/**
 * プロジェクト作成・編集フォームコンポーネント
 *
 * プロジェクトの情報を入力するフォーム
 */

'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Project, ProjectCreateRequest, ProjectUpdateRequest, ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_ICONS } from '@/types/project'

/**
 * フォームのプロパティ型定義
 */
interface ProjectFormProps {
  /**
   * 編集モードかどうか（既存プロジェクトの編集の場合）
   */
  isEdit?: boolean

  /**
   * 編集対象のプロジェクト（編集モードの場合）
   */
  project?: Project

  /**
   * フォーム送信時の処理
   */
  onSubmit: (data: ProjectCreateRequest | ProjectUpdateRequest) => Promise<void>

  /**
   * キャンセル時の処理
   */
  onCancel?: () => void

  /**
   * 送信中かどうか
   */
  isLoading?: boolean
}

/**
 * プロジェクトフォームコンポーネント
 */
export function ProjectForm({
  isEdit = false,
  project,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProjectFormProps) {
  // フォーム状態管理
  const [formData, setFormData] = useState<ProjectCreateRequest>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'draft',
    customer_name: project?.customer_name || '',
    site_address: project?.site_address || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
  })

  // バリデーションエラー
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * 入力値変更ハンドラー
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  /**
   * フォームバリデーション
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // プロジェクト名は必須
    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名を入力してください'
    }

    // 日付の整合性チェック
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (start > end) {
        newErrors.end_date = '終了日は開始日より後にしてください'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // バリデーション
    if (!validate()) {
      return
    }

    // 空文字列をnullに変換
    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    ) as ProjectCreateRequest

    await onSubmit(sanitizedData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* プロジェクト名（必須） */}
      <Input
        name="name"
        label="プロジェクト名"
        placeholder="例: 〇〇マンション建設プロジェクト"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isLoading}
        required
        fullWidth
      />

      {/* プロジェクト説明 */}
      <Textarea
        name="description"
        label="プロジェクト説明"
        placeholder="プロジェクトの詳細を入力してください"
        value={formData.description || ''}
        onChange={handleChange}
        error={errors.description}
        disabled={isLoading}
        rows={4}
        fullWidth
      />

      {/* 顧客名 */}
      <Input
        name="customer_name"
        label="顧客名"
        placeholder="例: 山田建設株式会社"
        value={formData.customer_name || ''}
        onChange={handleChange}
        error={errors.customer_name}
        disabled={isLoading}
        fullWidth
      />

      {/* 現場住所 */}
      <Input
        name="site_address"
        label="現場住所"
        placeholder="例: 東京都渋谷区道玄坂1-2-3"
        value={formData.site_address || ''}
        onChange={handleChange}
        error={errors.site_address}
        disabled={isLoading}
        fullWidth
      />

      {/* 日付範囲 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="start_date"
          label="開始日"
          type="date"
          value={formData.start_date || ''}
          onChange={handleChange}
          error={errors.start_date}
          disabled={isLoading}
          fullWidth
        />
        <Input
          name="end_date"
          label="終了日"
          type="date"
          value={formData.end_date || ''}
          onChange={handleChange}
          error={errors.end_date}
          disabled={isLoading}
          fullWidth
        />
      </div>

      {/* ステータス */}
      <div className="flex flex-col gap-2 w-full">
        <label
          htmlFor="status"
          className="text-sm font-medium text-foreground"
        >
          ステータス
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          disabled={isLoading}
          className="flex h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-base text-slate-900 shadow-[0_8px_26px_-18px_rgba(14,165,233,0.45)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-sky-400 hover:border-sky-300 hover:shadow-[0_10px_30px_-18px_rgba(14,165,233,0.5)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-[0_12px_32px_-22px_rgba(15,23,42,0.8)] dark:hover:border-slate-500 dark:hover:shadow-[0_12px_36px_-22px_rgba(15,23,42,0.85)] dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900 dark:focus-visible:border-slate-400"
        >
          {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {PROJECT_STATUS_ICONS[value as ProjectStatus]} {label}
            </option>
          ))}
        </select>
      </div>

      {/* フォームアクション */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          // ライトテーマでも視認性が落ちないようキャンセルボタンに白背景と濃い文字色を付与
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-white !text-slate-900 !border-slate-400 shadow-[0_8px_24px_-12px_rgba(14,165,233,0.25)] hover:bg-sky-50 hover:!text-sky-700 hover:!border-sky-400 dark:bg-transparent dark:!text-gray-100 dark:!border-gray-600 dark:hover:bg-[#06B6D4]/20"
          >
            キャンセル
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          isLoading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-[#6366F1] via-[#06B6D4] to-[#3B82F6] !text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.55)] hover:from-[#4F46E5] hover:via-[#0EA5E9] hover:to-[#2563EB] dark:bg-[#7C3AED] dark:hover:bg-[#8B5CF6]"
        >
          {isEdit ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  )
}

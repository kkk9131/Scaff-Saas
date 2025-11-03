/**
 * useDrawingSave.ts
 * 作図データの保存・自動保存・読込を担うReactフック
 *
 * 仕様（TASK-309）:
 * - 保存/読込は Supabase JSON を使用（バックエンド経由）
 * - 差分自動保存（10秒 または 10アクション毎）
 * - プロジェクト単位でのバージョン/紐付け
 *
 * 実装メモ:
 * - 保存対象のJSONは store の exportToJSON() をベースにする（Konva Stage直列化と同等情報を包含）
 * - 読込時は store の importFromJSON() で状態を復元
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDrawingStore } from '@/stores/drawingStore'
import { useProjectStore } from '@/stores/projectStore'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseDrawingSaveOptions {
  /** 自動保存の間隔（ミリ秒） */
  intervalMs?: number
  /** アクション回数のしきい値（履歴インデックスの変化回数） */
  actionThreshold?: number
}

/**
 * バックエンドAPIのベースURLを解決
 * - NEXT_PUBLIC_API_URL（推奨）
 * - NEXT_PUBLIC_API_BASE_URL（互換）
 * - 未設定時は空文字（同一オリジン相対パスを想定）
 */
function resolveApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env as any).NEXT_PUBLIC_API_BASE_URL ||
    ''
  )
}

/**
 * 作図データの保存・自動保存・読込を行うフック
 * - Drawページ/CanvasStageで呼び出して使用
 */
export function useDrawingSave(options: UseDrawingSaveOptions = {}) {
  const { intervalMs = 10_000, actionThreshold = 10 } = options
  const { currentProject } = useProjectStore()
  const exportToJSON = useDrawingStore((s) => s.exportToJSON)
  const importFromJSON = useDrawingStore((s) => s.importFromJSON)
  const historyIndex = useDrawingStore((s) => s.historyIndex)

  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // 直近保存したJSONの内容（差分検出用）
  const lastSavedRef = useRef<string>('')
  // 未保存フラグ
  const dirtyRef = useRef<boolean>(false)
  // 履歴アクションカウント
  const actionCountRef = useRef<number>(0)
  // タイマーID
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const apiBase = useMemo(() => resolveApiBase(), [])

  /**
   * 最新の作図JSONを取得し、差分があるか判定
   */
  const getCurrentJsonString = useCallback(() => {
    try {
      return exportToJSON()
    } catch (e) {
      console.error('作図JSONの生成に失敗しました', e)
      return ''
    }
  }, [exportToJSON])

  /**
   * 直ちに保存する
   */
  const saveNow = useCallback(async () => {
    if (!currentProject?.id) return
    const jsonStr = getCurrentJsonString()
    if (!jsonStr) return

    // 差分が無ければスキップ
    if (jsonStr === lastSavedRef.current) {
      dirtyRef.current = false
      actionCountRef.current = 0
      return
    }

    setStatus('saving')
    setError(null)

    try {
      const design_json = JSON.parse(jsonStr)
      const resp = await fetch(`${apiBase}/api/drawings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ project_id: currentProject.id, design_json }),
      })

      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(t || `HTTP ${resp.status}`)
      }

      // 保存成功: 既存差分をクリア
      lastSavedRef.current = jsonStr
      dirtyRef.current = false
      actionCountRef.current = 0
      setStatus('saved')
    } catch (e: any) {
      console.error('自動保存に失敗しました', e)
      setError(e?.message ?? '自動保存に失敗しました')
      setStatus('error')
    }
  }, [apiBase, currentProject?.id, getCurrentJsonString])

  /**
   * 初回ロード時に最新データを復元
   */
  const loadLatest = useCallback(async () => {
    if (!currentProject?.id) return
    try {
      const resp = await fetch(`${apiBase}/api/drawings/${currentProject.id}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (resp.status === 404) {
        // まだ保存データが無い
        return
      }
      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(t || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      if (data?.design_json) {
        importFromJSON(data.design_json)
        // 復元直後は現在状態を基準として保存済みに揃える
        const cur = getCurrentJsonString()
        lastSavedRef.current = cur
        dirtyRef.current = false
        actionCountRef.current = 0
      }
    } catch (e) {
      console.error('作図データの読込に失敗しました', e)
      // エラーはユーザー操作を妨げない
    }
  }, [apiBase, currentProject?.id, getCurrentJsonString, importFromJSON])

  // 初期ロード
  useEffect(() => {
    void loadLatest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id])

  // 履歴インデックスの変化を監視してアクション回数を数える
  useEffect(() => {
    if (!currentProject?.id) return
    // 履歴が進んだ＝状態変化があったとみなす
    actionCountRef.current += 1
    dirtyRef.current = true

    if (actionCountRef.current >= actionThreshold) {
      void saveNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, currentProject?.id])

  // タイマーで一定間隔ごとに保存（差分ありの時のみ）
  useEffect(() => {
    if (!currentProject?.id) return
    timerRef.current = setInterval(() => {
      if (dirtyRef.current) {
        void saveNow()
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [currentProject?.id, intervalMs, saveNow])

  return {
    status,
    error,
    saveNow,
  }
}

export default useDrawingSave


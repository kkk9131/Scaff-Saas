/**
 * Header.tsx
 * 作図画面のヘッダーコンポーネント
 *
 * 機能:
 * - ダッシュボードと同じ透過スタイルのヘッダー
 * - ステータスバーの表示/非表示トグル
 * - ライト/ダークモード切り替え
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Save, Eye, EyeOff, Sun, Moon, RotateCcw, FileJson, Upload, Image as ImageIcon, FileText, Plus } from 'lucide-react';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import type { Project } from '@/types/project';
import { getProjects } from '@/lib/api/projects';
import { saveDrawing } from '@/lib/api/drawings';
import { ProjectCreateModal } from '@/components/projects/ProjectCreateModal';
import Image from 'next/image';

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

/**
 * Headerコンポーネント
 * 作図画面上部のナビゲーションとコントロール
 */
export default function Header() {
  const router = useRouter();
  const { underbarVisible, toggleUnderbar, undo, redo, resetDrawing, exportToJSON, scaffoldGroups, memos } = useDrawingStore();
  const { theme, toggleTheme } = useTheme();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  // 追加: プロジェクト保存モーダル状態
  const [isProjectSaveOpen, setIsProjectSaveOpen] = useState(false);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSavingToProject, setIsSavingToProject] = useState(false);
  // PNGプレビュー用の状態
  const [isPngPreviewOpen, setIsPngPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const { currentProject } = useProjectStore();
  const isDark = theme === 'dark';
  // JSONインポート用のinput参照
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // 見積もり作成用のプロジェクト選択モーダル
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [estimateProjects, setEstimateProjects] = useState<Project[]>([]);
  const [estimateProjectsLoading, setEstimateProjectsLoading] = useState(false);
  // プロジェクト作成モーダル状態
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const tooltipCls = `pointer-events-none absolute left-full top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
    isDark ? 'border-slate-700 bg-black text-white' : 'border-slate-300 bg-white text-black'
  }`;

  // リセット確認処理
  const handleResetConfirm = () => {
    resetDrawing();
    setIsResetModalOpen(false);
  };

  // 保存モーダルを開く
  const handleSaveClick = useCallback(() => {
    setIsSaveModalOpen(true);
  }, []);

  // JSON保存処理
  const handleSaveJSON = useCallback(() => {
    try {
      const jsonData = exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scaffold-drawing-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  }, [exportToJSON]);

  // PNGプレビューを開く: StageからPNGを生成してプレビュー表示
  const handleOpenPngPreview = useCallback(async () => {
    try {
      // 保存モーダルを閉じる
      setIsSaveModalOpen(false);

      const { exportStageToDataURL } = await import('@/lib/canvasStageExporter');

      const url = await exportStageToDataURL({
        pixelRatio: 2,
        whiteBg: true,
        hideGrid: true,
        scaffoldGroups: scaffoldGroups, // 柱情報とアンチ枚数を描画するために渡す
        memos: memos // メモを描画するために渡す
      });

      if (!url) {
        console.error('【Header】❌ URLが空です');
        return;
      }

      if (typeof url !== 'string' || !url.startsWith('data:image')) {
        console.error('【Header】❌ URLの形式が不正です:', url?.substring(0, 100));
        alert('エラー: 生成されたPNGデータが不正です');
        return;
      }

      setPreviewImageUrl(url);
      setIsPngPreviewOpen(true);
    } catch (error: unknown) {
      const err = toError(error);
      console.error('【Header】❌ PNG生成エラー:', err);
      console.error('エラー詳細:', {
        message: err.message,
        stack: err.stack,
      });
      alert(`PNG生成に失敗しました: ${err.message}`);
    }
  }, [scaffoldGroups, memos]);

  // PNG保存を確定: プレビュー画像をダウンロード
  const handleConfirmSavePNG = useCallback(() => {
    if (!previewImageUrl) return;
    try {
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = previewImageUrl;
      a.download = `scaffold-drawing-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsPngPreviewOpen(false);
      setPreviewImageUrl(null);
    } catch (error: unknown) {
      const err = toError(error);
      console.error('PNG保存エラー:', err);
      alert('PNG保存に失敗しました');
    }
  }, [previewImageUrl]);

  // PNGプレビューをキャンセル
  const handleCancelPngPreview = useCallback(() => {
    setIsPngPreviewOpen(false);
    setPreviewImageUrl(null);
  }, []);

  /**
   * JSONインポート: ファイル選択ダイアログを開く
   */
  const handleImportClick = useCallback(() => {
    const el = fileInputRef.current;
    if (!el) return;
    el.value = '';
    el.click();
  }, []);

  /**
   * JSONインポート: ファイル読み取り→ストアへ反映
   */
  const handleImportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        const text = await file.text();
        // importFromJSON は exportToJSON 形式と互換
        // 失敗時は例外→catchで通知
        useDrawingStore.getState().importFromJSON(text);
        alert('JSONを読み込みました。');
      } catch (error: unknown) {
        const err = toError(error);
        console.error('JSONインポート失敗:', err);
        alert('JSONの読み込みに失敗しました。ファイル形式をご確認ください。');
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  /**
   * 見積もり作成ボタンのクリック処理
   */
  const handleEstimateClick = useCallback(() => {
    if (currentProject?.id) {
      // プロジェクトIDがある場合は直接見積もりページへ遷移
      router.push(`/projects/${currentProject.id}/estimate`);
    } else {
      // プロジェクトIDがない場合はプロジェクト選択モーダルを表示
      setIsEstimateModalOpen(true);
      setEstimateProjectsLoading(true);
      getProjects(1, 100)
        .then((response) => {
          if (response.data) {
            setEstimateProjects(response.data.projects);
          } else {
            setEstimateProjects([]);
          }
        })
        .catch((error) => {
          console.error('プロジェクト取得エラー:', error);
          setEstimateProjects([]);
        })
        .finally(() => {
          setEstimateProjectsLoading(false);
        });
    }
  }, [currentProject, router]);

  /**
   * プロジェクトを選択して見積もりページへ遷移
   */
  const handleSelectEstimateProject = useCallback((projectId: string) => {
    setIsEstimateModalOpen(false);
    router.push(`/projects/${projectId}/estimate`);
  }, [router]);

  /**
   * プロジェクト一覧を再取得する共通処理
   */
  const refreshProjectList = useCallback(async () => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const resp = await getProjects(1, 100);
      if (resp.error) {
        setProjectError(resp.error.message || 'プロジェクト一覧の取得に失敗しました');
        setProjectList([]);
      } else {
        const list = resp.data?.projects || [];
        setProjectList(list);
        return list;
      }
    } catch (error: unknown) {
      const err = toError(error);
      setProjectError(err.message || 'プロジェクト一覧の取得に失敗しました');
      setProjectList([]);
    } finally {
      setProjectLoading(false);
    }
    return [];
  }, []);

  /**
   * 「プロジェクトに保存」を選択時にプロジェクト一覧を取得してモーダルを開く
   */
  const openProjectSave = useCallback(async () => {
    try {
      setIsSaveModalOpen(false);
      const list = await refreshProjectList();
      // デフォルト選択は現在のプロジェクト、無ければ先頭
      const initial = currentProject?.id || (list[0]?.id ?? '');
      setSelectedProjectId(initial);
      setIsProjectSaveOpen(true);
    } catch (error: unknown) {
      const err = toError(error);
      setProjectError(err.message || 'プロジェクト一覧の取得に失敗しました');
      setIsProjectSaveOpen(true);
    }
  }, [currentProject?.id, refreshProjectList]);

  /**
   * プロジェクト作成成功時の処理
   */
  const handleProjectCreated = useCallback(async (project: Project) => {
    // プロジェクト一覧を更新
    const list = await refreshProjectList();
    // 作成されたプロジェクトを選択状態にする
    setSelectedProjectId(project.id);
    // プロジェクト作成モーダルを閉じる
    setIsProjectCreateModalOpen(false);
  }, [refreshProjectList]);

  /**
   * プロジェクトに保存を実行
   */
  const handleSaveToProject = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      setIsSavingToProject(true);
      const jsonStr = exportToJSON();
      const design_json = JSON.parse(jsonStr);
      
      // apiClientを使用して認証ヘッダーを自動付与
      const resp = await saveDrawing(selectedProjectId, design_json);
      
      if (resp.error) {
        throw new Error(resp.error.message || 'プロジェクト保存に失敗しました');
      }
      
      setIsProjectSaveOpen(false);
      // 簡易通知
      alert('プロジェクトに保存しました。');
    } catch (error: unknown) {
      const err = toError(error);
      console.error('プロジェクト保存に失敗しました', err);
      alert('プロジェクト保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSavingToProject(false);
    }
  }, [exportToJSON, selectedProjectId]);

  // PNGエクスポート完了処理（未使用）

  // Ctrl+S キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveClick]);

  return (
    <>
      <header className="glass-scope fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50">
        <div className="relative flex items-center gap-2 px-6 py-3">
          {/* コントロールボタン */}
          <div className="flex items-center gap-2">
            {/* リセットボタン */}
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="作図をリセット"
            >
              <RotateCcw size={18} />
              <div className={tooltipCls} role="tooltip">作図をリセット</div>
            </button>

            {/* 元に戻す */}
            <button
              onClick={undo}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="元に戻す (Ctrl+Z)"
            >
              <Undo2 size={18} />
              <div className={tooltipCls} role="tooltip">元に戻す (Ctrl+Z)</div>
            </button>

            {/* やり直す */}
            <button
              onClick={redo}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="やり直す (Ctrl+Y)"
            >
              <Redo2 size={18} />
              <div className={tooltipCls} role="tooltip">やり直す (Ctrl+Y)</div>
            </button>

          {/* 保存 */}
          <button
            onClick={handleSaveClick}
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
            aria-label="保存 (Ctrl+S)"
          >
            <Save size={18} />
            <div className={tooltipCls} role="tooltip">保存 (Ctrl+S)</div>
          </button>

            {/* インポート */}
            <button
              onClick={handleImportClick}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="インポート（JSON）"
              disabled={isImporting}
            >
              <Upload size={18} />
              <div className={tooltipCls} role="tooltip">インポート（JSON）</div>
            </button>

            {/* 見積もり作成 */}
            <button
              onClick={handleEstimateClick}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label="見積もり作成"
            >
              <FileText size={18} />
              <div className={tooltipCls} role="tooltip">見積もり作成</div>
            </button>

            {/* 区切り線 */}
            <div className="h-6 w-px bg-white/20 dark:bg-slate-700/50 mx-2" />

            {/* ステータスバー表示切替 */}
            <button
              onClick={toggleUnderbar}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label={underbarVisible ? 'ステータスバーを非表示' : 'ステータスバーを表示'}
            >
              {underbarVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              <div className={tooltipCls} role="tooltip">{underbarVisible ? 'ステータスバーを非表示' : 'ステータスバーを表示'}</div>
            </button>

            {/* テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <div className={tooltipCls} role="tooltip">{theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}</div>
            </button>
        </div>
      </div>
    </header>

    {/* 隠しファイル入力（JSONインポート用） */}
    <input
      ref={fileInputRef}
      type="file"
      accept="application/json,.json"
      className="hidden"
      onChange={handleImportFileChange}
    />

    {/* リセット確認モーダル */}
    <ConfirmModal
      isOpen={isResetModalOpen}
      onClose={() => setIsResetModalOpen(false)}
      onConfirm={handleResetConfirm}
      title="作図をリセット"
      description="すべての作図データ（足場、メモなど）が削除されます。この操作は取り消せません。リセットしてもよろしいですか？"
      confirmText="リセットする"
      cancelText="キャンセル"
      variant="destructive"
      className="reset-modal-card"
    />

    {/* 保存方法選択モーダル */}
    <Modal
      isOpen={isSaveModalOpen}
      onClose={() => setIsSaveModalOpen(false)}
      title="保存形式を選択"
      size="sm"
      className="save-modal-card"
      contentClassName="p-4"
      footer={
        <div className="flex items-center justify-between w-full">
          {/* 左側: プロジェクトに保存ボタン */}
          <Button
            size="sm"
            onClick={openProjectSave}
            className="bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600 !text-white shadow-[0_12px_32px_-16px_rgba(14,165,233,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(14,165,233,0.55)] hover:from-sky-600 hover:via-sky-500 hover:to-sky-700 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            <Save size={16} className="mr-2" />
            プロジェクトに保存
          </Button>
          {/* 右側: キャンセルボタン */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaveModalOpen(false)}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
          >
            キャンセル
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-center gap-4">
        {/* JSON保存ボタン */}
        <button
          onClick={handleSaveJSON}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/40 shadow-sm transition-all',
            'hover:border-primary/50 hover:bg-primary/5',
            'dark:hover:bg-primary/10',
            'dark:border-slate-700/50 dark:bg-slate-800/60',
            'cursor-pointer',
            'save-format-card'
          )}
          aria-label="JSON形式で保存"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <FileJson size={24} className="text-primary" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">JSON</span>
        </button>

        {/* PNG保存ボタン（プレビュー付き） */}
        <button
          onClick={handleOpenPngPreview}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/40 shadow-sm transition-all',
            'hover:border-primary/50 hover:bg-primary/5',
            'dark:hover:bg-primary/10',
            'dark:border-slate-700/50 dark:bg-slate-800/60',
            'cursor-pointer',
            'save-format-card'
          )}
          aria-label="PNG形式で保存（プレビュー付き）"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <ImageIcon size={24} className="text-primary" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">PNG</span>
        </button>
      </div>
    </Modal>

    {/* PNGプレビューモーダル（フルスクリーン） */}
    {isPngPreviewOpen && (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">

        {/* プレビュー画像エリア（画面いっぱい） */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          {previewImageUrl ? (
            <div
              className="relative w-full max-w-5xl max-h-full min-h-[200px]"
              style={{ height: 'min(80vh, 720px)' }}
            >
              <Image
                src={previewImageUrl}
                alt="PNG保存プレビュー"
                fill
                className="object-contain shadow-2xl border-4 border-white/20 rounded-xl"
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          ) : (
            <div className="text-white text-center">
              <div className="text-xl mb-4">⚠️ プレビュー画像がありません</div>
              <div className="text-sm opacity-70">コンソールログを確認してください</div>
            </div>
          )}
        </div>

        {/* 下部ボタンエリア */}
        <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* キャンセルボタン */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancelPngPreview}
            className="min-w-[150px] bg-white/10 !text-white !border-white/30 backdrop-blur-sm hover:bg-white/20 hover:!border-white/50"
          >
            キャンセル
          </Button>

          {/* 保存ボタン */}
          <Button
            size="lg"
            onClick={handleConfirmSavePNG}
            disabled={!previewImageUrl}
            className="min-w-[150px] bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600 !text-white shadow-[0_12px_32px_-16px_rgba(14,165,233,0.8)] hover:shadow-[0_16px_40px_-16px_rgba(14,165,233,0.7)] hover:from-sky-600 hover:via-sky-500 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon size={18} className="mr-2" />
            保存する
          </Button>
        </div>
      </div>
    )}

    {/* プロジェクト選択モーダル */}
    <Modal
      isOpen={isProjectSaveOpen}
      onClose={() => setIsProjectSaveOpen(false)}
      title="保存先のプロジェクトを選択"
      description="保存先のプロジェクトを選び、「保存する」を押してください"
      size="sm"
      className="project-save-card glass-scope"
      contentClassName="p-4"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsProjectSaveOpen(false)}
            disabled={isSavingToProject}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleSaveToProject}
            disabled={!selectedProjectId || isSavingToProject}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {isSavingToProject ? '保存中...' : '保存する'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {currentProject ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            現在のプロジェクト: <span className="font-semibold">{currentProject.name}</span>
          </p>
        ) : null}

        {projectError ? (
          <div className="text-sm text-red-600 dark:text-red-400">{projectError}</div>
        ) : null}

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          保存先プロジェクト
        </label>
        <select
          className="w-full rounded-lg border border-white/40 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 p-2 text-sm"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          disabled={projectLoading}
        >
          {projectLoading ? (
            <option>読み込み中...</option>
          ) : projectList.length === 0 ? (
            <option value="">プロジェクトがありません</option>
          ) : (
            projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>

        {/* 新規プロジェクト作成ボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsProjectCreateModalOpen(true)}
          disabled={projectLoading}
          className="w-full border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 dark:border-primary/40 dark:hover:border-primary/60 dark:hover:bg-primary/10"
        >
          <Plus size={16} className="mr-2" />
          新規プロジェクトを作成
        </Button>
      </div>
    </Modal>

    {/* 見積もり作成用プロジェクト選択モーダル */}
    <Modal
      isOpen={isEstimateModalOpen}
      onClose={() => setIsEstimateModalOpen(false)}
      title="見積もりを作成"
      description="プロジェクトを選択してください"
      size="md"
    >
      {estimateProjectsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-muted-foreground">プロジェクトを読み込み中...</span>
        </div>
      ) : estimateProjects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">プロジェクトが見つかりませんでした</p>
          <Button
            onClick={() => {
              setIsEstimateModalOpen(false);
              router.push('/dashboard/projects');
            }}
          >
            プロジェクトを作成
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {estimateProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelectEstimateProject(project.id)}
              className="w-full text-left p-4 rounded-lg border border-white/20 dark:border-slate-700/50 hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="font-medium text-card-foreground">{project.name}</div>
              {project.description && (
                <div className="text-sm text-muted-foreground mt-1">{project.description}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>

    {/* プロジェクト作成モーダル */}
    <ProjectCreateModal
      isOpen={isProjectCreateModalOpen}
      onClose={() => setIsProjectCreateModalOpen(false)}
      onSuccess={handleProjectCreated}
    />
    </>
  );
}

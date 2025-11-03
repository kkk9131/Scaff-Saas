/**
 * PngPreviewModal.tsx
 * PNG出力のプレビューモーダル（プレースホルダー実装）
 *
 * 現状の要件:
 * - Header から `isOpen`, `onClose`, `onExport` を受け取り、
 *   既存の `Modal` コンポーネントでプレビュー枠と操作ボタンを表示する。
 * - 実際のステージ→PNG画像生成は今後の実装に委ね、本モーダルは壊れない UI 土台のみ用意する。
 */

'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { exportStageToDataURL } from '@/lib/canvasStageRegistry';
import { useProjectStore } from '@/stores/projectStore';
import { useDrawingModeStore } from '@/stores/drawingModeStore';

/**
 * PngPreviewModal のプロパティ
 * @property isOpen - モーダルの開閉状態
 * @property onClose - 閉じるハンドラー
 * @property onExport - エクスポート実行ハンドラー（将来的にPNG保存をトリガー）
 */
export interface PngPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

/**
 * PNG出力プレビュー用モーダル（暫定実装）
 * - 画像プレビューの枠と説明、エクスポート/閉じるボタンを配置
 * - 実画像は今後、CanvasStage からPNGデータURLを受け取って表示する
 */
export default function PngPreviewModal({ isOpen, onClose, onExport }: PngPreviewModalProps) {
  const { currentProject } = useProjectStore();
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // 開いたタイミングでStageからPNGを生成
  React.useEffect(() => {
    if (!isOpen) {
      setDataUrl(null);
      return;
    }
    // 一時的にビューモードへ切替（発光UIの抑制）
    const prevMode = useDrawingModeStore.getState().currentMode;
    useDrawingModeStore.getState().setMode('view');
    // React/Canvas再描画を待ってからエクスポート
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        try {
          const url = exportStageToDataURL({ pixelRatio: 2, withWhiteBg: true, hideGrid: true });
          setDataUrl(url);
        } finally {
          useDrawingModeStore.getState().setMode(prevMode);
        }
      });
      // cleanup nested RAF if modal closed early
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const fileName = React.useMemo(() => {
    const base = currentProject?.name ? `scaffold-${currentProject.name}` : 'scaffold-drawing';
    const date = new Date().toISOString().split('T')[0];
    return `${base}-${date}.png`;
  }, [currentProject?.name]);

  const handleDownload = React.useCallback(() => {
    if (!dataUrl) return;
    try {
      setIsSaving(true);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onExport) onExport();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [dataUrl, fileName, onClose, onExport]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PNGプレビュー"
      size="xl"
      className="png-preview-modal glass-scope"
      contentClassName="p-0"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white !text-red-600 !border-red-400 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.25)] hover:bg-red-50 hover:!text-red-700 hover:!border-red-500 dark:bg-transparent dark:!text-red-400 dark:!border-red-500 dark:hover:bg-red-900/20"
            aria-label="キャンセル"
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 !text-white shadow-[0_12px_32px_-16px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-16px_rgba(16,185,129,0.55)] hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            aria-label="PNGを保存"
            isLoading={isSaving}
          >
            保存
          </Button>
        </div>
      }
    >
      <div className="flex max-h-[calc(100vh-16rem)] min-h-[60vh] items-center justify-center bg-white dark:bg-slate-900">
        {dataUrl ? (
          <img src={dataUrl} alt="PNGプレビュー" className="max-w-full max-h-[70vh] object-contain" />
        ) : (
          <div className="text-center text-sm text-slate-600 dark:text-slate-300 p-8">
            プレビューを生成しています...
          </div>
        )}
      </div>
    </Modal>
  );
}

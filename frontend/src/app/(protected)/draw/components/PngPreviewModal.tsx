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
  // 画像データURL（将来: 親から受け取り表示）
  const [dataUrl] = React.useState<string | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="PNGプレビュー" className="max-w-xl">
      <div className="p-4">
        {/* プレビュー領域（今はダミー） */}
        <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 min-h-[240px]">
          {dataUrl ? (
            // 実際のPNGプレビュー
            // 画像サイズが大きい場合に備えてmaxサイズを制限
            <img src={dataUrl} alt="PNGプレビュー" className="max-w-full max-h-[360px] object-contain" />
          ) : (
            <div className="text-center text-sm text-slate-600 dark:text-slate-300">
              PNGプレビューは準備中です
              <br />
              後続実装でキャンバスの画像をここに表示します
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} aria-label="閉じる">
            閉じる
          </Button>
          <Button onClick={onExport} aria-label="PNGを書き出す" disabled>
            書き出す（準備中）
          </Button>
        </div>
      </div>
    </Modal>
  );
}


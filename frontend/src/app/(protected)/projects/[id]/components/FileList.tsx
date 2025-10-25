'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * ガラスモーフィズム調のパネルスタイル
 * ダッシュボード全体で使用している質感に合わせるための共通クラス。
 */
const panelBaseClass =
  'relative overflow-hidden rounded-2xl border border-white/30 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-sky-500/10 dark:shadow-slate-900/50 transition-colors duration-300';

/**
 * プロジェクトファイル情報
 *
 * Supabase Storageや将来のAPIから取得したファイルをこの型で表現します。
 * サイズはバイト数として扱い、コンポーネント側で人が読める形へ整形します。
 */
export interface ProjectFileItem {
  id: string;
  name: string;
  type: 'dxf' | 'pdf' | 'image' | 'document' | 'other' | string;
  size: number;
  uploadedAt: string;
  url?: string;
}

export interface FileListProps {
  /**
   * 表示するファイルの配列。空配列または未定義の場合は空状態を表示します。
   */
  files?: ProjectFileItem[];

  /**
   * プレビュー操作を親側でフックしたい場合に使用
   */
  onPreview?: (file: ProjectFileItem) => void;

  /**
   * ダウンロード操作を親側でフックしたい場合に使用
   */
  onDownload?: (file: ProjectFileItem) => void;

  className?: string;
}

/**
 * ファイル種別ごとのアイコンをシンプルな絵文字で定義
 * 実際のプロダクトではlucide-react等へ差し替える予定です。
 */
function resolveIcon(type: ProjectFileItem['type']): string {
  if (type === 'dxf') return '📐';
  if (type === 'pdf') return '📄';
  if (type === 'image') return '🖼️';
  if (type === 'document') return '🗂️';
  return '📁';
}

/**
 * バイト数をKB/MBへ変換して表示するユーティリティ
 */
function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '未知';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 日時を「YYYY/MM/DD HH:mm」形式で表示
 */
function formatDateTime(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function FileList({ files = [], onPreview, onDownload, className }: FileListProps) {
  const hasFiles = files.length > 0;

  return (
    <section className={cn(panelBaseClass, 'p-6 space-y-4', className)}>
      <header>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">添付ファイル</h2>
      </header>

      {!hasFiles && (
        <p className="rounded-lg border border-dashed border-white/40 bg-white/70 p-6 text-center text-sm text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-gray-300">
          まだファイルが登録されていません。図面や写真をアップロードするとここに表示されます。
        </p>
      )}

      {hasFiles && (
        <ul className="space-y-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 rounded-xl border border-white/40 bg-white/80 p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-1 items-center gap-4">
                <span className="text-2xl" aria-hidden>
                  {resolveIcon(file.type)}
                </span>

                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(file.uploadedAt)}・{formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview?.(file)}
                  disabled={!onPreview}
                  iconLeft={<span aria-hidden>👀</span>}
                >
                  プレビュー
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onDownload) {
                      onDownload(file);
                      return;
                    }

                    if (file.url) {
                      window.open(file.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={!onDownload && !file.url}
                  iconLeft={<span aria-hidden>⬇️</span>}
                >
                  ダウンロード
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


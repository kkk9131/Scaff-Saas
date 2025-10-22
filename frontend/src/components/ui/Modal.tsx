'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * Modalコンポーネントのプロパティ型定義
 */
export interface ModalProps {
  /**
   * モーダルが開いているか
   */
  isOpen: boolean;

  /**
   * モーダルを閉じるハンドラー
   */
  onClose: () => void;

  /**
   * タイトル
   */
  title?: string;

  /**
   * 説明文
   */
  description?: string;

  /**
   * モーダルのサイズ
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * 子要素
   */
  children: React.ReactNode;

  /**
   * フッター（ボタンなど）
   */
  footer?: React.ReactNode;

  /**
   * オーバーレイクリックで閉じるか
   */
  closeOnOverlayClick?: boolean;

  /**
   * ESCキーで閉じるか
   */
  closeOnEsc?: boolean;

  /**
   * 閉じるボタンを表示するか
   */
  showCloseButton?: boolean;

  /**
   * 追加のCSSクラス
   */
  className?: string;
}

/**
 * Modalコンポーネント
 *
 * 汎用的なモーダルダイアログ
 * - 複数のサイズバリエーション
 * - アニメーション付き開閉
 * - アクセシビリティ対応（focus trap, ESCキー対応）
 * - オーバーレイクリック対応
 *
 * デザインコンセプト:
 * - 重要な情報や操作を強調
 * - 職人が手袋をつけていても操作しやすい大きなボタン
 * - 明確なアクションの視覚的分離
 *
 * 使用例:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="プロジェクトを削除"
 *   description="この操作は取り消せません"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>
 *         キャンセル
 *       </Button>
 *       <Button variant="destructive" onClick={handleDelete}>
 *         削除
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>本当に削除しますか？</p>
 * </Modal>
 * ```
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // サイズのマッピング
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  // ESCキーでモーダルを閉じる
  React.useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // モーダルが開いているときはbodyのスクロールを無効化
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // フォーカストラップ（モーダル内にフォーカスを閉じ込める）
  React.useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in-up"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full overflow-hidden rounded-xl bg-card shadow-2xl',
          'animate-scale-in',
          sizeClasses[size],
          className
        )}
      >
        {/* ヘッダー */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between border-b-2 border-gray-200 p-6">
            <div className="flex-1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-2xl font-bold leading-tight tracking-tight text-card-foreground"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-2 text-sm text-muted-foreground"
                >
                  {description}
                </p>
              )}
            </div>

            {/* 閉じるボタン */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center',
                  'rounded-lg text-muted-foreground',
                  'transition-all duration-200',
                  'hover:bg-accent/10 hover:text-accent hover:scale-110',
                  'active:scale-95',
                  'focus-visible-ring'
                )}
                aria-label="モーダルを閉じる"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* コンテンツ */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>

        {/* フッター */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t-2 border-gray-200 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 確認ダイアログコンポーネント
 * 削除などの重要な操作の確認に使用
 *
 * 使用例:
 * ```tsx
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="プロジェクトを削除"
 *   description="この操作は取り消せません。本当に削除しますか？"
 *   confirmText="削除"
 *   variant="destructive"
 * />
 * ```
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    />
  );
};

export { Modal };

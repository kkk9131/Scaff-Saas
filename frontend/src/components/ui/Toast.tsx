'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Toast通知の種類
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast通知の型定義
 */
export interface Toast {
  /**
   * 一意のID
   */
  id: string;

  /**
   * タイトル
   */
  title: string;

  /**
   * 説明文（オプション）
   */
  description?: string;

  /**
   * 通知の種類
   */
  type?: ToastType;

  /**
   * 表示時間（ミリ秒）
   */
  duration?: number;
}

/**
 * Toastコンテキストの型定義
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

/**
 * Toastコンテキスト
 */
const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

/**
 * useToast Hook
 * Toast通知を表示するためのフック
 *
 * 使用例:
 * ```tsx
 * const { toast } = useToast();
 *
 * toast({
 *   title: '保存しました',
 *   description: 'プロジェクトが正常に保存されました',
 *   type: 'success',
 * });
 * ```
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = (toastData: Omit<Toast, 'id'>) => {
    context.addToast(toastData);
  };

  return { toast, toasts: context.toasts };
};

/**
 * ToastProviderコンポーネント
 * アプリケーション全体でToast通知を管理
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toastData: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        duration: 5000,
        ...toastData,
      };

      setToasts((prev) => [...prev, newToast]);

      // 指定時間後に自動削除
      if (newToast.duration) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * ToastContainerコンポーネント
 * Toast通知を画面に表示するコンテナ
 */
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-3 p-4 sm:bottom-auto sm:top-0 sm:flex-col md:max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

/**
 * ToastItemコンポーネント
 * 個別のToast通知
 */
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getToastStyles = (type: ToastType = 'info') => {
    const baseStyles =
      'pointer-events-auto flex w-full items-start gap-3 rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-in-right';

    const typeStyles = {
      success: 'border-success/50 bg-success/10 text-success-foreground',
      error:
        'border-destructive/50 bg-destructive/10 text-destructive-foreground',
      warning: 'border-warning/50 bg-warning/10 text-warning-foreground',
      info: 'border-accent/50 bg-accent/10 text-accent-foreground',
    };

    return cn(baseStyles, typeStyles[type]);
  };

  const getIcon = (type: ToastType = 'info') => {
    const icons = {
      success: (
        // チェックマークアイコン
        <svg
          className="h-6 w-6 flex-shrink-0 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      error: (
        // エラーアイコン
        <svg
          className="h-6 w-6 flex-shrink-0 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      warning: (
        // 警告アイコン
        <svg
          className="h-6 w-6 flex-shrink-0 text-warning"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      info: (
        // 情報アイコン
        <svg
          className="h-6 w-6 flex-shrink-0 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    };

    return icons[type];
  };

  return (
    <div className={getToastStyles(toast.type)}>
      {/* アイコン */}
      {getIcon(toast.type)}

      {/* コンテンツ */}
      <div className="flex-1">
        <p className="font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="通知を閉じる"
      >
        <svg
          className="h-5 w-5"
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
    </div>
  );
};

export { ToastContainer, ToastItem };

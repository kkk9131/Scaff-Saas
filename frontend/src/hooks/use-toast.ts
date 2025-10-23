/**
 * Toast通知フック（簡易実装）
 */

import { useState, useCallback } from 'react';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: ToastProps) => {
    // 簡易的なアラート表示（本来はToastコンポーネントで表示）
    const message = props.description
      ? `${props.title}\n${props.description}`
      : props.title;

    if (props.variant === 'destructive') {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }

    setToasts((prev) => [...prev, props]);
  }, []);

  return { toast, toasts };
}
